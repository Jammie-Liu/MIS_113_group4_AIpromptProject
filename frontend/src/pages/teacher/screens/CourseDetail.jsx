import { useState, useRef, Fragment } from 'react'
import Modal from '../components/Modal.jsx'
import { CASE_OPTIONS, CASE_DEFAULTS, FIXED_ROUNDS, ROSTER, PAST_COMPETITIONS, generateArenaCode, copyText } from '../data.js'

const TABS = [
  { id: 'syllabus', label: '課程大綱' },
  { id: 'roster', label: '學生名單' },
  { id: 'history', label: '過往競賽紀錄' },
]

export default function CourseDetail({ course, onBack, onStartArena }) {
  const [activeTab, setActiveTab] = useState('syllabus')
  const [openPc, setOpenPc] = useState({})
  const [expandedStudent, setExpandedStudent] = useState(null)

  const [setupOpen, setSetupOpen] = useState(false)
  const [caseValue, setCaseValue] = useState(CASE_OPTIONS[0])
  const [timeLimit, setTimeLimit] = useState('8')
  const [code, setCode] = useState('')
  const [link, setLink] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [qrShown, setQrShown] = useState(false)
  const [copyToast, setCopyToast] = useState('')
  const copyToastTimer = useRef(null)

  function flashCopyToast(msg) {
    setCopyToast(msg)
    window.clearTimeout(copyToastTimer.current)
    copyToastTimer.current = window.setTimeout(() => setCopyToast(''), 1800)
  }

  function openSetup() {
    setSetupOpen(true)
    if (!code) {
      const g = generateArenaCode()
      setCode(g.code)
      setLink(g.link)
      setQrUrl(g.qrUrl)
    }
  }

  function handleCaseChange(e) {
    const value = e.target.value
    setCaseValue(value)
    const d = CASE_DEFAULTS[value]
    if (d) setTimeLimit(String(d.time))
  }

  function handleStart() {
    const caseName = caseValue.replace(/(?:（|\().*$/, '').trim()
    onStartArena({ caseName, timeLimit, code })
    setSetupOpen(false)
  }

  function togglePc(id) {
    setOpenPc((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      <button className="hint-btn ghost sm" style={{ marginBottom: 14 }} onClick={onBack}>← 返回上一頁</button>
      <div className="course-head">
        <div>
          <h2>{course.title}</h2>
          <div className="meta">{course.detailMeta}</div>
        </div>
        <button className="hint-btn" onClick={openSetup}>
          <span className="btn-ic">
            <svg className="icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4h10v4.2a5 5 0 0 1-10 0z" /><path d="M7 5.2H4.3A2.8 2.8 0 0 0 7 9.5" /><path d="M17 5.2h2.7A2.8 2.8 0 0 1 17 9.5" /><path d="M12 13.2v3" /><path d="M9 20h6" /><path d="M10 16.2h4l.6 3.8H9.4z" />
            </svg>
          </span> 發起競賽
        </button>
      </div>

      <Modal show={setupOpen} onClose={() => setSetupOpen(false)} labelledBy="setupModalTitle">
        <div className="modal-head" id="setupModalTitle">
          <div className="name">發起競賽</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>設定案例與時間限制，系統會自動產生賽場代碼</div>
        </div>
        <div className="setup-row" style={{ marginTop: 16 }}>
          <label>選擇案例</label>
          <select value={caseValue} onChange={handleCaseChange}>
            {CASE_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="setup-row">
          <label>題目數量</label>
          <span className="fixed-value-display">{FIXED_ROUNDS} 回合</span>
          <span className="setup-hint">每個題庫固定 {FIXED_ROUNDS} 回合，每回合各隊需送出一次解方</span>
        </div>
        <div className="setup-row">
          <label>時間限制</label>
          <select className="inline" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}>
            <option value="5">每回合 5 分鐘</option>
            <option value="8">每回合 8 分鐘</option>
            <option value="10">每回合 10 分鐘</option>
            <option value="12">每回合 12 分鐘</option>
            <option value="15">每回合 15 分鐘</option>
          </select>
          <span className="setup-hint">時間到後系統會自動收件並進入下一回合</span>
        </div>
        <div className="setup-row" style={{ alignItems: 'flex-start' }}>
          <label style={{ paddingTop: 8 }}>賽場代碼</label>
          <div className="code-col">
            <div className="code-actions">
              <span className="code-display">{code ? code : '— — — — — —'}</span>
              <button className="hint-btn ghost sm" onClick={() => { copyText(code); flashCopyToast('已複製代碼') }}>
                <span className="btn-ic">
                  <svg className="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="1.6" /><path d="M15.5 8.5V6.6a1.6 1.6 0 0 0-1.6-1.6H6.6A1.6 1.6 0 0 0 5 6.6v7.3a1.6 1.6 0 0 0 1.6 1.6h1.9" /></svg>
                </span>複製代碼
              </button>
              <button className="hint-btn ghost sm" onClick={() => setQrShown((v) => !v)}>
                <span className="btn-ic">
                  <svg className="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeLinejoin="round"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" /><path d="M14 14h3v3h-3zM20.5 14v3M14 20.5h3M17.5 17.5h3v3" /></svg>
                </span>{qrShown ? '隱藏 QR Code' : 'QR Code'}
              </button>
              <span className={`copy-toast${copyToast ? ' show' : ''}`}>{copyToast}</span>
            </div>
            <div className={`qr-panel${qrShown ? ' show' : ''}`}>
              {qrUrl && <img src={qrUrl} alt="賽場加入 QR Code" />}
              <div className="qr-panel-info">
                <div className="qr-link-label">學生可掃描 QR Code，或使用下方連結加入賽場</div>
                <div className="qr-link mono">{link || '—'}</div>
                <button className="hint-btn ghost sm" onClick={() => { copyText(link); flashCopyToast('已複製連結') }}>
                  <span className="btn-ic">
                    <svg className="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="1.6" /><path d="M15.5 8.5V6.6a1.6 1.6 0 0 0-1.6-1.6H6.6A1.6 1.6 0 0 0 5 6.6v7.3a1.6 1.6 0 0 0 1.6 1.6h1.9" /></svg>
                  </span>複製連結
                </button>
              </div>
            </div>
          </div>
        </div>
        <button className="hint-btn sm" style={{ marginTop: 8 }} onClick={handleStart}>開始監控 →</button>
      </Modal>

      <div className="res-tabs" style={{ marginTop: 18 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`res-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'syllabus' && (
        <div className="res-view active">
          <div className="panel">
            <div className="syllabus-block">
              <h4>課程簡介</h4>
              <p>本課程以「商業兩難情境競技場」為核心教學工具，讓學生分組運用 AI 提示工程能力拆解真實商業決策難題，並在過程中培養對 AI 生成內容的批判性查核習慣。</p>
              <h4>學習目標</h4>
              <ul>
                <li>能設計具體、可查核的 AI 提示，避免流於空泛提問</li>
                <li>能辨識 AI 回答中可能的幻覺內容並主動查證</li>
                <li>能從多元利害關係人角度分析商業兩難情境</li>
              </ul>
              <h4>評分方式</h4>
              <ul>
                <li>課堂競賽表現　40%</li>
                <li>期末報告　30%</li>
                <li>出席與參與　30%</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="res-view active">
          <div className="panel">
            <div className="eyebrow">學生名單（32 人）</div>
            <table className="roster-table" style={{ marginTop: 12 }}>
              <thead><tr><th>姓名</th><th>系級</th><th>累積 4D 平均</th><th>出席次數</th></tr></thead>
              <tbody>
                {ROSTER.map((r, i) => (
                  <Fragment key={i}>
                    <tr
                      title={r.email || undefined}
                      style={r.email ? { cursor: 'pointer' } : undefined}
                      onClick={() => { if (r.email) setExpandedStudent((cur) => (cur === i ? null : i)) }}
                    >
                      <td>{r.name}</td><td>{r.dept}</td><td className="num">{r.avg}</td><td className="num">{r.attend}</td>
                    </tr>
                    {expandedStudent === i && r.email && (
                      <tr>
                        <td colSpan={4} style={{ color: 'var(--accent-dark)', fontSize: 12.5, background: 'var(--accent-bg)' }}>
                          可聯繫信箱：{r.email}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="res-view active">
          <div className="panel">
            <div className="eyebrow">過往競賽紀錄（點開查看前三名隊伍與成員）</div>
            {PAST_COMPETITIONS.map((pc) => (
              <div className="past-comp-item" key={pc.id}>
                <div className="past-comp" onClick={() => togglePc(pc.id)}>
                  <div className="t">{pc.title}</div>
                  <div className="meta">{pc.meta}</div>
                </div>
                <div className={`pc-detail${openPc[pc.id] ? ' open' : ''}`}>
                  {pc.ranks.map((r, i) => (
                    <div className="pc-rank" key={i}>
                      <span className={`medal ${r.medal}`}>{i + 1}</span> {r.team}：{r.members}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
