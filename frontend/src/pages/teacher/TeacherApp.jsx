import { useState, useRef, useEffect } from 'react'
import './teacher.css'
import './teacher-theme.css'
import HeroBackground from '../landing/HeroBackground.jsx'
import Topbar from './components/Topbar.jsx'
import TeacherHome from './screens/TeacherHome.jsx'
import NewHome from './screens/NewHome.jsx'
import TeacherAuth from './screens/TeacherAuth.jsx'
import Account from './screens/Account.jsx'
import { BankFormModal, BankDetailModal, LaunchModal } from './components/LibraryModals.jsx'
import CourseDetail from './screens/CourseDetail.jsx'
import Arena from './screens/Arena.jsx'
import TeamDetail from './screens/TeamDetail.jsx'
import Results from './screens/Results.jsx'
import BankManage from './screens/BankManage.jsx'
import Settings from './screens/Settings.jsx'
import Modal from './components/Modal.jsx'
import { COURSES, PAST_COMPETITIONS, INITIAL_BANK, CATEGORIES, OTHER_CATEGORY, CATEGORY_COLORS, DEFAULT_TASK, generateArenaCode } from './data.js'
import { SEED_ACCOUNTS, SEED_BANKS, SEED_COMPETITIONS, myBanks, sharedBanks, saveBank, nowLocal } from './library.js'
import { playClick, playSuccess, playDelete } from './sound.js'
import { applyUiScale, getUiScaleId, resetUiScale } from './uiScale.js'

/*
  背景：跟學生端賽場同一套——深色底＋淡格線（teacher-theme.css 的 .teacher-bg），
  上面疊首頁的星點、方塊、泡泡（HeroBackground lite）。純裝飾，不擋滑鼠。
*/
function TeacherBackground() {
  return (
    <div className="teacher-bg" aria-hidden="true">
      <HeroBackground lite />
    </div>
  )
}

// 這三個畫面是深色的現場／結果流程：整頁換成深藍夜空底色（見 teacher.css 的 .dark-flow），
// 不再把內容包在一個大圓角框裡，點綴也改成會發光的版本
const DARK_SCREENS = ['arena-teacher', 'team-detail', 'results-teacher']

// 這些頁面最上面有「← 回教師端首頁」（沒有側邊欄之後，從頭像選單進來要有路回去）
const BACK_HOME_SCREENS = ['account', 'settings', 'courses', 'bank-manage']

/*
  全站點擊音效：用事件代理（在整個 document 上掛一個 click listener，不是每顆按鈕各自加 onClick），
  這樣「教師端每一個畫面、每個彈窗」的點擊都會自動有基本的互動回饋，之後新增的按鈕也不用記得手動接。
  掛在 document 而不是 .app，是因為彈窗（Modal）是用 createPortal 掛到 body 底下的，
  在 .app 上監聽會漏掉彈窗裡的點擊。用 capture 階段，不怕哪個元件把事件擋掉。
  個別畫面裡比較重要的動作（建立／刪除題庫等）另外疊加一個更明顯的音效，在各自的處理函式裡。

  判斷「這次點擊算不算一個操作」：
  1. 點到的元素（或它的祖先）是按鈕、連結、頁籤、選單、勾選框、單選鈕等互動元件，而且沒有被停用；
  2. 或者元素的游標是 pointer（CSS 裡設成可點擊的卡片、列等；cursor 會被子元素繼承，所以點卡片裡的文字也算）；
  3. 或者直接點到彈窗的暗色背景（會關閉彈窗）。
  文字框、純文字、被停用的按鈕不發聲。
*/
const SOUND_TARGET_SELECTOR = 'button, a[href], select, summary, input[type="checkbox"], input[type="radio"], input[type="range"], [role="button"], [role="tab"], [role="radio"], [role="switch"], [role="menuitem"]'

