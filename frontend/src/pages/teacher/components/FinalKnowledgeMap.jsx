import { useRef, useState, useEffect } from 'react'
import { TEAM_COLORS } from '../data.js'
import { buildFinalMap } from '../scoring.js'

const LEVEL_LABEL = { 0: '沒提到', 1: '帶過', 2: '有具體做法' }

function Cell({ cell, letter }) {
  if (cell.excluded) {
    return <span className="fk-cell excluded" title={`幻覺不計：${cell.excluded}`} aria-label={`${letter} 隊此面向因幻覺不計`}>!</span>
  }
  return (
    <span
      className={`fk-cell level-${cell.level}`}
      style={{ '--dot': TEAM_COLORS[letter] }}
      title={`${letter} 隊：${LEVEL_LABEL[cell.level]}`}
      aria-label={`${letter} 隊：${LEVEL_LABEL[cell.level]}`}
    />
  )
}

function rowTag(row, teamCount) {
  if (row.covered.length === 0) return { text: '全班漏洞', tone: 'gap' }
  if (row.covered.length === 1) return { text: `獨家・${row.covered[0]} 隊`, tone: 'solo' }
  if (row.origin === 'team') return { text: '隊伍自創', tone: 'origin' }
  if (row.covered.length >= teamCount - 1) return { text: '全班共識', tone: 'common' }
  return null
}

/*
  賽後的集體知識地圖：跟監控台的「即時」版不同，這裡看的是整場結束後各隊
  對每個面向做得多深（0 沒提到／1 帶過／2 有具體做法），被扣幻覺分的面向不計，
  並標出全班漏洞與獨家貢獻，適合投影在課堂上帶全班檢討。
*/
export default function FinalKnowledgeMap({ teams, caseName }) {
  const rootRef = useRef(null)
  const [presenting, setPresenting] = useState(false)
  const rows = buildFinalMap(teams)
  const letters = teams.map((t) => t.id)
  const official = rows.filter((r) => r.origin === 'official')
  const gaps = rows.filter((r) => r.covered.length === 0)
  const created = rows.filter((r) => r.origin === 'team')
  const depthAvg = official.reduce((sum, r) => sum + letters.reduce((s, id) => s + r.cells[id].level, 0), 0) / (official.length * letters.length)

  useEffect(() => {
    function onChange() { setPresenting(Boolean(document.fullscreenElement)) }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function togglePresent() {
    const el = rootRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => setPresenting((value) => !value))
    } else {
      setPresenting((value) => !value)
    }
  }

  const contributions = teams.map((team) => {
    const id = team.id
    return {
      team,
      solid: rows.filter((r) => r.cells[id].level === 2).length,
      brief: rows.filter((r) => r.cells[id].level === 1).length,
      solo: rows.filter((r) => r.covered.length === 1 && r.covered[0] === id).length,
      excluded: rows.filter((r) => r.cells[id].excluded).length,
    }
  })
  const maxSolid = Math.max(1, ...contributions.map((c) => c.solid + c.brief))

  return (
    <div className={`fk${presenting ? ' presenting' : ''}`} ref={rootRef}>
      <div className="fk-head">
        <div>
          <p className="arena-section-kicker">FINAL KNOWLEDGE MAP</p>
          <h3>整場競賽的解方面向地圖</h3>
          <p className="fk-sub">議題：{caseName}・看各隊對每個面向做得多深，找出全班漏洞與獨家貢獻</p>
        </div>
        <button type="button" className="fk-present" onClick={togglePresent}>{presenting ? '離開投影模式' : '投影模式 ⛶'}</button>
      </div>

      <div className="fk-stats">
        <div><b>{rows.length}</b><span>面向總數</span></div>
        <div><b>{official.length - official.filter((r) => r.covered.length === 0).length}<small>/{official.length}</small></b><span>官方面向被涵蓋</span></div>
        <div className={gaps.length > 0 ? 'warn' : ''}><b>{gaps.length}</b><span>全班漏洞</span></div>
        <div><b>{created.length}</b><span>隊伍自創面向</span></div>
        <div><b>{depthAvg.toFixed(1)}<small>/2</small></b><span>平均涵蓋深度</span></div>
      </div>

      <div className="fk-body">
        <div className="fk-matrix-wrap">
          <table className="fk-matrix">
            <thead>
              <tr>
                <th>解方面向</th>
                {letters.map((id) => <th key={id}><span className="km-dot" style={{ '--dot': TEAM_COLORS[id] }}>{id}</span></th>)}
                <th>涵蓋</th>
                <th>標籤</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const tag = rowTag(row, letters.length)
                return (
                  <tr key={row.dim} className={tag?.tone === 'gap' ? 'gap' : ''}>
                    <td className="fk-dim">{row.dim}</td>
                    {letters.map((id) => <td key={id}><Cell cell={row.cells[id]} letter={id} /></td>)}
                    <td className="fk-count">{row.covered.length}<small>/{letters.length}</small></td>
                    <td>{tag && <span className={`fk-tag ${tag.tone}`}>{tag.text}</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="fk-legend">
            <span><i className="fk-cell level-2" style={{ '--dot': '#C5F36B' }} />有具體做法</span>
            <span><i className="fk-cell level-1" style={{ '--dot': '#C5F36B' }} />帶過</span>
            <span><i className="fk-cell level-0" />沒提到</span>
            <span><i className="fk-cell excluded">!</i>幻覺不計</span>
          </div>
        </div>

        <aside className="fk-side">
          <h4>各隊貢獻</h4>
          <ul>
            {contributions.map(({ team, solid, brief, solo, excluded }) => (
              <li key={team.id}>
                <div className="fk-side-top">
                  <span className="km-dot" style={{ '--dot': TEAM_COLORS[team.id] }}>{team.id}</span>
                  <b>{team.name}</b>
                  <span className="fk-side-meta">
                    {solo > 0 && <em className="solo">獨家 {solo}</em>}
                    {excluded > 0 && <em className="excluded">幻覺不計 {excluded}</em>}
                  </span>
                </div>
                <div className="fk-bar" title={`具體 ${solid}、帶過 ${brief}`}>
                  <span className="solid" style={{ width: `${(solid / maxSolid) * 100}%`, background: TEAM_COLORS[team.id] }} />
                  <span className="brief" style={{ width: `${(brief / maxSolid) * 100}%`, background: TEAM_COLORS[team.id] }} />
                </div>
                <small>具體做法 {solid}・帶過 {brief}</small>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
