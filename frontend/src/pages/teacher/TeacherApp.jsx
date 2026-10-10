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
import Modal from './components/Modal.jsx'
import { COURSES, INITIAL_BANK, COURSE_GROUPS, CATEGORIES, UNCATEGORIZED, CATEGORY_COLORS } from './data.js'
import { playClick, playSuccess, playDelete } from './sound.js'
import { applyUiScale, getUiScaleId, resetUiScale } from './uiScale.js'

/*
  背景點綴：固定在畫面後面的一層小星星、愛心、圓點，純裝飾（pointer-events:none、aria-hidden）。
  位置、大小、顏色、動畫延遲都寫在資料裡，用 CSS 變數傳給 .bg-deco-item，要加減點綴只改這個陣列。
  shape: star 五角星、spark 四角閃光、heart 愛心、dot 圓點、ring 空心圓。
*/
const BG_DECO = [
  { shape: 'star',  x: '13%', y: '82%', size: 30, color: '#FFC93C', delay: 0,   anim: 'twinkle' },
  { shape: 'spark', x: '9%',  y: '68%', size: 38, color: '#5BB8FF', delay: .8,  anim: 'twinkle' },
  { shape: 'heart', x: '5%',  y: '88%', size: 30, color: '#FF8FB1', delay: 1.6, anim: 'float' },
  { shape: 'dot',   x: '17%', y: '58%', size: 14, color: '#B79BFF', delay: .4,  anim: 'float' },
  { shape: 'ring',  x: '24%', y: '90%', size: 28, color: '#5FD3A5', delay: 1.2, anim: 'float' },
  { shape: 'spark', x: '33%', y: '76%', size: 26, color: '#FFA66B', delay: 2.0, anim: 'twinkle' },
  { shape: 'star',  x: '44%', y: '92%', size: 30, color: '#B79BFF', delay: .6,  anim: 'twinkle' },
  { shape: 'dot',   x: '53%', y: '80%', size: 13, color: '#FF8FB1', delay: 1.4, anim: 'float' },
  { shape: 'heart', x: '64%', y: '90%', size: 32, color: '#FFA66B', delay: 2.4, anim: 'float' },
  { shape: 'spark', x: '76%', y: '74%', size: 40, color: '#FFC93C', delay: 1.0, anim: 'twinkle' },
  { shape: 'ring',  x: '88%', y: '86%', size: 28, color: '#FF8FB1', delay: .2,  anim: 'float' },
  { shape: 'star',  x: '95%', y: '44%', size: 34, color: '#5FD3A5', delay: 1.8, anim: 'twinkle' },
  { shape: 'dot',   x: '96%', y: '66%', size: 16, color: '#5BB8FF', delay: .9,  anim: 'float' },
  { shape: 'heart', x: '94%', y: '22%', size: 26, color: '#B79BFF', delay: 2.8, anim: 'float' },
  { shape: 'star',  x: '58%', y: '66%', size: 22, color: '#FF8FB1', delay: 2.2, anim: 'twinkle' },
  { shape: 'spark', x: '82%', y: '93%', size: 22, color: '#5FD3A5', delay: 1.1, anim: 'twinkle' },
]

const DECO_PATHS = {
  star: <path d="M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20.1l1.4-6.4L2.7 9.3l6.5-.7z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  spark: <path d="M12 2c.7 5.2 2.3 8.1 6 10-3.7 1.9-5.3 4.8-6 10-.7-5.2-2.3-8.1-6-10 3.7-1.9 5.3-4.8 6-10z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />,
  heart: <path d="M12 20.5s-8-4.9-8-11A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.5c0 6.1-8 11-8 11z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  dot: <circle cx="12" cy="12" r="8" fill="currentColor" />,
  ring: <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="3.2" />,
}

function BgDecor() {
  return (
    <div className="bg-deco" aria-hidden="true">
      {BG_DECO.map((d, i) => (
        <svg
          key={i}
          className={`bg-deco-item ${d.anim}`}
          viewBox="0 0 24 24"
          style={{ left: d.x, top: d.y, width: d.size, height: d.size, color: d.color, animationDelay: `${d.delay}s` }}
        >
          {DECO_PATHS[d.shape]}
        </svg>
      ))}
    </div>
  )
}