function isClickAction(target) {
  if (!(target instanceof Element)) return false
  if (target.classList.contains('modal-overlay')) return true
  const interactive = target.closest(SOUND_TARGET_SELECTOR)
  if (interactive) return !interactive.matches(':disabled, [aria-disabled="true"]')
  if (target.closest('input, textarea, label')) return false
  return window.getComputedStyle(target).cursor === 'pointer'
}

/*
  對應原本 教師端_最初版.js 裡的 goto()：原本用一個字串切換哪個 .screen 顯示，
  這裡改用 React state 來決定要 render 哪個畫面元件。因為畫面改成「只掛載目前
  這一頁」而不是「全部畫面都在 DOM 裡，用 CSS 顯示/隱藏」，所以像課程頁籤這種
  「每次重新進入都要重置」的邏輯，現在會自動達成（畫面切走就整個卸載，
  local state 自然重置），不用再像原本那樣特別寫重置邏輯。

  副作用：像監控台的暫停狀態、剩餘時間，如果中途跳去看隊伍詳情再回來，
  現在會被重置（因為 Arena 元件被卸載又重新掛載）。這在真正接上後端 API 之後
  會被正確解決——競賽是否暫停、剩餘時間，屆時應該是從後端拿的即時狀態，
  而不是畫面自己的 local state，所以這裡先不特別為了保留這段 local state
  而把邏輯往上搬。
*/

