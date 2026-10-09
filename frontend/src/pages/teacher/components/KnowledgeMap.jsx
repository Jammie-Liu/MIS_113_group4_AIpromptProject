import { useState } from 'react'
import { TEAM_COLORS } from '../data.js'

const TEAM_LETTERS = Object.keys(TEAM_COLORS)

function nodePosition(index, total) {
  const angle = (-90 + (360 * index) / total) * (Math.PI / 180)
  return { x: 50 + 37 * Math.cos(angle), y: 50 + 35 * Math.sin(angle) }
}

function TeamDot({ letter }) {
  return <span className="km-dot" style={{ '--dot': TEAM_COLORS[letter] }}>{letter}</span>
}

/*
  集體知識地圖：預設是以議題為中心的放射狀心智圖，可切換成「面向 × 隊伍」表格。
  nodes 由 Arena 持有並隨即時事件更新；flash 記錄最近一次被更新的面向，
  用 key 重新掛載來重播節點彈跳與連線發光動畫。
*/
export default function KnowledgeMap({ topic, nodes, flash }) {
  const [view, setView] = useState('mind')

  const covered = nodes.filter((n) => n.teams.length > 0).length

  return (
    <div className="km">
      <div className="km-toolbar">
        <div className="km-summary"><b>{covered}</b> / {nodes.length} 個面向已有隊伍涵蓋</div>
        <div className="km-switch" role="tablist" aria-label="地圖檢視方式">
          <button type="button" role="tab" aria-selected={view === 'mind'} className={view === 'mind' ? 'active' : ''} onClick={() => setView('mind')}>心智圖</button>
          <button type="button" role="tab" aria-selected={view === 'matrix'} className={view === 'matrix' ? 'active' : ''} onClick={() => setView('matrix')}>表格</button>
        </div>
      </div>

      {view === 'mind' ? (
        <>
          <div className="km-mind">
            <svg className="km-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {nodes.map((node, i) => {
                const { x, y } = nodePosition(i, nodes.length)
                const flashed = flash && flash.dim === node.dim
                return (
                  <line
                    key={`${node.dim}-${flashed ? flash.at : 0}`}
                    className={`km-line${node.teams.length === 0 ? ' empty' : ''}${flashed ? ' flash' : ''}`}
                    x1="50" y1="50" x2={x} y2={y}
                    style={{ '--cov': node.teams.length / TEAM_LETTERS.length }}
                  />
                )
              })}
            </svg>

            <div className="km-center">
              <span>議題</span>
              <b>{topic}</b>
            </div>

            {nodes.map((node, i) => {
              const { x, y } = nodePosition(i, nodes.length)
              const flashed = flash && flash.dim === node.dim
              const empty = node.teams.length === 0
              return (
                <div
                  key={node.dim}
                  className={`km-node${empty ? ' empty' : ''}${node.origin === 'team' ? ' origin' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%`, '--cov': node.teams.length / TEAM_LETTERS.length }}
                >
                  {flashed && <span key={`ping-${flash.at}`} className="km-ping" aria-hidden="true" />}
                  <div key={flashed ? flash.at : 'idle'} className={`km-node-body${flashed ? ' pop' : ''}`}>
                    {node.origin === 'team' && <span className="km-origin-tag">隊伍自創</span>}
                    <span className="km-node-title">{node.dim}</span>
                    {empty ? (
                      <span className="km-node-empty">? 尚無隊伍涵蓋</span>
                    ) : (
                      <span className="km-node-dots">{node.teams.map((letter) => <TeamDot letter={letter} key={letter} />)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
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
