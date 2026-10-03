import { useState } from 'react'
import { GRADE_DATA, FINAL_RANKING } from '../data.js'
import { playSuccess, playToggle } from '../sound.js'

const TABS = [
  { id: 'kmap', label: '集體知識地圖' },
  { id: 'grade', label: '評分作業' },
  { id: 'final', label: '最終排名' },
]

function GradeCard({ g, idx }) {
  const [graded, setGraded] = useState(false)
  const [score, setScore] = useState(g.teacherScore)
  const [note, setNote] = useState(g.teacherNote)

  return (
    <div className={`grade-card pop-in${graded ? ' graded' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
      <div className="grade-top"><span className="team">{g.team}</span><span className="peer-avg">各組互評平均：{g.peerAvg} 分</span></div>
      <div className="grade-solution-label">該隊最終解方</div>
      <div className="solution-block">{g.solution}</div>
      <div className="ai-eval"><span className="tag">AI 評分建議</span><div>{g.aiNote} 建議分數 <b>{g.aiScore}</b>。</div></div>
      <div className="grade-inputs">
        <label style={{ fontSize: 12.5, color: 'var(--ink-soft)', paddingTop: 8 }}>老師分數</label>
        <input type="number" value={score} disabled={graded} onChange={(e) => setScore(e.target.value)} />
        <label style={{ fontSize: 12.5, color: 'var(--ink-soft)', paddingTop: 8 }}>老師評語</label>
        <textarea value={note} disabled={graded} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="grade-foot">
        <button className="hint-btn sm" onClick={() => { setGraded((v) => !v); graded ? playToggle() : playSuccess() }}>{graded ? '修改評分' : '儲存並發布此隊成績'}</button>
      </div>
    </div>
  )
}

export default function Results({ onBackHome }) {
  const [activeTab, setActiveTab] = useState('kmap')

  return (
    <>
      <div className="res-tabs">
        {TABS.map((tab) => (
          <button key={tab.id} className={`res-tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'kmap' && (
        <div className="res-view active">
          <div className="panel">
            <div className="eyebrow" style={{ textAlign: 'center' }}>議題心智圖：解方面向 × 各隊涵蓋狀況</div>
            <div className="mindmap-wrap">
              <svg className="mm-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="50" y1="50" x2="50" y2="8" stroke="#DEDCD0" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="82" y2="20" stroke="#DEDCD0" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="94" y2="50" stroke="#DEDCD0" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="82" y2="80" stroke="#DEDCD0" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="50" y2="92" stroke="#DEDCD0" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="18" y2="80" stroke="#DEDCD0" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="6" y2="50" stroke="#DEDCD0" strokeWidth="0.6" />
                <line x1="50" y1="50" x2="18" y2="20" stroke="#DEDCD0" strokeWidth="0.6" />
              </svg>
              <div className="mm-node mm-center" style={{ left: '50%', top: '50%' }}>供應鏈<br />勞動爭議</div>
              <div className="mm-node mm-dim" style={{ left: '50%', top: '8%' }}>
                <div className="t">財務影響量化</div>
                <div className="chips"><div className="mm-chip" style={{ background: 'var(--d1)' }}>A</div><div className="mm-chip" style={{ background: 'var(--d2)' }}>B</div><div className="mm-chip" style={{ background: 'var(--d3)' }}>C</div></div>
              </div>
              <div className="mm-node mm-dim origin" style={{ left: '82%', top: '20%' }}>
                <div className="origin-tag">隊伍自創</div>
                <div className="t">供應商違規紀錄查證</div>
                <div className="chips"><div className="mm-chip" style={{ background: 'var(--d2)' }}>B</div><div className="mm-chip" style={{ background: 'var(--team-e)' }}>E</div></div>
              </div>
              <div className="mm-node mm-dim" style={{ left: '94%', top: '50%' }}>
                <div className="t">員工／客戶影響評估</div>
                <div className="chips"><div className="mm-chip" style={{ background: 'var(--d4)' }}>D</div><div className="mm-chip" style={{ background: 'var(--team-e)' }}>E</div></div>
              </div>
              <div className="mm-node mm-dim origin" style={{ left: '82%', top: '80%' }}>
                <div className="origin-tag">隊伍自創</div>
                <div className="t">消費者輿情監測</div>
                <div className="chips"><div className="mm-chip" style={{ background: 'var(--d1)' }}>A</div></div>
              </div>
              <div className="mm-node mm-dim empty" style={{ left: '50%', top: '92%' }}>
                <div className="t">執行時程與風險</div>
                <div className="empty-note">全班漏洞 · 可推空白區域卡</div>
              </div>
              <div className="mm-node mm-dim" style={{ left: '18%', top: '80%' }}>
                <div className="t">替代方案比較</div>
                <div className="chips"><div className="mm-chip" style={{ background: 'var(--d2)' }}>B</div><div className="mm-chip" style={{ background: 'var(--d3)' }}>C</div></div>
              </div>
              <div className="mm-node mm-dim" style={{ left: '6%', top: '50%' }}>
                <div className="t">倫理／法遵考量</div>
                <div className="chips"><div className="mm-chip" style={{ background: 'var(--d1)' }}>A</div></div>
              </div>
              <div className="mm-node mm-dim" style={{ left: '18%', top: '20%' }}>
                <div className="t">溝通／揭露策略</div>
                <div className="chips"><div className="mm-chip" style={{ background: 'var(--d4)' }}>D</div></div>
              </div>
            </div>
            <div className="mm-legend">
              <div className="mm-legend-group"><span className="mm-chip" style={{ background: 'var(--d1)' }}>A</span><span className="mm-legend-label">A 隊</span></div>
              <div className="mm-legend-group"><span className="mm-chip" style={{ background: 'var(--d2)' }}>B</span><span className="mm-legend-label">B 隊</span></div>
              <div className="mm-legend-group"><span className="mm-chip" style={{ background: 'var(--d3)' }}>C</span><span className="mm-legend-label">C 隊</span></div>
              <div className="mm-legend-group"><span className="mm-chip" style={{ background: 'var(--d4)' }}>D</span><span className="mm-legend-label">D 隊</span></div>
              <div className="mm-legend-group"><span className="mm-chip" style={{ background: 'var(--team-e)' }}>E</span><span className="mm-legend-label">E 隊</span></div>
            </div>
            <div className="mm-legend-key">
              <div className="mm-legend-key-item"><span className="mm-legend-swatch-box" style={{ border: '1.5px solid var(--line)', background: '#fff' }}></span>官方解方檢查清單面向</div>
              <div className="mm-legend-key-item"><span className="mm-legend-swatch-box" style={{ border: '1.5px dashed var(--team-e)', background: '#F5F0FB' }}></span>隊伍自己想出、清單外的面向</div>
              <div className="mm-legend-key-item"><span className="mm-legend-swatch-box" style={{ border: '1.5px dashed var(--d1)', background: '#FBEAEC' }}></span>全班都沒覆蓋到（可推空白區域卡）</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'grade' && (
        <div className="res-view active">
          <div>
            {GRADE_DATA.map((g, idx) => <GradeCard g={g} idx={idx} key={g.team} />)}
          </div>
        </div>
      )}

      {activeTab === 'final' && (
        <div className="res-view active">
          <div className="panel">
            <div className="eyebrow">最終排名（各組互評 + 老師評分 + AI 評分 加權後）</div>
            <table className="lead-table">
              <thead><tr><th>名次</th><th>隊伍</th><th>互評</th><th>老師</th><th>AI</th><th>總分</th></tr></thead>
              <tbody>
                {FINAL_RANKING.map((r) => (
                  <tr key={r.team}>
                    <td className="rk">{r.rank}</td><td>{r.team}</td><td className="mono">{r.peer}</td><td className="mono">{r.teacher}</td><td className="mono">{r.ai}</td><td className="mono">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="hint-btn sm" onClick={onBackHome}>
                <span className="btn-ic">
                  <svg className="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 11.5 12 4.5l8.5 7" /><path d="M5.5 10v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10" /><path d="M9.5 19.5V14a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" /></svg>
                </span> 回首頁
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
