import { useState, useRef, useEffect } from 'react'
import './teacher.css'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import TeacherHome from './screens/TeacherHome.jsx'
import CourseDetail from './screens/CourseDetail.jsx'
import Arena from './screens/Arena.jsx'
import TeamDetail from './screens/TeamDetail.jsx'
import Results from './screens/Results.jsx'
import BankManage from './screens/BankManage.jsx'
import Settings from './screens/Settings.jsx'
import { COURSES, INITIAL_BANK, ACHIEVEMENTS, computeUnlockedAchievementIds } from './data.js'
import { playClick, playUnlock, playSuccess, playDelete } from './sound.js'

/*
  全站點擊音效：用事件代理（在 .app 上掛一個 click listener），而不是每個
  畫面、每顆按鈕各自加 onClick 呼叫音效，這樣「教師端全部畫面」都能有基本的
  互動回饋，之後新增畫面只要用到這些既有的 class（按鈕、頁籤、卡片、側邊欄
  連結）就會自動有音效，不用每個畫面都記得手動接。個別畫面裡比較重要的動作
  （建立/刪除題庫、成就解鎖）另外疊加一個更明顯的音效，在各自的處理函式裡。
*/
const SOUND_TARGET_SELECTOR = '.hint-btn, .sb-link, .res-tab, .course-card, .bank-card-toggle, .team-card, .arena-team-card, .past-comp, .sidebar-toggle'

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

const TITLES = {
  'teacher-home': ['首頁', '你開設的所有課程'],
  'bank-manage': ['題庫管理', '系統提供給競賽使用的商業兩難案例題庫'],
  'arena-teacher': ['即時監控台', '商業兩難競技場 · 教師視角'],
  'team-detail': ['隊伍詳情', '點開查看該隊完整即時狀況'],
  'results-teacher': ['評分與總覽', '競賽結束 · 教師視角'],
  settings: ['設定', '個人資料、帳號、通知與競賽預設值'],
}

export default function TeacherApp() {
  const [screen, setScreen] = useState('teacher-home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeCourse, setActiveCourse] = useState(COURSES[0])
  const [activeTeamName, setActiveTeamName] = useState(null)
  const [arenaConfig, setArenaConfig] = useState(null)
  const [bank, setBank] = useState(INITIAL_BANK)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const appRef = useRef(null)

  const ownCaseCount = bank.filter((b) => b.source === 'own').length
  const unlockedIds = computeUnlockedAchievementIds(ownCaseCount)
  const prevUnlockedRef = useRef(unlockedIds)
  const [justUnlockedId, setJustUnlockedId] = useState(null)

  useEffect(() => {
    const el = appRef.current
    if (!el) return
    function handleClick(e) {
      if (e.target.closest(SOUND_TARGET_SELECTOR)) playClick()
    }
    el.addEventListener('click', handleClick)
    return () => el.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    const prev = prevUnlockedRef.current
    const newlyUnlocked = [...unlockedIds].find((id) => !prev.has(id))
    if (newlyUnlocked) {
      const achv = ACHIEVEMENTS.find((a) => a.id === newlyUnlocked)
      playUnlock()
      showToast(`🎉 解鎖成就：${achv.title}！${achv.desc}`)
      setJustUnlockedId(newlyUnlocked)
      window.setTimeout(() => setJustUnlockedId(null), 900)
    }
    prevUnlockedRef.current = unlockedIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownCaseCount])

  function goto(id) {
    setScreen(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function navigateFromSidebar(id) {
    goto(id)
    setSidebarOpen(false)
  }

  function showToast(text) {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 4000)
  }

  function handleSelectCourse(course) {
    setActiveCourse(course)
    goto('course-detail')
  }

  function handleStartArena(config) {
    setArenaConfig(config)
    goto('arena-teacher')
  }

  function handleOpenTeam(name) {
    setActiveTeamName(name)
    goto('team-detail')
  }

  function handleAddCase(newCase) {
    setBank((prev) => [newCase, ...prev])
    playSuccess()
  }

  function handleDeleteCase(idx) {
    setBank((prev) => prev.filter((_, i) => i !== idx))
    playDelete()
  }

  const [title, subtitle] = screen === 'course-detail'
    ? ['課程管理', activeCourse.title]
    : TITLES[screen]

  return (
    <div className="app" ref={appRef}>
      <Sidebar activeScreen={screen} open={sidebarOpen} onNavigate={navigateFromSidebar} />
      <div className="main-col">
        <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} title={title} subtitle={subtitle} />
        <main>
          <div className="screen-pop" key={screen}>
            {screen === 'teacher-home' && (
              <TeacherHome onSelectCourse={handleSelectCourse} unlockedAchievementIds={unlockedIds} justUnlockedId={justUnlockedId} />
            )}
            {screen === 'course-detail' && (
              <CourseDetail course={activeCourse} onBack={() => goto('teacher-home')} onStartArena={handleStartArena} />
            )}
            {screen === 'arena-teacher' && arenaConfig && (
              <Arena
                config={arenaConfig}
                onBack={() => goto('course-detail')}
                onOpenTeam={handleOpenTeam}
                onEnd={() => goto('results-teacher')}
                onToast={showToast}
              />
            )}
            {screen === 'team-detail' && activeTeamName && (
              <TeamDetail teamName={activeTeamName} onBack={() => goto('arena-teacher')} onToast={showToast} />
            )}
            {screen === 'results-teacher' && <Results onBackHome={() => goto('teacher-home')} />}
            {screen === 'bank-manage' && <BankManage bank={bank} onAddCase={handleAddCase} onDeleteCase={handleDeleteCase} />}
            {screen === 'settings' && <Settings />}
          </div>
        </main>
      </div>
      <div className={`toast-hint${toast ? ' show' : ''}`}>
        <div className="who">（預覽）學生端會看到 ——</div>
        <div className="body">{toast || '—'}</div>
      </div>
    </div>
  )
}