// 這三個畫面是深色的現場／結果流程：整頁換成深藍夜空底色（見 teacher.css 的 .dark-flow），
// 不再把內容包在一個大圓角框裡，點綴也改成會發光的版本
const DARK_SCREENS = ['arena-teacher', 'team-detail', 'results-teacher']

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
  // 課程的小組名單：預設系統隨機分組，老師可以手動調整（目前所有課程共用同一份假資料）
  const [groups, setGroups] = useState(COURSE_GROUPS)
  const [groupMode, setGroupMode] = useState('random')
  // 題庫管理目前在看哪一類：全部／某個分類／某個難度（由側邊欄選擇）
  const [bankFilter, setBankFilter] = useState({ type: 'all', value: null })
  // 題庫分類：老師可以自行新增、刪除；刪掉分類時，裡面的題庫會移到「未分類」
  const [categories, setCategories] = useState(CATEGORIES)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState(CATEGORY_COLORS[0])
  const hasUncategorized = bank.some((b) => b.category === UNCATEGORIZED.name)
  const allCategories = hasUncategorized ? [...categories, UNCATEGORIZED] : categories
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

  function handleUpdateCase(idx, updated) {
    setBank((prev) => prev.map((b, i) => (i === idx ? updated : b)))
    playSuccess()
  }

  function openAddCategory() {
    setCatName('')
    setCatColor(CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length])
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
    setCategories((prev) => [...prev, { name: catNameTrim, tone: catColor, tag: '自訂分類' }])
    setCatModalOpen(false)
    setBankFilter({ type: 'category', value: catNameTrim })
    goto('bank-manage')
    playSuccess()
  }

  function handleDeleteCategory(name) {
    const moved = bank.filter((b) => b.category === name).length
    setCategories((prev) => prev.filter((c) => c.name !== name))
    setBank((prev) => prev.map((b) => (b.category === name ? { ...b, category: UNCATEGORIZED.name } : b)))
    setBankFilter(moved > 0 ? { type: 'category', value: UNCATEGORIZED.name } : { type: 'all', value: null })
    playDelete()
  }

  function handleDeleteCase(idx) {
    setBank((prev) => prev.filter((_, i) => i !== idx))
    playDelete()
  }

  const [title, subtitle] = screen === 'course-detail'
    ? ['課程管理', activeCourse.title]
    : TITLES[screen]

  return (
    <div className={`app${DARK_SCREENS.includes(screen) ? ' dark-flow' : ''}`} ref={appRef}>
      <BgDecor />
      <Sidebar
        activeScreen={screen}
        open={sidebarOpen}
        onNavigate={navigateFromSidebar}
        courses={COURSES}
        activeCourseId={activeCourse.id}
        onSelectCourse={(course) => { handleSelectCourse(course); setSidebarOpen(false) }}
        bank={bank}
        categories={allCategories}
        onAddCategory={openAddCategory}
        bankFilter={bankFilter}
        onSelectBankFilter={(type, value = null) => { setBankFilter({ type, value }); goto('bank-manage'); setSidebarOpen(false) }}
      />
      <div className="main-col">
        <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} title={title} subtitle={subtitle} />
        <main>
          <div className="screen-pop" key={screen}>
            {screen === 'teacher-home' && (
              <TeacherHome onSelectCourse={handleSelectCourse} />
            )}
            {screen === 'course-detail' && (
              <CourseDetail course={activeCourse} bank={bank} categories={allCategories} groups={groups} groupMode={groupMode} onSaveGroups={(next, mode) => { setGroups(next); setGroupMode(mode); playSuccess() }} onBack={() => goto('teacher-home')} onStartArena={handleStartArena} />
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
            {screen === 'results-teacher' && (
              <Results caseName={arenaConfig?.caseName ?? '供應鏈勞動爭議'} onBackHome={() => goto('teacher-home')} onToast={showToast} />
            )}
            {screen === 'bank-manage' && <BankManage bank={bank} categories={allCategories} onDeleteCategory={handleDeleteCategory} filter={bankFilter} onFilterChange={(type, value) => setBankFilter({ type, value })} onAddCase={handleAddCase} onUpdateCase={handleUpdateCase} onDeleteCase={handleDeleteCase} />}
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
          <label>顏色</label>
          <div className="cat-swatches" role="radiogroup" aria-label="分類顏色">
            {CATEGORY_COLORS.map((color) => (
              <button type="button" role="radio" aria-checked={catColor === color} aria-label={color} className={catColor === color ? 'on' : ''} style={{ background: color }} key={color} onClick={() => setCatColor(color)} />
            ))}
          </div>
          <button type="submit" className="hint-btn sm" disabled={!catNameTrim || Boolean(catNameError)}>新增分類</button>
        </form>
      </Modal>

      <div className={`toast-hint${toast ? ' show' : ''}`}>
        <div className="who">（預覽）學生端會看到 ——</div>
        <div className="body">{toast || '—'}</div>
      </div>
    </div>
  )
}
