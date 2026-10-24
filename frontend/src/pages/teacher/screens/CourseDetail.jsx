import { useState, Fragment } from 'react'
import Modal from '../components/Modal.jsx'
import { CategoryIcon } from '../icons.jsx'
import FourDStatsTable from '../components/FourDStatsTable.jsx'
import { DEFAULT_ROUNDS, DEFAULT_TIME_LIMIT, ROUND_LIMITS, TIME_LIMITS, ROSTER, DIM_4D, courseLabels, courseJoinInfo, generateArenaCode, copyText } from '../data.js'
import { playSuccess } from '../sound.js'
import { ACCEPTED_FILES, readStudentFile, checkStudents, STATUS_TEXT, sampleCsvUrl } from '../importStudents.js'

const TABS = [
  { id: 'roster', label: '學生名單' },
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

// 分組跟著每一場競賽走（不是課程固定一份）：發起競賽時選「隨機分組」或「手動分組」
const GROUP_SIZE = { min: 2, max: 6, step: 1 }
const DEFAULT_GROUP_SIZE = 3

// 組數 = 人數 ÷ 每組人數（無條件進位，每組不會超過設定的人數），再把打亂後的名單輪流發到各組，所以各組人數最多差 1 人
// 例：11 人、每組 3 人 → 4 組（3、3、3、2）；12 人、每組 5 人 → 3 組（4、4、4）
function groupCount(total, size) {
  return Math.max(1, Math.ceil(total / size))
}

function randomGroups(names, size) {
  if (names.length === 0) return []
  const shuffled = [...names]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const groups = Array.from({ length: groupCount(names.length, size) }, () => ({ members: [] }))
  shuffled.forEach((name, i) => groups[i % groups.length].members.push(name))
  return relabelGroups(groups)
}

// 「4 組・每組 2～3 人」
function groupSummary(groups) {
  if (groups.length === 0) return '還沒有分組'
  const sizes = groups.map((g) => g.members.length)
  const min = Math.min(...sizes)
  const max = Math.max(...sizes)
  return `${groups.length} 組・每組 ${min === max ? min : `${min}～${max}`} 人`
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

export default function CourseDetail({ course, bank, categories, scheduled, onSchedule, onCancelSchedule, pastCompetitions, onAddStudent, onAddStudents, onResolveRequest, onBack, onStartArena }) {
  const [activeTab, setActiveTab] = useState('roster')
  const [openPc, setOpenPc] = useState({})
  const [courseQrShown, setCourseQrShown] = useState(false)
  const [courseCopyNote, setCourseCopyNote] = useState('')
  const [newStudent, setNewStudent] = useState({ name: '', email: '' })
  const [rosterError, setRosterError] = useState('')
  const [pendingOpen, setPendingOpen] = useState(false) // 「待審核申請」小視窗
  // 待審核視窗自己的錯誤訊息（不跟「加入學生」的 rosterError 共用，不然加入失敗的訊息會跑進這個視窗）
  const [pendingError, setPendingError] = useState('')
  // 批次匯入學生（CSV）：選檔 → 預覽每一列能不能加入 → 按「加入 N 位學生」（見 importStudents.js）
  const [importOpen, setImportOpen] = useState(false)
  const [importFileName, setImportFileName] = useState('')
  const [importRaw, setImportRaw] = useState(null) // 讀出來的 [{ line, name, email, dept }]
  const [importError, setImportError] = useState('')
  const [importNote, setImportNote] = useState('') // 匯入完成後顯示在加入表單下面
  const [sampleUrl] = useState(sampleCsvUrl)
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

  function openImport() {
    setImportRaw(null)
    setImportFileName('')
    setImportError('')
    setImportOpen(true)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // 同一個檔案改過再選一次也會觸發
    if (!file) return
    setImportFileName(file.name)
    setImportRaw(null)
    setImportError('')
    try {
      const result = await readStudentFile(file)
      if (result.error) setImportError(result.error)
      else if (result.students.length === 0) setImportError('檔案裡沒有讀到學生資料。')
      else setImportRaw(result.students)
    } catch (err) {
      setImportError('讀檔失敗，請確認是 CSV 檔。')
    }
  }

  function confirmImport(okRows) {
    const added = onAddStudents(course.id, okRows.map(({ name, email, dept }) => ({ name, email, dept: dept || '—' })))
    setImportOpen(false)
    setImportNote(added > 0 ? `已從「${importFileName}」匯入 ${added} 位學生，名單上標示「新加入」。` : '沒有加入任何學生（人數已滿）。')
    window.setTimeout(() => setImportNote(''), 6000)
  }

  function resolve(requestId, approve) {
    if (!onResolveRequest(course.id, requestId, approve)) setPendingError(`人數已滿（上限 ${course.capacity} 人），不能再核准加入`)
    else setPendingError('')
  }

  // 這場競賽的分組（發起競賽視窗）：隨機分組可以設定每組人數；手動分組在小視窗裡拖拉
  const [setupGroups, setSetupGroups] = useState(null) // null 表示還沒分過
  const [setupGroupMode, setSetupGroupMode] = useState('random') // random｜manual
  const [groupSize, setGroupSize] = useState(DEFAULT_GROUP_SIZE)

  // 調整分組小視窗：先改草稿，按「完成」才存起來，按「取消」就丟掉
  const [editingGroups, setEditingGroups] = useState(false)
  const [draftGroups, setDraftGroups] = useState([])
  const [draftMode, setDraftMode] = useState('random')
  const [dragName, setDragName] = useState(null) // 正在拖的同學
  function startDrag(e, name) {
    setDragName(name)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', name)
  }

  function endDrag() {
    setDragName(null)
    setDragOverId(null)
  }
  const [dragOverId, setDragOverId] = useState(null) // 目前游標停在哪個小組上

  // fresh：從手動分組開始（照每組人數開好空的小組，所有同學都在「未分組」，讓老師自己拖）
  function startEditGroups(fresh = false) {
    const base = fresh
      ? relabelGroups(Array.from({ length: groupCount(students.length, groupSize) }, () => ({ members: [] })))
      : (setupGroups ?? [])
    setDraftGroups(base.map((g) => ({ ...g, members: [...g.members] })))
    setDraftMode(fresh ? 'manual' : setupGroupMode)
    setEditingGroups(true)
  }

  function pickRandomGroups(size = groupSize) {
    setSetupGroups(randomGroups(students.map((st) => st.name), size))
    setSetupGroupMode('random')
  }

  function changeGroupSize(size) {
    setGroupSize(size)
    pickRandomGroups(size)
  }

  // 按「手動分組」：已經手動分過就打開繼續調整，否則從空的小組開始
  function pickManualGroups() {
    startEditGroups(setupGroupMode !== 'manual')
  }

  // toId 是小組代號（競賽一定要分組，所以只能拖到別的小組，不能拖回「未分組」）
  function moveMember(name, toId) {
    // 放回原本的地方就不算調整
    const from = draftGroups.find((g) => g.members.includes(name))
    if (from?.id === toId) return
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
    setSetupGroups(relabelGroups(draftGroups.filter((g) => g.members.length > 0)))
    setSetupGroupMode(draftMode)
    setEditingGroups(false)
    playSuccess()
  }


  /*
    「學生名單」：可以用關鍵字（姓名、系級、信箱）、系級篩選。
    分組跟著每一場競賽走，所以課程這裡不放小組（2026-10-25 決定），分組在發起競賽視窗做。
  */
  const [rosterQuery, setRosterQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const students = [
    ...course.extraStudents.map((r) => ({ ...r, avg: '—', attend: '—', isNew: true })),
    ...(course.demoRoster ? ROSTER : []),
  ]
  const depts = [...new Set(students.map((st) => st.dept).filter((d) => d && d !== '—'))]
  // 批次匯入的預覽：每次重算，名單或人數變了也會跟著更新
  const importRows = importRaw ? checkStudents(importRaw, {
    existingEmails: new Set(students.map((st) => String(st.email ?? '').toLowerCase()).filter(Boolean)),
    pendingEmails: new Set(course.pending.map((r) => r.email.toLowerCase())),
    remaining: Math.max(0, course.capacity - course.studentCount),
  }) : []
  const importOk = importRows.filter((r) => r.status === 'ok')
  // 調整分組視窗裡「未分組」的同學：名單上的學生，草稿裡沒有在任何一組的
  const draftUngrouped = students.map((st) => st.name).filter((name) => !draftGroups.some((g) => g.members.includes(name)))
  const q = rosterQuery.trim().toLowerCase()
  const shownStudents = students.filter((st) =>
    (!q || [st.name, st.dept, st.email].some((v) => String(v ?? '').toLowerCase().includes(q)))
    && (deptFilter === 'all' || st.dept === deptFilter))
  const filtering = q !== '' || deptFilter !== 'all'

  function clearRosterFilters() {
    setRosterQuery('')
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
  // 選題時點一題就展開看完整題目（同時選取這一題）；expandedCase 是目前展開的題目名稱
  const [expandedCase, setExpandedCase] = useState(null)
  const categoryCases = bank.filter((b) => b.category === pickCategory)
  const chosenCase = bank.find((b) => b.name === caseValue)

  function handlePickCategory(name) {
    setPickCategory(name)
    // 換分類時，如果目前選的題不在這個分類，就先選該分類的第一題
    if (!bank.some((b) => b.category === name && b.name === caseValue)) {
      setCaseValue(bank.find((b) => b.category === name)?.name ?? '')
    }
  }
  // 賽場代碼：開視窗時先產生（監控台與排程清單用），但發起競賽視窗不顯示——比賽建立後才在監控台給學生看
  const [code, setCode] = useState('')
  const [link, setLink] = useState('')

  // 這場競賽還沒分組的同學（手動分組時可能有人還沒拖進小組；也包含分組後才加入課程的同學）
  const setupUngrouped = setupGroups ? students.filter((st) => !setupGroups.some((g) => g.members.includes(st.name))).length : 0

  function openSetup() {
    setSetupOpen(true)
    // 隨機分組：第一次打開、或名單人數變了，就重新分一次
    if (setupGroupMode === 'random' && (!setupGroups || setupGroups.reduce((n, g) => n + g.members.length, 0) !== students.length)) pickRandomGroups()
    if (!code) {
      const g = generateArenaCode()
      setCode(g.code)
      setLink(g.link)
    }
  }

  const groupsReady = setupGroups?.length > 0 && setupUngrouped === 0
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
    // 下一場競賽重新分組
    setSetupGroups(null)
    setSetupGroupMode('random')
  }

  // 按「完成」：立即發布 → 直接進監控台；排程發布 → 存成「已排程」，到時間才會出現在學生端
  function handleStart() {
    if (!chosenCase || publishInPast || !groupsReady) return
    const config = { caseName: chosenCase.name, caseData: chosenCase, rounds, timeLimit, note: note.trim(), code, link, groups: setupGroups, groupMode: setupGroupMode }
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
        </div>
        <div className="pick-block" style={{ marginTop: 14 }}>
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
                <label className={`pick-case${caseValue === b.name ? ' on' : ''}${expandedCase === b.name ? ' open' : ''}`} key={b.name}>
                  <input type="radio" name="pickCase" checked={caseValue === b.name} onChange={() => { setCaseValue(b.name); setExpandedCase(b.name) }} />
                  {/* 點卡片任何地方都能展開／收起；沒選的題目點下去，radio 的 onChange 會再把它展開並選取 */}
                  <div className="pick-case-body" onClick={() => setExpandedCase((cur) => (cur === b.name ? null : b.name))}>
                    <div className="pick-case-top">
                      <b>{b.name}</b><span className="bic-badge diff">{b.diff}</span>
                      <button
                        type="button"
                        className="pick-case-toggle"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCaseValue(b.name); setExpandedCase((cur) => (cur === b.name ? null : b.name)) }}
                      >
                        {expandedCase === b.name ? '收起 ▲' : '看完整題目 ▼'}
                      </button>
                    </div>
                    {expandedCase === b.name ? (
                      <dl className="pick-case-full">
                        <div><dt>情境背景</dt><dd>{b.bg}</dd></div>
                        <div><dt>目標</dt><dd>{b.task}</dd></div>
                        <div><dt>角色與立場</dt><dd style={{ whiteSpace: 'pre-line' }}>{b.roles}</dd></div>
                        <div><dt>兩難張力</dt><dd>{b.tension}</dd></div>
                        <div><dt>官方面向（評分用）</dt><dd><span className="pick-case-chips">{b.checklist.map((c) => <i key={c}>{c}</i>)}</span></dd></div>
                      </dl>
                    ) : (
                      <>
                        <p>{b.bg.slice(0, 54)}……</p>
                        <small>{b.tension}</small>
                      </>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="setup-row">
          <label>回合數</label>
          <Stepper label="回合數" value={rounds} onChange={setRounds} unit="回合" {...ROUND_LIMITS} />
        </div>
        <div className="setup-row">
          <label>每回合時間</label>
          <Stepper label="每回合時間" value={timeLimit} onChange={setTimeLimit} unit="分鐘" {...TIME_LIMITS} />
          <span className="setup-hint">競賽中仍可在監控台加時</span>
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
        <div className="setup-row" style={{ alignItems: 'flex-start' }}>
          <label style={{ paddingTop: 8 }}>分組</label>
          <div className="setup-publish">
            <div className="setup-chips" role="radiogroup" aria-label="分組方式">
              <button type="button" role="radio" aria-checked={setupGroupMode === 'random'} className={setupGroupMode === 'random' ? 'on' : ''} onClick={() => pickRandomGroups()}>隨機分組</button>
              <button type="button" role="radio" aria-checked={setupGroupMode === 'manual'} className={setupGroupMode === 'manual' ? 'on' : ''} onClick={pickManualGroups}>手動分組</button>
            </div>
            <div className="setup-group-line">
              {setupGroupMode === 'random' && <Stepper label="每組人數" value={groupSize} onChange={changeGroupSize} unit="人一組" {...GROUP_SIZE} />}
              {/* 不顯示「N 組・每組 M 人」；只在手動分組還有人沒分時提醒 */}
              {setupUngrouped > 0 && <span className="setup-hint warn">還有 {setupUngrouped} 位同學未分組</span>}
              {setupGroups && <button type="button" className="hint-btn ghost sm setup-group-btn" onClick={() => startEditGroups()}>{setupGroupMode === 'manual' ? '調整分組' : '查看分組'}</button>}
            </div>
          </div>
        </div>
        <button className="hint-btn sm" style={{ marginTop: 12 }} disabled={!chosenCase || publishInPast || !groupsReady} onClick={handleStart}>{publishMode === 'later' ? '完成（排程發布）' : '完成並進入監控台'}</button>
      </Modal>

      {/* 調整分組：發起競賽視窗的「手動分組」「查看分組」「調整分組」都打開這個小視窗（放在最外層，可以疊在發起競賽視窗上面）；先改草稿，按「完成」才存起來，關掉或按「取消」就丟掉；隨機分組拖拉調整後會變成手動分組 */}
      <Modal show={editingGroups} onClose={() => setEditingGroups(false)} boxStyle={{ maxWidth: 760 }} labelledBy="groupModalTitle">
        <div className="modal-head" id="groupModalTitle">
          <div className="name">調整分組（{draftGroups.length} 組・{students.length} 位同學）</div>
        </div>
        <div className="group-edit in-modal">
          {draftGroups.map((group, gi) => (
            <section
              key={group.id}
              className={`group-zone${dragOverId === group.id ? ' over' : ''}`}
              onDragOver={(e) => { if (dragName) { e.preventDefault(); setDragOverId(group.id) } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverId(null) }}
              onDrop={(e) => { e.preventDefault(); if (dragName) moveMember(dragName, group.id); endDrag() }}
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
                    onDragStart={(e) => startDrag(e, name)}
                    onDragEnd={endDrag}
                  >
                    {name}
                  </span>
                ))}
                {group.members.length === 0 && <span className="group-empty">把同學拖到這裡</span>}
              </div>
            </section>
          ))}
          {/* 還沒分組的同學（手動分組一開始、或分組後才加入課程的同學）：拖進小組；全部分好後就不顯示。
              競賽一定要分組，所以這裡只能拖出去，不能把已分組的同學拖回來 */}
          {draftUngrouped.length > 0 && (
          <section className="group-zone ungrouped">
            <h4>未分組（{draftUngrouped.length} 人）</h4>
            <div className="group-chips">
              {draftUngrouped.map((name) => (
                <span
                  key={name}
                  className={`group-chip${dragName === name ? ' dragging' : ''}`}
                  draggable
                  onDragStart={(e) => startDrag(e, name)}
                  onDragEnd={endDrag}
                >
                  {name}
                </span>
              ))}
            </div>
          </section>
          )}
        </div>
        <div className="group-modal-actions">
          <button type="button" className="hint-btn ghost sm" onClick={addGroup}>＋ 新增小組</button>
          <span />
          <button type="button" className="hint-btn ghost sm" onClick={() => setEditingGroups(false)}>取消</button>
          <button type="button" className="hint-btn sm" onClick={saveGroups}>完成</button>
        </div>
      </Modal>

      {courseScheduled.length > 0 && (
        <section className="scheduled-box" aria-label="已排程的競賽">
          <h4>已排程的競賽</h4>
          <ul>
            {courseScheduled.map((item) => (
              <li key={item.id}>
                <div>
                  <b>{item.caseName}</b>
                  <span>預定 {formatPublishTime(item.publishAt)} 發布・{item.rounds} 回合・每回合 {item.timeLimit} 分鐘・{item.groups ? groupSummary(item.groups) : ''}・代碼 <em className="mono">{item.code}</em></span>
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

      {activeTab === 'roster' && (
        <div className="res-view active">
          <div className="panel">
            <div className="roster-head">
              <div className="eyebrow">邀請學生加入</div>
              {/* 待審核的加入申請：只放一顆按鈕（顯示還沒審的數量），點了才在小視窗裡審核，不佔畫面 */}
              {(course.visibility === 'private' || course.pending.length > 0) && (
                <button type="button" className={`pending-btn${course.pending.length > 0 ? ' has' : ''}`} onClick={() => { setPendingError(''); setPendingOpen(true) }} aria-label={`待審核的加入申請，${course.pending.length} 筆`}>
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
              {courseQrShown && (
                <div className="course-join-qr">
                  <img src={join.qrUrl} alt="課程加入 QR Code" />
                  <div className="mono">{join.link}</div>
                </div>
              )}
            </div>

            <form className="course-add" onSubmit={submitStudent}>
              <b>加入學生</b>
              <input type="text" placeholder="姓名" value={newStudent.name} onChange={(e) => setNewStudent((v) => ({ ...v, name: e.target.value }))} aria-label="學生姓名" />
              <input type="email" placeholder="學校信箱" value={newStudent.email} onChange={(e) => setNewStudent((v) => ({ ...v, email: e.target.value }))} aria-label="學生信箱" />
              <button type="submit" className="hint-btn ghost sm" disabled={isFull}>加入</button>
              <span className="course-add-or">或</span>
              <button type="button" className="hint-btn ghost sm" onClick={openImport} disabled={isFull}>批次匯入（CSV）</button>
            </form>
            {rosterError && <p className="course-error" role="alert">{rosterError}</p>}
            {importNote && <p className="course-import-note" role="status">{importNote}</p>}
          </div>

          <Modal show={importOpen} onClose={() => setImportOpen(false)} boxStyle={{ maxWidth: 720 }} labelledBy="importModalTitle">
            <div className="modal-head" id="importModalTitle">
              <div className="name">批次匯入學生</div>
              <div className="pending-sub">目前人數 {course.studentCount} / {course.capacity}，還可以加入 {Math.max(0, course.capacity - course.studentCount)} 位。</div>
            </div>
            <div className="import-guide">
              <p>檔案第一列寫欄位名稱：<b>姓名</b>、<b>信箱</b>（必填），<b>系級</b>（選填）。用 Excel 的話，請「另存新檔 → CSV（逗號分隔）」。</p>
              <a href={sampleUrl} download="學生名單範例.csv">下載範例檔</a>
            </div>
            <label className="import-pick">
              <input type="file" accept={ACCEPTED_FILES} onChange={handleImportFile} />
              <span className="hint-btn ghost sm">{importFileName ? '重新選擇檔案' : '選擇檔案'}</span>
              <span className="import-file-name">{importFileName || '還沒選擇檔案'}</span>
            </label>
            {importError && <p className="course-error" role="alert">{importError}</p>}
            {importRows.length > 0 && (
              <>
                <p className="import-summary">
                  共 {importRows.length} 位：<b className="ok">可以加入 {importOk.length} 位</b>
                  {importRows.length > importOk.length && <>、<b className="bad">無法加入 {importRows.length - importOk.length} 位</b>（下面標示原因，不會加入）</>}
                </p>
                <div className="import-table-wrap">
                  <table className="roster-table import-table">
                    <thead><tr><th>列</th><th>姓名</th><th>信箱</th><th>系級</th><th>狀態</th></tr></thead>
                    <tbody>
                      {importRows.map((r) => (
                        <tr key={`${r.line}-${r.email}`} className={r.status === 'ok' ? '' : 'bad'}>
                          <td className="num">{r.line}</td><td>{r.name || '—'}</td><td>{r.email || '—'}</td><td>{r.dept || '—'}</td>
                          <td><span className={`import-status ${r.status}`}>{STATUS_TEXT[r.status]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="group-modal-actions">
              <span />
              <button type="button" className="hint-btn ghost sm" onClick={() => setImportOpen(false)}>取消</button>
              <button type="button" className="hint-btn sm" disabled={importOk.length === 0} onClick={() => confirmImport(importOk)}>加入 {importOk.length} 位學生</button>
            </div>
          </Modal>

          <Modal show={pendingOpen} onClose={() => setPendingOpen(false)} boxStyle={{ maxWidth: 560 }} labelledBy="pendingModalTitle">
            <div className="modal-head" id="pendingModalTitle">
              <div className="name">待審核的加入申請（{course.pending.length}）</div>
              <div className="pending-sub">目前人數 {course.studentCount} / {course.capacity}{isFull ? '（已滿，不能再核准）' : ''}</div>
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
            {pendingError && <p className="course-error" role="alert">{pendingError}</p>}
          </Modal>

          <div className="panel" style={{ marginTop: 14 }}>
            <div className="roster-head">
              <div className="eyebrow">學生名單（{course.studentCount} / {course.capacity} 人{isFull ? '，已滿' : ''}）</div>
            </div>
            <div className="roster-filters" role="search">
              <input type="search" placeholder="搜尋姓名、系級或信箱" value={rosterQuery} onChange={(e) => setRosterQuery(e.target.value)} aria-label="搜尋學生" />
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} aria-label="依系級篩選">
                <option value="all">全部系級</option>
                {depts.map((d) => <option value={d} key={d}>{d}</option>)}
              </select>
              {filtering && <button type="button" className="hint-btn ghost sm" onClick={clearRosterFilters}>清除篩選</button>}
            </div>
            {/* 平常不顯示說明；有搜尋或篩選時才顯示符合幾人 */}
            {filtering && <p className="roster-count">符合條件 {shownStudents.length} 人</p>}
            <table className="roster-table" style={{ marginTop: 8 }}>
              <thead><tr><th>姓名</th><th>系級</th><th>累積 4D 平均</th><th>出席次數</th></tr></thead>
              <tbody>
                {shownStudents.length === 0 && (
                  <tr><td colSpan={4} className="roster-empty">沒有符合條件的學生</td></tr>
                )}
                {/* 信箱直接顯示在名字後面（橢圓底色框），不用再點開 */}
                {shownStudents.map((r) => (
                  <tr key={r.email ?? r.name}>
                    <td>
                      {r.name}
                      {r.email && <span className="student-email">{r.email}</span>}
                      {r.isNew && <em className="new-student">新加入</em>}
                    </td>
                    <td>{r.dept}</td>
                    <td className="num">{r.avg}</td><td className="num">{r.attend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
