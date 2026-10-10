import { useState, useRef, Fragment } from 'react'
import Modal from '../components/Modal.jsx'
import { CategoryBadge } from '../icons.jsx'
import { FIXED_TIME_LIMIT, FIXED_QUESTION_COUNT, ROSTER, PAST_COMPETITIONS, generateArenaCode, copyText } from '../data.js'
import { playSuccess } from '../sound.js'

const TABS = [
  { id: 'syllabus', label: '課程大綱' },
  { id: 'roster', label: '學生名單' },
  { id: 'groups', label: '小組名單' },
  { id: 'history', label: '過往競賽紀錄' },
]

// 小組的代號與名稱依順序重排成 A、B、C…，所以刪掉中間的組別後不會留下空號
function relabelGroups(list) {
  return list.map((group, i) => {
    const letter = String.fromCharCode(65 + i)
    return { id: letter, name: `${letter} 隊`, members: group.members }
  })
}

export default function CourseDetail({ course, bank, categories, groups, groupMode, onSaveGroups, onBack, onStartArena }) {
  const [activeTab, setActiveTab] = useState('syllabus')
  const [openPc, setOpenPc] = useState({})
  const [expandedStudent, setExpandedStudent] = useState(null)

  // 小組名單的「手動調整」：先改草稿，按「完成」才存起來，按「取消」就丟掉
  const [editingGroups, setEditingGroups] = useState(false)
  const [draftGroups, setDraftGroups] = useState([])
  const [draftMode, setDraftMode] = useState('random')
  const [dragName, setDragName] = useState(null) // 正在拖的同學
  const [dragOverId, setDragOverId] = useState(null) // 目前游標停在哪個小組上

  function startEditGroups() {
    setDraftGroups(groups.map((g) => ({ ...g, members: [...g.members] })))
    setDraftMode(groupMode)
    setEditingGroups(true)
  }

  function moveMember(name, toId) {
    // 放回原本的小組就不算調整
    if (draftGroups.find((g) => g.id === toId)?.members.includes(name)) return
    setDraftGroups((list) => list.map((g) => {
      const without = g.members.filter((m) => m !== name)
      return g.id === toId ? { ...g, members: [...without, name] } : { ...g, members: without }
    }))
    setDraftMode('manual')
  }

  function addGroup() {
    setDraftGroups((list) => [...list, { id: `new-${list.length}`, name: '新小組', members: [] }])
    setDraftMode('manual')
  }

  function removeEmptyGroup(id) {
    setDraftGroups((list) => list.filter((g) => g.id !== id))
  }

  function saveGroups() {
    // 空的小組在這裡移除，剩下的依序重新命名成 A、B、C…
    onSaveGroups(relabelGroups(draftGroups.filter((g) => g.members.length > 0)), draftMode)
    setEditingGroups(false)
  }

  const groupMemberTotal = (editingGroups ? draftGroups : groups).reduce((n, g) => n + g.members.length, 0)

  const [setupOpen, setSetupOpen] = useState(false)
  // 選題：先選分類，再從該分類的題庫裡挑一題（caseValue 存題庫名稱）
  const firstCategory = categories.find((c) => bank.some((b) => b.category === c.name)) ?? categories[0]
  const [pickCategory, setPickCategory] = useState(firstCategory?.name ?? '')
  const [caseValue, setCaseValue] = useState(() => bank.find((b) => b.category === firstCategory?.name)?.name ?? '')
  const categoryCases = bank.filter((b) => b.category === pickCategory)
  const chosenCase = bank.find((b) => b.name === caseValue)

  function handlePickCategory(name) {
    setPickCategory(name)
    // 換分類時，如果目前選的題不在這個分類，就先選該分類的第一題
    if (!bank.some((b) => b.category === name && b.name === caseValue)) {
      setCaseValue(bank.find((b) => b.category === name)?.name ?? '')
    }
  }
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

  function handleStart() {
    if (!chosenCase) return
    onStartArena({ caseName: chosenCase.name, caseData: chosenCase, timeLimit: FIXED_TIME_LIMIT, code })
    setSetupOpen(false)
    playSuccess()
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
        <div className="pick-block" style={{ marginTop: 16 }}>
          <div className="pick-label">選擇題目<small>先選分類，再從該分類挑一題</small></div>
          <div className="pick-cats" role="tablist" aria-label="題庫分類">
            {categories.map((c) => {
              const count = bank.filter((b) => b.category === c.name).length
              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={pickCategory === c.name}
                  className={`pick-cat${pickCategory === c.name ? ' on' : ''}${count === 0 ? ' empty' : ''}`}
                  style={{ '--lv': c.tone }}
                  key={c.name}
                  onClick={() => handlePickCategory(c.name)}
                >
                  <CategoryBadge name={c.name} tone={c.tone} size={22} />{c.name}<em>{count}</em>
                </button>
              )
            })}
          </div>
          {categoryCases.length === 0 ? (
            <div className="pick-empty">這個分類還沒有題庫，可以到「題庫管理」新增。</div>
          ) : (
            <div className="pick-cases" role="radiogroup" aria-label="題目">
              {categoryCases.map((b) => (
                <label className={`pick-case${caseValue === b.name ? ' on' : ''}`} key={b.name}>
                  <input type="radio" name="pickCase" checked={caseValue === b.name} onChange={() => setCaseValue(b.name)} />
                  <div>
                    <div className="pick-case-top"><b>{b.name}</b><span className="bic-badge diff">{b.diff}難度</span></div>
                    <p>{b.bg.slice(0, 54)}……</p>
                    <small>{b.tension}</small>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="setup-row">
          <label>題目數量</label>
          <span className="fixed-value-display">{FIXED_QUESTION_COUNT} 題</span>
          <span className="setup-hint">每個題庫固定 {FIXED_QUESTION_COUNT} 題，每題結束時各隊需送出一次解方</span>
        </div>
        <div className="setup-row">
          <label>時間限制</label>
          <span className="fixed-value-display">{FIXED_TIME_LIMIT} 分鐘</span>
          <span className="setup-hint">每題固定 {FIXED_TIME_LIMIT} 分鐘，競賽進行中可在監控台隨時加時</span>
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
        <button className="hint-btn sm" style={{ marginTop: 8 }} disabled={!chosenCase} onClick={handleStart}>開始監控 →</button>
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

      {activeTab === 'groups' && (
        <div className="res-view active">
          <div className="panel">
            <div className="group-head">
              <div className="eyebrow">小組名單（{(editingGroups ? draftGroups : groups).length} 組・{groupMemberTotal} 位同學）</div>
              {editingGroups ? (
                <div className="group-actions">
                  <button type="button" className="hint-btn ghost sm" onClick={addGroup}>＋ 新增小組</button>
                  <button type="button" className="hint-btn ghost sm" onClick={() => setEditingGroups(false)}>取消</button>
                  <button type="button" className="hint-btn sm" onClick={saveGroups}>完成</button>
                </div>
              ) : (
                <button type="button" className="hint-btn ghost sm" onClick={startEditGroups}>手動調整</button>
              )}
            </div>
            <p className="group-mode">分組方式：{(editingGroups ? draftMode : groupMode) === 'manual' ? '手動調整' : '系統隨機分組'}</p>

            {editingGroups ? (
              <>
                <p className="group-hint">直接拖拉同學的名字方塊到別的小組；空的小組會在按「完成」時移除。調整後，下一場競賽會使用新的分組。</p>
                <div className="group-edit">
                  {draftGroups.map((group, gi) => (
                    <section
                      key={group.id}
                      className={`group-zone${dragOverId === group.id ? ' over' : ''}`}
                      onDragOver={(e) => { if (dragName) { e.preventDefault(); setDragOverId(group.id) } }}
                      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverId(null) }}
                      onDrop={(e) => { e.preventDefault(); if (dragName) moveMember(dragName, group.id); setDragName(null); setDragOverId(null) }}
                    >
                      <h4>
                        {`${String.fromCharCode(65 + gi)} 隊`}（{group.members.length} 人）
                        {group.members.length === 0 && <button type="button" className="group-remove" onClick={() => removeEmptyGroup(group.id)}>刪除這個空小組</button>}
                      </h4>
                      <div className="group-chips">
                        {group.members.map((name) => (
                          <span
                            key={name}
                            className={`group-chip${dragName === name ? ' dragging' : ''}`}
                            draggable
                            onDragStart={(e) => { setDragName(name); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', name) }}
                            onDragEnd={() => { setDragName(null); setDragOverId(null) }}
                          >
                            {name}
                          </span>
                        ))}
                        {group.members.length === 0 && <span className="group-empty">把同學拖到這裡</span>}
                      </div>
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <ul className="group-list">
                {groups.map((group) => (
                  <li key={group.id}>{group.name}：{group.members.join('、')}</li>
                ))}
              </ul>
            )}
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
