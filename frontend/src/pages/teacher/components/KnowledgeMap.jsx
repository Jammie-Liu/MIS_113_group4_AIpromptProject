import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TEAM_COLORS } from '../data.js'

const TEAM_LETTERS = Object.keys(TEAM_COLORS)

function TeamDot({ letter }) {
  return <span className="km-dot" style={{ '--dot': TEAM_COLORS[letter] }}>{letter}</span>
}

// 元素相對於 root 的位置與大小（用 offsetLeft/offsetTop 一路往上加，不受進場動畫的縮放影響）
function boxOf(el, root) {
  let x = 0
  let y = 0
  let node = el
  while (node && node !== root) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

// 兩點之間畫一條水平出入的平滑曲線
function curve(x1, y1, x2, y2) {
  const dx = (x2 - x1) / 2
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

/*
  集體知識地圖：預設是以議題為中心的心智圖，可切換成「面向 × 隊伍」表格。
  心智圖是左右展開：議題在中間，每個面向是一個分支節點；點一下節點才會長出分支，
  每條分支是一位同學在這個面向的回答（node.answers），預設全部收起來，畫面才不會太亂。
  nodes 由 Arena 持有並隨即時事件更新；flash 記錄最近一次被更新的面向與隊伍，
  用 key 重新掛載來重播節點彈跳與連線發光動畫。
  連線是用量測 DOM 位置後畫 SVG 曲線，所以版面（寬度、分支數量）怎麼變都會接得起來。
*/
export default function KnowledgeMap({ topic, nodes, flash }) {
  const [view, setView] = useState('mind')
  const [open, setOpen] = useState(() => new Set()) // 目前展開回答的面向
  const [fresh, setFresh] = useState(() => new Set()) // 收著的面向收到新回答時，在節點上標「新」
  const [paths, setPaths] = useState([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  const mindRef = useRef(null)
  const centerRef = useRef(null)
  const nodeEls = useRef({})
  const leafEls = useRef({})

  const covered = nodes.filter((n) => n.teams.length > 0).length
  const expandable = nodes.filter((n) => n.teams.length > 0)
  const allOpen = expandable.length > 0 && expandable.every((n) => open.has(n.dim))

  function toggleDim(dim) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(dim)) next.delete(dim)
      else next.add(dim)
      return next
    })
    setFresh((prev) => {
      if (!prev.has(dim)) return prev
      const next = new Set(prev)
      next.delete(dim)
      return next
    })
  }

  function toggleAll() {
    setOpen(allOpen ? new Set() : new Set(expandable.map((n) => n.dim)))
    setFresh(new Set())
  }

  // 有新回答進來時：已展開的面向直接長出新分支；收著的面向在節點上標「新」，等老師點開
  useEffect(() => {
    if (!flash) return
    setFresh((prev) => (open.has(flash.dim) ? prev : new Set(prev).add(flash.dim)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash])
  const half = Math.ceil(nodes.length / 2)
  const sides = [
    { side: 'right', items: nodes.slice(0, half) },
    { side: 'left', items: nodes.slice(half) },
  ]

  // 版面變動時重算連線
  useLayoutEffect(() => {
    const root = mindRef.current
    if (view !== 'mind' || !root || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => setSize({ w: root.offsetWidth, h: root.offsetHeight }))
    observer.observe(root)
    return () => observer.disconnect()
  }, [view])

  useLayoutEffect(() => {
    const root = mindRef.current
    const center = centerRef.current
    if (view !== 'mind' || !root || !center) return
    // 窄螢幕改成上下堆疊，不畫連線
    if (root.offsetWidth < 720) {
      setPaths([])
      return
    }
    const c = boxOf(center, root)
    const next = []
    sides.forEach(({ side, items }) => {
      items.forEach((node) => {
        const nodeEl = nodeEls.current[node.dim]
        if (!nodeEl) return
        const n = boxOf(nodeEl, root)
        const flashed = flash && flash.dim === node.dim
        const empty = node.teams.length === 0
        const fromX = side === 'right' ? c.x + c.w : c.x
        const toX = side === 'right' ? n.x : n.x + n.w
        next.push({
          id: `c-${node.dim}`,
          d: curve(fromX, c.y + c.h / 2, toX, n.y + n.h / 2),
          cls: `km-line${empty ? ' empty' : ''}${flashed ? ' flash' : ''}`,
          cov: node.teams.length / TEAM_LETTERS.length,
          flashKey: flashed ? flash.at : 0,
        })
        if (!open.has(node.dim)) return
        node.teams.forEach((letter) => {
          const leafEl = leafEls.current[`${node.dim}|${letter}`]
          if (!leafEl) return
          const l = boxOf(leafEl, root)
          const leafFlash = flashed && flash.team === letter
          next.push({
            id: `l-${node.dim}-${letter}`,
            d: curve(side === 'right' ? n.x + n.w : n.x, n.y + n.h / 2, side === 'right' ? l.x : l.x + l.w, l.y + l.h / 2),
            cls: `km-line leaf${leafFlash ? ' flash' : ''}`,
            color: TEAM_COLORS[letter],
            flashKey: leafFlash ? flash.at : 0,
          })
        })
      })
    })
    setPaths(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, flash, view, size, open])

  function renderBranch(node, side) {
    const flashed = flash && flash.dim === node.dim
    const empty = node.teams.length === 0
    const letters = TEAM_LETTERS.filter((letter) => node.teams.includes(letter))
    const isOpen = open.has(node.dim)
    return (
      <div className={`km-branch ${side}`} key={node.dim}>
        <div
          ref={(el) => { nodeEls.current[node.dim] = el }}
          className={`km-node${empty ? ' empty' : ''}${node.origin === 'team' ? ' origin' : ''}${isOpen ? ' open' : ''}`}
          style={{ '--cov': node.teams.length / TEAM_LETTERS.length }}
        >
          {flashed && <span key={`ping-${flash.at}`} className="km-ping" aria-hidden="true" />}
          <button
            type="button"
            key={flashed ? flash.at : 'idle'}
            className={`km-node-body${flashed ? ' pop' : ''}`}
            disabled={empty}
            aria-expanded={empty ? undefined : isOpen}
            onClick={() => toggleDim(node.dim)}
          >
            {node.origin === 'team' && <span className="km-origin-tag">隊伍自創</span>}
            {fresh.has(node.dim) && !isOpen && <span className="km-new-tag">新回答</span>}
            <span className="km-node-title">{node.dim}</span>
            {empty ? (
              <span className="km-node-empty">? 尚無隊伍涵蓋</span>
            ) : (
              <>
                <span className="km-node-dots">{letters.map((letter) => <TeamDot letter={letter} key={letter} />)}</span>
                <span className="km-node-more">{isOpen ? '▲ 收起回答' : `▼ 看 ${letters.length} 則回答`}</span>
              </>
            )}
          </button>
        </div>
        {isOpen && letters.length > 0 && (
          <div className="km-leaves">
            {letters.map((letter) => {
              const answer = node.answers?.[letter]
              const leafFlashed = flashed && flash.team === letter
              return (
                <div
                  key={`${letter}-${leafFlashed ? flash.at : 0}`}
                  ref={(el) => { leafEls.current[`${node.dim}|${letter}`] = el }}
                  className={`km-leaf${leafFlashed ? ' pop' : ''}`}
                  style={{ '--dot': TEAM_COLORS[letter] }}
                >
                  <div className="km-leaf-who"><TeamDot letter={letter} /><b>{answer?.who ?? `${letter} 隊`}</b><small>{letter} 隊</small></div>
                  <p>{answer ? `「${answer.text}」` : '（這位同學的回答摘要整理中）'}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="km">
      <div className="km-toolbar">
        <div className="km-summary"><b>{covered}</b> / {nodes.length} 個面向已有隊伍涵蓋</div>
        {view === 'mind' && expandable.length > 0 && (
          <button type="button" className="km-expand-all" onClick={toggleAll}>{allOpen ? '全部收起' : '全部展開回答'}</button>
        )}
        <div className="km-switch" role="tablist" aria-label="地圖檢視方式">
          <button type="button" role="tab" aria-selected={view === 'mind'} className={view === 'mind' ? 'active' : ''} onClick={() => setView('mind')}>心智圖</button>
          <button type="button" role="tab" aria-selected={view === 'matrix'} className={view === 'matrix' ? 'active' : ''} onClick={() => setView('matrix')}>表格</button>
        </div>
      </div>

      {view === 'mind' ? (
        <div className="km-mind" ref={mindRef}>
          <svg className="km-lines" width="100%" height="100%" aria-hidden="true">
            {paths.map((path) => (
              <path
                key={`${path.id}-${path.flashKey}`}
                d={path.d}
                className={path.cls}
                style={path.color ? { stroke: path.color } : { '--cov': path.cov }}
              />
            ))}
          </svg>

          <div className="km-side left">{sides[1].items.map((node) => renderBranch(node, 'left'))}</div>
          <div className="km-center" ref={centerRef}>
            <span>議題</span>
            <b>{topic}</b>
          </div>
          <div className="km-side right">{sides[0].items.map((node) => renderBranch(node, 'right'))}</div>
        </div>
      ) : (
        <div className="km-matrix-wrap">
          <table className="km-matrix">
            <thead>
              <tr>
                <th>解方面向</th>
                {TEAM_LETTERS.map((letter) => <th key={letter}><TeamDot letter={letter} /></th>)}
                <th>涵蓋</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => {
                const flashed = flash && flash.dim === node.dim
                return (
                  <tr key={`${node.dim}-${flashed ? flash.at : 0}`} className={`${node.teams.length === 0 ? 'empty' : ''}${flashed ? ' flash' : ''}`}>
                    <td className="km-matrix-dim">
                      {node.dim}
                      {node.origin === 'team' && <span className="km-origin-tag">自創</span>}
                    </td>
                    {TEAM_LETTERS.map((letter) => (
                      <td key={letter} className="km-matrix-cell">
                        {node.teams.includes(letter)
                          ? <i className="km-cell-on" style={{ '--dot': TEAM_COLORS[letter] }} aria-label={`${letter} 隊已涵蓋`} />
                          : <i className="km-cell-off" aria-label={`${letter} 隊未涵蓋`} />}
                      </td>
                    ))}
                    <td className="km-matrix-count">{node.teams.length === 0 ? <em>待探索</em> : `${node.teams.length}/${TEAM_LETTERS.length}`}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>各隊涵蓋面向數</td>
                {TEAM_LETTERS.map((letter) => (
                  <td key={letter}>{nodes.filter((n) => n.teams.includes(letter)).length}</td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
