import { useState, useRef, Fragment } from 'react'
import Modal from '../components/Modal.jsx'
import { CategoryIcon } from '../icons.jsx'
import FourDStatsTable from '../components/FourDStatsTable.jsx'
import { DEFAULT_ROUNDS, DEFAULT_TIME_LIMIT, ROUND_LIMITS, TIME_LIMITS, ROSTER, DIM_4D, TEAM_COLORS, courseLabels, courseJoinInfo, generateArenaCode, copyText } from '../data.js'
import { playSuccess } from '../sound.js'

const TABS = [
  { id: 'syllabus', label: '課程大綱' },
  { id: 'roster', label: '學生與小組' },
  { id: 'growth', label: '4D 能力成長' },
  { id: 'history', label: '過往競賽紀錄' },
]

// 小組的代號與名稱依順序重排成 A、B、C…，所以刪掉中間的組別後不會留下空號
function relabelGroups(list) {
  return list.map((group, i) => {
    const letter = String.fromCharCode(65 + i)
    return { id: letter, name: `${letter} 隊`, members: group.members }
  })
}

// datetime-local 輸入框要的格式：yyyy-MM-ddTHH:mm（本地時間）
function toLocalInput(date) {
  const pad2 = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function defaultPublishAt() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setMinutes(0, 0, 0)
  return toLocalInput(d)
}