export default function TeacherApp({ onBack }) {
  // 登入狀態（docs/system-flow.md 一）：還沒登入只顯示登入／註冊畫面。帳號只有 ID＋姓名，密碼之後再做
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS)
  const [user, setUser] = useState(null)
  // 新版首頁的題庫（含版本紀錄）與競賽（進行中＋歷史），規則見 library.js
  const [library, setLibrary] = useState(SEED_BANKS)
  const [competitions, setCompetitions] = useState(SEED_COMPETITIONS)
  const [activeCompetitionId, setActiveCompetitionId] = useState(null)
  const [bankForm, setBankForm] = useState({ show: false, editing: null, thenLaunch: false })
  const [detailBank, setDetailBank] = useState(null)
  const [launch, setLaunch] = useState({ show: false, bankId: null })
  // 監控台的「返回」要回到進來的地方：從首頁的競賽卡片進來就回首頁，從課程發起就回課程
  const [arenaFrom, setArenaFrom] = useState('teacher-home')
  const [screen, setScreen] = useState('teacher-home')
  // 課程（可新增、可加學生與審核加入申請）與過往競賽紀錄（含競賽結束後寫入的 4D 統計）
  const [courses, setCourses] = useState(COURSES)
  const [activeCourseId, setActiveCourseId] = useState(COURSES[0].id)
  const activeCourse = courses.find((c) => c.id === activeCourseId) ?? courses[0]
  const [pastCompetitions, setPastCompetitions] = useState(PAST_COMPETITIONS)
  const [activeTeamName, setActiveTeamName] = useState(null)
  const [arenaConfig, setArenaConfig] = useState(null)
  const [bank, setBank] = useState(INITIAL_BANK)
  // 排程發布的競賽：按「完成（排程發布）」後先存在這裡，到時間才會出現在學生端（目前是示意）
  const [scheduled, setScheduled] = useState([])
  // 題庫管理目前在看哪一類：全部／某個分類／某個難度（由側邊欄選擇）
  const [bankFilter, setBankFilter] = useState({ type: 'all', value: null })
  // 題庫分類：老師可以自行新增、刪除；「其他」是內建分類，一直排在最後面；刪掉分類時，裡面的題庫會移到「其他」
  const [categories, setCategories] = useState(CATEGORIES)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const allCategories = [...categories, OTHER_CATEGORY]
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const appRef = useRef(null)


  // 教師端整頁放大（要投影展示用），離開教師端時還原，不影響其他頁面
  useEffect(() => {
    applyUiScale(getUiScaleId())
    return () => resetUiScale()
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (isClickAction(e.target)) playClick()
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  function goto(id) {
    setScreen(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 左上角 logo 回到只有學生、教師入口的網站首頁（App.jsx 傳進來的 onBack），不重新載入頁面。
  // 監控台上競賽還在進行，先確認，免得老師誤點離開
  function handleLogoClick(e) {
    e.preventDefault()
    if (screen === 'arena-teacher' && !window.confirm('離開監控台？回到首頁後，這場競賽的監控畫面會關閉。')) return
    onBack()
  }

  function showToast(text) {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 4000)
  }

  function handleSelectCourse(course) {
    setActiveCourseId(course.id)
    goto('course-detail')
  }

  function handleCreateCourse(course) {
    setCourses((list) => [...list, course])
    playSuccess()
  }

  function updateCourse(id, fn) {
    setCourses((list) => list.map((c) => (c.id === id ? fn(c) : c)))
  }

  // 老師直接加學生：人數已滿就不能加（回傳 false，由畫面顯示原因）
  function handleAddStudent(courseId, student) {
    const course = courses.find((c) => c.id === courseId)
    if (!course || course.studentCount >= course.capacity) return false
    updateCourse(courseId, (c) => ({ ...c, studentCount: c.studentCount + 1, extraStudents: [...c.extraStudents, student] }))
    playSuccess()
    return true
  }

  // 批次匯入：一次加入多位學生（在同一次更新裡加，最多加到人數上限），回傳實際加入的人數
  function handleAddStudents(courseId, list) {
    const course = courses.find((c) => c.id === courseId)
    if (!course) return 0
    const adding = list.slice(0, Math.max(0, course.capacity - course.studentCount))
    if (adding.length === 0) return 0
    updateCourse(courseId, (c) => ({ ...c, studentCount: c.studentCount + adding.length, extraStudents: [...c.extraStudents, ...adding] }))
    playSuccess()
    return adding.length
  }

  // 私人課程的加入申請：核准就加入名單（人數滿了不能核准），拒絕就移除
  function handleResolveRequest(courseId, requestId, approve) {
    const course = courses.find((c) => c.id === courseId)
    const request = course?.pending.find((r) => r.id === requestId)
    if (!request) return false
    if (approve && course.studentCount >= course.capacity) return false
    updateCourse(courseId, (c) => ({
      ...c,
      pending: c.pending.filter((r) => r.id !== requestId),
      studentCount: approve ? c.studentCount + 1 : c.studentCount,
      extraStudents: approve ? [...c.extraStudents, { name: request.name, dept: request.dept, email: request.email }] : c.extraStudents,
    }))
    playSuccess()
    return true
  }

  // 競賽結果公布後，把這場的名次與 4D 統計寫入課程的過往競賽紀錄（資料回存）
  function handleRecordCompetition(entry) {
    setPastCompetitions((list) => (list.some((item) => item.id === entry.id) ? list : [entry, ...list]))
    // 確認評分＝競賽結束：從首頁的進行中移到個人帳號管理的歷史紀錄，平均分數（4 個 4D 維度平均相加，滿分 100）也記到題庫上，題庫排序會跟著變
    const comp = competitions.find((c) => c.id === activeCompetitionId)
    if (!comp || comp.status === 'ended') return
    const avgScore = Math.round(Object.values(entry.fourD ?? {}).reduce((sum, d) => sum + d.mean, 0) * 10) / 10
    setCompetitions((list) => list.map((c) => (c.id === comp.id ? { ...c, status: 'ended', stage: undefined, endedAt: nowLocal(), avgScore } : c)))
    if (comp.bankId) setLibrary((list) => list.map((b) => (b.id === comp.bankId ? { ...b, scores: [...b.scores, avgScore] } : b)))
  }

  // 從課程頁發起的競賽，也記成「進行中的競賽」，首頁才看得到、可以再點回監控台
  function handleStartArena(config) {
    updateCourse(activeCourse.id, (c) => ({ ...c, competitionCount: c.competitionCount + 1 }))
    const id = `K-${config.code}`
    setCompetitions((list) => (list.some((c) => c.id === id) ? list : [{
      id, code: config.code, ownerId: user.id, bankId: null, title: config.caseName, groupCount: config.groupCount ?? null, groupCap: config.groupCap ?? null,
      rounds: config.rounds ?? 2, timeLimit: config.timeLimit, status: 'active', createdAt: nowLocal(), config,
    }, ...list]))
    setActiveCompetitionId(id)
    setArenaConfig(config)
    setArenaFrom('course-detail')
    goto('arena-teacher')
  }

  function competitionConfig(c) {
    if (c.config) return c.config
    const bank = library.find((b) => b.id === c.bankId)
    return {
      code: c.code, caseName: c.title, rounds: c.rounds, timeLimit: c.timeLimit, groupCount: c.groupCount, groupCap: c.groupCap,
      caseData: { bg: bank?.content ?? '', task: DEFAULT_TASK, tension: '', roles: '' },
    }
  }

  // 首頁的競賽卡片：還在比就進監控台；已經比完、等老師確認評分的就進評分頁
  function handleOpenCompetition(c) {
    setActiveCompetitionId(c.id)
    setArenaConfig(competitionConfig(c))
    setArenaFrom('teacher-home')
    goto(c.stage === 'grading' ? 'results-teacher' : 'arena-teacher')
  }

  function handleLaunchCompetition({ bank, groupCount, groupCap, rounds, timeLimit }) {
    const { code } = generateArenaCode()
    const comp = { id: `K-${code}`, code, ownerId: user.id, bankId: bank.id, title: bank.topic, groupCount, groupCap, rounds, timeLimit, status: 'active', createdAt: nowLocal() }
    setCompetitions((list) => [comp, ...list])
    setLaunch({ show: false, bankId: null })
    setDetailBank(null)
    playSuccess()
    handleOpenCompetition(comp)
  }

  function handleSaveBank(data) {
    const { banks, saved } = saveBank(library, { editing: bankForm.editing, data, user })
    setLibrary(banks)
    const thenLaunch = bankForm.thenLaunch
    setBankForm({ show: false, editing: null, thenLaunch: false })
    playSuccess()
    if (thenLaunch) setLaunch({ show: true, bankId: saved.id })
    else setDetailBank(saved)
  }

  // 監控台按「結束整場並評分」或最後一回合結束：競賽還沒結束（老師還沒確認評分），先標成待評分
  function handleArenaEnd({ scoredRounds }) {
    setArenaConfig((c) => ({ ...c, scoredRounds }))
    // 一個回合都沒評完就結束：沒有分數可以確認，直接算結束（進歷史紀錄、不算進題庫平均分數）
    setCompetitions((list) => list.map((c) => {
      if (c.id !== activeCompetitionId) return c
      if (scoredRounds === 0) return { ...c, status: 'ended', stage: undefined, endedAt: nowLocal(), avgScore: null }
      return { ...c, stage: 'grading', config: { ...competitionConfig(c), scoredRounds } }
    }))
    goto('results-teacher')
  }

  function handleOpenTeam(name) {
    setActiveTeamName(name)
    goto('team-detail')
  }

  function handleAddCase(newCase) {
    setBank((prev) => [newCase, ...prev])
    playSuccess()
  }

  function handleUpdateCase(idx, updated) {
    setBank((prev) => prev.map((b, i) => (i === idx ? updated : b)))
    playSuccess()
  }

  function openAddCategory() {
    setCatName('')
    setCatModalOpen(true)
  }

  const catNameTrim = catName.trim()
  const catNameError = !catNameTrim
    ? ''
    : allCategories.some((c) => c.name === catNameTrim)
      ? '已經有同名的分類了'
      : ''

  function handleAddCategory() {
    if (!catNameTrim || catNameError) return
    // 顏色由系統自動配：先用還沒有分類用過的顏色，都用過了就依序輪流（新增視窗暫時不讓老師選顏色）
    const unused = CATEGORY_COLORS.find((color) => !categories.some((c) => c.tone === color))
    const tone = unused ?? CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]
    setCategories((prev) => [...prev, { name: catNameTrim, tone, tag: '自訂分類' }])
    setCatModalOpen(false)
    setBankFilter({ type: 'category', value: catNameTrim })
    goto('bank-manage')
    playSuccess()
  }

  function handleDeleteCategory(name) {
    const moved = bank.filter((b) => b.category === name).length
    setCategories((prev) => prev.filter((c) => c.name !== name))
    setBank((prev) => prev.map((b) => (b.category === name ? { ...b, category: OTHER_CATEGORY.name } : b)))
    setBankFilter(moved > 0 ? { type: 'category', value: OTHER_CATEGORY.name } : { type: 'all', value: null })
    playDelete()
  }

  function handleDeleteCase(idx) {
    setBank((prev) => prev.filter((_, i) => i !== idx))
    playDelete()
  }

  if (!user) {
    return (
      <div className="app teacher-app">
        <TeacherBackground />
        <TeacherAuth
          accounts={accounts}
          onBack={onBack}
          onLogin={(account) => { setUser(account); setScreen('teacher-home') }}
          onRegister={(account) => { setAccounts((list) => [...list, account]); setUser(account); setScreen('teacher-home') }}
        />
      </div>
    )
  }

  const mine = myBanks(library, user.id)
  const shared = sharedBanks(library, user.id)
  const activeCompetitions = competitions.filter((c) => c.ownerId === user.id && c.status === 'active')
  const history = competitions.filter((c) => c.ownerId === user.id && c.status === 'ended')

  function handleRename(name) {
    const next = { ...user, name }
    setUser(next)
    setAccounts((list) => list.map((a) => (a.id === user.id ? next : a)))
    setLibrary((list) => list.map((b) => ({
      ...b,
      ownerName: b.ownerId === user.id ? name : b.ownerName,
      versions: b.versions.map((v) => (v.editorId === user.id ? { ...v, editorName: name } : v)),
    })))
  }

  function handleLogout() {
    setUser(null)
    setDetailBank(null)
  }

  return (
    <div className={`app teacher-app${DARK_SCREENS.includes(screen) ? ' dark-flow' : ''}`} ref={appRef}>
      <TeacherBackground />
      <div className="main-col">
        <Topbar onLogoClick={handleLogoClick} userName={user.name} onGoto={goto} onLogout={handleLogout} />
        <main>
          <div className="screen-pop" key={screen}>
            {/* 2026-11-25 拿掉側邊欄：帳號資訊、設定等頁面改用這顆按鈕回教師端首頁 */}
            {BACK_HOME_SCREENS.includes(screen) && (
              <button type="button" className="hint-btn ghost sm back-home-btn" onClick={() => goto('teacher-home')}>← 回教師端首頁</button>
            )}
            {screen === 'teacher-home' && (
              <NewHome
                user={user}
                competitions={activeCompetitions}
                history={history}
                banks={library}
                mine={mine}
                shared={shared}
                onOpenCompetition={handleOpenCompetition}
                onOpenBank={setDetailBank}
                onCreateBank={() => setBankForm({ show: true, editing: null, thenLaunch: false })}
                onLaunch={() => setLaunch({ show: true, bankId: null })}
              />
            )}
            {screen === 'courses' && (
              <TeacherHome userName={user.name} courses={courses} onSelectCourse={handleSelectCourse} onCreateCourse={handleCreateCourse} />
            )}
            {screen === 'account' && (
              <Account user={user} onRename={handleRename} onLogout={handleLogout} />
            )}
            {screen === 'course-detail' && (
              <CourseDetail course={activeCourse} bank={bank} categories={allCategories} scheduled={scheduled} onSchedule={(item) => setScheduled((list) => [...list, item])} onCancelSchedule={(id) => setScheduled((list) => list.filter((item) => item.id !== id))} pastCompetitions={pastCompetitions} onAddStudent={handleAddStudent} onAddStudents={handleAddStudents} onResolveRequest={handleResolveRequest} onBack={() => goto('courses')} onStartArena={handleStartArena} />
            )}
            {screen === 'arena-teacher' && arenaConfig && (
              <Arena
                config={arenaConfig}
                onBack={() => goto(arenaFrom)}
                backLabel={arenaFrom === 'teacher-home' ? '← 返回首頁' : '← 返回課程'}
                onOpenTeam={handleOpenTeam}
                onEnd={handleArenaEnd}
                onToast={showToast}
              />
            )}
            {screen === 'team-detail' && activeTeamName && (
              <TeamDetail teamName={activeTeamName} onBack={() => goto('arena-teacher')} onToast={showToast} />
            )}
            {screen === 'results-teacher' && (
              <Results caseName={arenaConfig?.caseName ?? '供應鏈勞動爭議'} competitionId={arenaConfig?.code ?? 'demo'} totalRounds={arenaConfig?.rounds ?? 2} scoredRounds={arenaConfig?.scoredRounds} onRecordCompetition={handleRecordCompetition} onBackHome={() => goto('teacher-home')} onToast={showToast} />
            )}
            {screen === 'bank-manage' && <BankManage bank={bank} categories={allCategories} onDeleteCategory={handleDeleteCategory} filter={bankFilter} onFilterChange={(type, value) => setBankFilter({ type, value })} onAddCategory={openAddCategory} onAddCase={handleAddCase} onUpdateCase={handleUpdateCase} onDeleteCase={handleDeleteCase} />}
            {screen === 'settings' && <Settings />}
          </div>
        </main>
      </div>
      <Modal show={catModalOpen} onClose={() => setCatModalOpen(false)} boxStyle={{ maxWidth: 420 }} labelledBy="catModalTitle">
        <div className="modal-head" id="catModalTitle">
          <div className="name">新增分類</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>分類用來整理題庫，發起競賽時也是從分類裡挑題目</div>
        </div>
        <form className="cat-form" onSubmit={(e) => { e.preventDefault(); handleAddCategory() }}>
          <label htmlFor="catNameInput">分類名稱</label>
          <input id="catNameInput" type="text" maxLength={12} placeholder="例：永續與 ESG" value={catName} onChange={(e) => setCatName(e.target.value)} autoFocus />
          {catNameError && <div className="cat-error" role="alert">{catNameError}</div>}
          <button type="submit" className="hint-btn sm" disabled={!catNameTrim || Boolean(catNameError)}>新增分類</button>
        </form>
      </Modal>

      <BankDetailModal
        bank={detailBank ? library.find((b) => b.id === detailBank.id) ?? null : null}
        banks={library}
        user={user}
        onClose={() => setDetailBank(null)}
        onOpenBank={setDetailBank}
        onEdit={(bank) => { setDetailBank(null); setBankForm({ show: true, editing: bank, thenLaunch: false }) }}
        onLaunch={(bank) => setLaunch({ show: true, bankId: bank.id })}
      />
      <BankFormModal show={bankForm.show} editing={bankForm.editing} user={user} onClose={() => setBankForm({ show: false, editing: null, thenLaunch: false })} onSave={handleSaveBank} />
      <LaunchModal
        show={launch.show}
        initialBankId={launch.bankId}
        mine={mine}
        shared={shared}
        onClose={() => setLaunch({ show: false, bankId: null })}
        onLaunch={handleLaunchCompetition}
        onForkFirst={(bank) => { setLaunch({ show: false, bankId: null }); setBankForm({ show: true, editing: bank, thenLaunch: true }) }}
      />

      <div className={`toast-hint${toast ? ' show' : ''}`}>
        <div className="who">（預覽）學生端會看到 ——</div>
        <div className="body">{toast || '—'}</div>
      </div>
    </div>
  )
}