function formatPublishTime(value) {
  return new Date(value).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

// 加減鈕：回合數、每回合時間都用它
function Stepper({ value, onChange, min, max, step, unit, label }) {
  return (
    <div className="setup-stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`${label}減少`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <span><b>{value}</b> {unit}</span>
      <button type="button" aria-label={`${label}增加`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>＋</button>
    </div>
  )
}

export default function CourseDetail({ course, bank, categories, groups, groupMode, scheduled, onSchedule, onCancelSchedule, onSaveGroups, pastCompetitions, onAddStudent, onResolveRequest, onBack, onStartArena }) {
  const [activeTab, setActiveTab] = useState('syllabus')
  const [openPc, setOpenPc] = useState({})
  const [expandedStudent, setExpandedStudent] = useState(null)
  const [courseQrShown, setCourseQrShown] = useState(false)
  const [courseCopyNote, setCourseCopyNote] = useState('')
  const [newStudent, setNewStudent] = useState({ name: '', email: '' })
  const [rosterError, setRosterError] = useState('')
  const [pendingOpen, setPendingOpen] = useState(false) // 「待審核申請」小視窗
  const [growthOpen, setGrowthOpen] = useState(null)
  const labels = courseLabels(course)
  const join = courseJoinInfo(course.joinCode)
  const isFull = course.studentCount >= course.capacity

  function flashCourseCopy(msg) {
    setCourseCopyNote(msg)
    window.setTimeout(() => setCourseCopyNote(''), 1800)
  }

  function submitStudent(e) {
    e.preventDefault()
    const name = newStudent.name.trim()
    const email = newStudent.email.trim()
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      setRosterError('請填學生姓名與正確的信箱')
      return
    }
    if (!onAddStudent(course.id, { name, dept: '—', email })) {
      setRosterError(isFull ? `人數已滿（上限 ${course.capacity} 人），不能再加入` : '加入失敗')
      return
    }
    setNewStudent({ name: '', email: '' })
    setRosterError('')
  }

  function resolve(requestId, approve) {
    if (!onResolveRequest(course.id, requestId, approve)) setRosterError(`人數已滿（上限 ${course.capacity} 人），不能再核准加入`)
    else setRosterError('')
  }

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

  // toId 是小組代號；'none' 表示拖到「未分組」（從所有小組移除）
  function moveMember(name, toId) {
    // 放回原本的地方就不算調整
    const from = draftGroups.find((g) => g.members.includes(name))
    if ((from?.id ?? 'none') === toId) return
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

  /*
    「學生與小組」：學生名單與小組名單合在同一個頁籤。每位學生標出所屬小組（依目前存好的分組），
    可以用關鍵字（姓名、系級、信箱）、小組、系級篩選；名單右上角的「調整分組」打開拖拉調整的小視窗。
  */
  const [rosterQuery, setRosterQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('all') // all｜小組代號｜none（未分組）
  const [deptFilter, setDeptFilter] = useState('all')
  const students = [
    ...course.extraStudents.map((r) => ({ ...r, avg: '—', attend: '—', isNew: true })),
    ...(course.demoRoster ? ROSTER : []),
  ].map((st) => ({ ...st, group: groups.find((g) => g.members.includes(st.name)) ?? null }))
  const depts = [...new Set(students.map((st) => st.dept).filter((d) => d && d !== '—'))]
  // 調整分組視窗裡「未分組」的同學：名單上的學生，草稿裡沒有在任何一組的
  const draftUngrouped = students.map((st) => st.name).filter((name) => !draftGroups.some((g) => g.members.includes(name)))
  const ungroupedCount = students.filter((st) => !st.group).length
  const q = rosterQuery.trim().toLowerCase()
  const shownStudents = students.filter((st) =>
    (!q || [st.name, st.dept, st.email].some((v) => String(v ?? '').toLowerCase().includes(q)))
    && (groupFilter === 'all' || (groupFilter === 'none' ? !st.group : st.group?.id === groupFilter))
    && (deptFilter === 'all' || st.dept === deptFilter))
  const filtering = q !== '' || groupFilter !== 'all' || deptFilter !== 'all'
  const groupColor = (id) => TEAM_COLORS[id] ?? '#8C9BFF'

  function clearRosterFilters() {
    setRosterQuery('')
    setGroupFilter('all')
    setDeptFilter('all')
  }

  const [setupOpen, setSetupOpen] = useState(false)
  // 選題：先選分類，再從該分類的題庫裡挑一題（caseValue 存題庫名稱）
  const firstCategory = categories.find((c) => bank.some((b) => b.category === c.name)) ?? categories[0]
  const [pickCategory, setPickCategory] = useState(firstCategory?.name ?? '')
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS)
  const [timeLimit, setTimeLimit] = useState(DEFAULT_TIME_LIMIT)
  const [publishMode, setPublishMode] = useState('now') // now 立即發布｜later 排程發布
  const [publishAt, setPublishAt] = useState(defaultPublishAt)
  const [note, setNote] = useState('')
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

  const publishInPast = publishMode === 'later' && (!publishAt || new Date(publishAt).getTime() <= Date.now())
  const courseScheduled = (scheduled ?? []).filter((item) => item.courseId === course.id)

  function resetSetup() {
    setRounds(DEFAULT_ROUNDS)
    setTimeLimit(DEFAULT_TIME_LIMIT)
    setPublishMode('now')
    setPublishAt(defaultPublishAt())
    setNote('')
    // 下一場競賽要用新的代碼
    setCode('')
    setLink('')
    setQrUrl('')
    setQrShown(false)
  }

  // 按「完成」：立即發布 → 直接進監控台；排程發布 → 存成「已排程」，到時間才會出現在學生端
  function handleStart() {
    if (!chosenCase || publishInPast) return
    const config = { caseName: chosenCase.name, caseData: chosenCase, rounds, timeLimit, note: note.trim(), code, link }
    setSetupOpen(false)
    playSuccess()
    if (publishMode === 'later') {
      onSchedule({ ...config, id: `${Date.now()}`, courseId: course.id, publishAt })
      resetSetup()
    } else {
      onStartArena(config)
    }
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
          <div className="meta">{labels.detailMeta}</div>
          <div className="meta">{labels.access}</div>
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
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>設定題目、回合與發布時間，系統會自動產生賽場代碼</div>
        </div>
        <div className="pick-block" style={{ marginTop: 16 }}>
          <div className="pick-label">選擇題目<small>先選分類，再從該分類挑一題</small></div>
          {/* 沒有題目的分類不顯示；分類按鈕不上色，只用藍色標出目前選的那一個 */}
          <div className="pick-cats" role="tablist" aria-label="題庫分類">
            {categories.filter((c) => bank.some((b) => b.category === c.name)).map((c) => {
              const count = bank.filter((b) => b.category === c.name).length
              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={pickCategory === c.name}
                  className={`pick-cat${pickCategory === c.name ? ' on' : ''}`}
                  key={c.name}
                  onClick={() => handlePickCategory(c.name)}
                >
                  <CategoryIcon name={c.name} size={16} />{c.name}<em>{count}</em>
                </button>
              )
            })}
          </div>
          {categoryCases.length === 0 ? (
            <div className="pick-empty">題庫裡還沒有題目，可以先到「題庫管理」新增。</div>
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
          <label>回合數</label>
          <Stepper label="回合數" value={rounds} onChange={setRounds} unit="回合" {...ROUND_LIMITS} />
          <span className="setup-hint">同一個題目重複練習、找新的答案解方；預設 {DEFAULT_ROUNDS} 回合</span>
        </div>
        <div className="setup-row">
          <label>每回合時間</label>
          <Stepper label="每回合時間" value={timeLimit} onChange={setTimeLimit} unit="分鐘" {...TIME_LIMITS} />
          <span className="setup-hint">這是一回合的時限，預設 {DEFAULT_TIME_LIMIT} 分鐘；競賽中仍可在監控台加時</span>
        </div>
        <div className="setup-row" style={{ alignItems: 'flex-start' }}>
          <label style={{ paddingTop: 8 }}>發布時間</label>
          <div className="setup-publish">
            <div className="setup-chips" role="radiogroup" aria-label="發布時間">
              <button type="button" role="radio" aria-checked={publishMode === 'now'} className={publishMode === 'now' ? 'on' : ''} onClick={() => setPublishMode('now')}>立即發布</button>
              <button type="button" role="radio" aria-checked={publishMode === 'later'} className={publishMode === 'later' ? 'on' : ''} onClick={() => setPublishMode('later')}>排程發布</button>
            </div>
            {publishMode === 'later' && (
              <>
                <input type="datetime-local" className="setup-datetime" value={publishAt} min={toLocalInput(new Date())} onChange={(e) => setPublishAt(e.target.value)} aria-label="發布時間" />
                <span className={`setup-hint${publishInPast ? ' warn' : ''}`}>{publishInPast ? '請選擇現在之後的時間' : '時間一到，這場競賽的連結才會出現在學生端的課程頁面'}</span>
              </>
            )}
          </div>
        </div>
        <div className="setup-row" style={{ alignItems: 'flex-start' }}>
          <label style={{ paddingTop: 8 }}>其他說明</label>
          <textarea className="setup-note" value={note} placeholder="補充給學生的說明（選填），例如：這場競賽請先閱讀第三週講義" onChange={(e) => setNote(e.target.value)} maxLength={300} />
        </div>
        <div className="setup-row">
          <label>分組</label>
          <span className="setup-hint">{groups.length} 組・{groups.reduce((n, g) => n + g.members.length, 0)} 位同學（{groupMode === 'manual' ? '手動調整' : '系統隨機分組'}），可到課程的「學生與小組」調整</span>
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
        <button className="hint-btn sm" style={{ marginTop: 8 }} disabled={!chosenCase || publishInPast} onClick={handleStart}>{publishMode === 'later' ? '完成（排程發布）' : '完成並開始監控 →'}</button>
      </Modal>

      {courseScheduled.length > 0 && (
        <section className="scheduled-box" aria-label="已排程的競賽">
          <h4>已排程的競賽</h4>
          <ul>
            {courseScheduled.map((item) => (
              <li key={item.id}>
                <div>
                  <b>{item.caseName}</b>
                  <span>預定 {formatPublishTime(item.publishAt)} 發布・{item.rounds} 回合・每回合 {item.timeLimit} 分鐘・代碼 <em className="mono">{item.code}</em></span>
                </div>
                <div className="scheduled-actions">
                  <button type="button" className="hint-btn ghost sm" onClick={() => onCancelSchedule(item.id)}>取消排程</button>
                  <button type="button" className="hint-btn sm" onClick={() => { onCancelSchedule(item.id); onStartArena(item) }}>現在就開始</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
            {!course.demoRoster ? (
              <div className="syllabus-block">
                <h4>課程簡介</h4>
                <p>{course.intro}</p>
                <h4>課程設定</h4>
                <ul>
                  <li>{course.visibility === 'private' ? '私人課程：學生加入後要經過你審核' : '公開課程：學生用代碼加入後自動通過'}</li>
                  <li>人數上限 {course.capacity} 人</li>
                  {course.publishAt && <li>發布時間：{new Date(course.publishAt).toLocaleString('zh-TW', { hour12: false })}</li>}
                  {course.endAt && <li>結束時間：{new Date(course.endAt).toLocaleString('zh-TW', { hour12: false })}</li>}
                  {course.price != null && <li>價錢：{course.price} 元</li>}
                  {course.tags?.length > 0 && <li>標籤：{course.tags.join('、')}</li>}
                </ul>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="res-view active">
          <div className="panel">
            <div className="roster-head">
              <div className="eyebrow">邀請學生加入</div>
              {/* 待審核的加入申請：只放一顆按鈕（顯示還沒審的數量），點了才在小視窗裡審核，不佔畫面 */}
              {(course.visibility === 'private' || course.pending.length > 0) && (
                <button type="button" className={`pending-btn${course.pending.length > 0 ? ' has' : ''}`} onClick={() => setPendingOpen(true)} aria-label={`待審核的加入申請，${course.pending.length} 筆`}>
                  待審核申請
                  <span className="pending-count">{course.pending.length}</span>
                </button>
              )}
            </div>
            <div className="course-join">
              <div className="course-join-row">
                <div className="course-join-code">
                  <span>課程代碼</span>
                  <strong className="mono">{join.code}</strong>
                </div>
                <div className="course-join-actions">
                  <button type="button" className="hint-btn ghost sm" onClick={() => { copyText(join.code); flashCourseCopy('已複製代碼') }}>複製代碼</button>
                  <button type="button" className="hint-btn ghost sm" onClick={() => { copyText(join.link); flashCourseCopy('已複製連結') }}>複製連結</button>
                  <button type="button" className="hint-btn ghost sm" onClick={() => setCourseQrShown((v) => !v)}>{courseQrShown ? '隱藏 QR Code' : 'QR Code'}</button>
                  <span className={`copy-toast${courseCopyNote ? ' show' : ''}`}>{courseCopyNote}</span>
                </div>
              </div>
              <p className="course-join-hint">{course.visibility === 'private' ? '這是私人課程：學生用代碼加入後，會出現在下面的「待審核」，要你核准才算加入。' : '這是公開課程：學生用代碼加入後自動通過。'}人數 {course.studentCount} / {course.capacity}{isFull ? '（已滿）' : ''}。</p>
              {courseQrShown && (
                <div className="course-join-qr">
                  <img src={join.qrUrl} alt="課程加入 QR Code" />
                  <div className="mono">{join.link}</div>
                </div>
              )}
            </div>

            <form className="course-add" onSubmit={submitStudent}>
              <b>老師直接加入學生</b>
              <input type="text" placeholder="姓名" value={newStudent.name} onChange={(e) => setNewStudent((v) => ({ ...v, name: e.target.value }))} aria-label="學生姓名" />
              <input type="email" placeholder="學校信箱" value={newStudent.email} onChange={(e) => setNewStudent((v) => ({ ...v, email: e.target.value }))} aria-label="學生信箱" />
              <button type="submit" className="hint-btn sm" disabled={isFull}>加入</button>
            </form>
            {rosterError && <p className="course-error" role="alert">{rosterError}</p>}
          </div>

          <Modal show={pendingOpen} onClose={() => setPendingOpen(false)} boxStyle={{ maxWidth: 560 }} labelledBy="pendingModalTitle">
            <div className="modal-head" id="pendingModalTitle">
              <div className="name">待審核的加入申請（{course.pending.length}）</div>
              <div className="pending-sub">私人課程的學生用代碼加入後要你核准才算加入。目前人數 {course.studentCount} / {course.capacity}{isFull ? '（已滿，不能再核准）' : ''}</div>
            </div>
            {course.pending.length === 0 ? (
              <p className="pending-empty">目前沒有待審核的申請。</p>
            ) : (
              <ul className="course-pending-list">
                {course.pending.map((r) => (
                  <li key={r.id}>
                    <div><b>{r.name}</b><span>{r.dept}・{r.email}</span></div>
                    <div className="course-pending-actions">
                      <button type="button" className="hint-btn ghost sm" onClick={() => resolve(r.id, false)}>拒絕</button>
                      <button type="button" className="hint-btn sm" onClick={() => resolve(r.id, true)} disabled={isFull}>核准加入</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {rosterError && <p className="course-error" role="alert">{rosterError}</p>}
          </Modal>

          <div className="panel" style={{ marginTop: 14 }}>
            <div className="roster-head">
              <div className="eyebrow">學生名單（{course.studentCount} 人）</div>
              <div className="roster-head-right">
                <span className="group-mode">{groups.length} 組・{groupMode === 'manual' ? '手動調整' : '系統隨機分組'}</span>
                <button type="button" className="hint-btn ghost sm" onClick={startEditGroups}>調整分組</button>
              </div>
            </div>
            <div className="roster-filters" role="search">
              <input type="search" placeholder="搜尋姓名、系級或信箱" value={rosterQuery} onChange={(e) => setRosterQuery(e.target.value)} aria-label="搜尋學生" />
              <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} aria-label="依小組篩選">
                <option value="all">全部小組</option>
                {groups.map((g) => <option value={g.id} key={g.id}>{g.name}（{g.members.length} 人）</option>)}
                {ungroupedCount > 0 && <option value="none">未分組（{ungroupedCount} 人）</option>}
              </select>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} aria-label="依系級篩選">
                <option value="all">全部系級</option>
                {depts.map((d) => <option value={d} key={d}>{d}</option>)}
              </select>
              {filtering && <button type="button" className="hint-btn ghost sm" onClick={clearRosterFilters}>清除篩選</button>}
            </div>
            <p className="roster-count">{filtering ? `符合條件 ${shownStudents.length} 人` : `下面列出 ${students.length} 位學生`}{course.demoRoster ? '（示意資料，只列出部分學生）' : ''}・點一位學生可以看信箱</p>
            <table className="roster-table" style={{ marginTop: 8 }}>
              <thead><tr><th>姓名</th><th>系級</th><th>小組</th><th>累積 4D 平均</th><th>出席次數</th></tr></thead>
              <tbody>
                {shownStudents.length === 0 && (
                  <tr><td colSpan={5} className="roster-empty">沒有符合條件的學生</td></tr>
                )}
                {shownStudents.map((r) => {
                  const key = r.email ?? r.name
                  return (
                    <Fragment key={key}>
                      <tr
                        title={r.email || undefined}
                        style={r.email ? { cursor: 'pointer' } : undefined}
                        onClick={() => { if (r.email) setExpandedStudent((cur) => (cur === key ? null : key)) }}
                      >
                        <td>{r.name}{r.isNew && <em className="new-student">新加入</em>}</td>
                        <td>{r.dept}</td>
                        <td>
                          {r.group
                            ? <button type="button" className="group-tag" style={{ '--group-color': groupColor(r.group.id) }} title="只看這一組" onClick={(e) => { e.stopPropagation(); setGroupFilter(r.group.id) }}>{r.group.name}</button>
                            : <span className="group-tag none">未分組</span>}
                        </td>
                        <td className="num">{r.avg}</td><td className="num">{r.attend}</td>
                      </tr>
                      {expandedStudent === key && r.email && (
                        <tr>
                          <td colSpan={5} style={{ color: 'var(--accent-dark)', fontSize: 12.5, background: 'var(--accent-bg)' }}>
                            可聯繫信箱：{r.email}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 調整分組：學生名單右上角的「調整分組」打開這個小視窗；先改草稿，按「完成」才存起來，關掉或按「取消」就丟掉 */}
          <Modal show={editingGroups} onClose={() => setEditingGroups(false)} boxStyle={{ maxWidth: 760 }} labelledBy="groupModalTitle">
            <div className="modal-head" id="groupModalTitle">
              <div className="name">調整分組（{draftGroups.length} 組・{groupMemberTotal} 位同學）</div>
              <div className="pending-sub">分組方式：{draftMode === 'manual' ? '手動調整' : '系統隨機分組'}。直接拖拉同學的名字方塊到別的小組；空的小組會在按「完成」時移除。調整後，下一場競賽會使用新的分組。</div>
            </div>
            <div className="group-edit in-modal">
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
              {/* 還沒分組的同學（例如新加入的）：可以拖進小組；也可以把同學拖回這裡取消分組 */}
              <section
                className={`group-zone ungrouped${dragOverId === 'none' ? ' over' : ''}`}
                onDragOver={(e) => { if (dragName) { e.preventDefault(); setDragOverId('none') } }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverId(null) }}
                onDrop={(e) => { e.preventDefault(); if (dragName) moveMember(dragName, 'none'); setDragName(null); setDragOverId(null) }}
              >
                <h4>未分組（{draftUngrouped.length} 人）</h4>
                <div className="group-chips">
                  {draftUngrouped.map((name) => (
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
                  {draftUngrouped.length === 0 && <span className="group-empty">所有同學都已分組</span>}
                </div>
              </section>
            </div>
            <div className="group-modal-actions">
              <button type="button" className="hint-btn ghost sm" onClick={addGroup}>＋ 新增小組</button>
              <span />
              <button type="button" className="hint-btn ghost sm" onClick={() => setEditingGroups(false)}>取消</button>
              <button type="button" className="hint-btn sm" onClick={saveGroups}>完成</button>
            </div>
          </Modal>
        </div>
      )}

      {activeTab === 'growth' && (
        <div className="res-view active">
          <div className="panel">
            <div className="eyebrow">4D 能力成長（各場競賽的班級平均，滿分 25）</div>
            <p className="growth-note">每場競賽結束後，系統會把這個題目的平均、高標、低標、中位數、標準差寫入課程資料庫；這裡把各場的平均排在一起，看這門課學生的 4D 能力有沒有進步。點一場可以看完整統計。</p>
            <table className="growth-table">
              <thead><tr><th>競賽</th>{DIM_4D.map((d) => <th key={d.key}>{d.key} {d.label}</th>)}</tr></thead>
              <tbody>
                {[...pastCompetitions].reverse().map((pc, idx, list) => {
                  const prev = idx > 0 ? list[idx - 1] : null
                  return (
                    <Fragment key={pc.id}>
                      <tr className={`growth-row${growthOpen === pc.id ? ' open' : ''}`} onClick={() => setGrowthOpen((cur) => (cur === pc.id ? null : pc.id))}>
                        <td><b>{pc.title}</b><small>{pc.meta.split('·')[0].trim()}</small></td>
                        {DIM_4D.map((d) => {
                          const cur = pc.fourD[d.key].mean
                          const diff = prev ? cur - prev.fourD[d.key].mean : null
                          return <td key={d.key}><b>{cur.toFixed(1)}</b>{diff !== null && <em className={diff >= 0 ? 'up' : 'down'}>{diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}</em>}</td>
                        })}
                      </tr>
                      {growthOpen === pc.id && (
                        <tr><td colSpan={5} className="growth-detail"><FourDStatsTable stats={pc.fourD} tone="light" /></td></tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="res-view active">
          <div className="panel">
            <div className="eyebrow">過往競賽紀錄（點開查看解方、4D 兩個排名的前三名）</div>
            {pastCompetitions.map((pc) => (
              <div className="past-comp-item" key={pc.id}>
                <div className="past-comp" onClick={() => togglePc(pc.id)}>
                  <div className="t">{pc.title}</div>
                  <div className="meta">{pc.meta}</div>
                </div>
                <div className={`pc-detail${openPc[pc.id] ? ' open' : ''}`}>
                  {/* 解方排名與 4D 排名分開（docs/scoring-design.md 七） */}
                  {[['解方排名', pc.solutionRanks], ['4D 排名', pc.fourDRanks]].map(([label, ranks]) => (
                    <div className="pc-rank-group" key={label}>
                      <div className="pc-rank-label">{label}</div>
                      {ranks.map((r, i) => (
                        <div className="pc-rank" key={i}>
                          <span className={`medal ${r.medal}`}>{i + 1}</span> {r.team}：{r.members}
                        </div>
                      ))}
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
