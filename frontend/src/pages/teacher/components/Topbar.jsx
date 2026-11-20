import { useEffect, useRef, useState } from 'react'
import { IconMenu, IconClose } from '../icons.jsx'
import { LogoMark } from '../../landing/Landing.jsx'

/*
  上方列：左邊是漢堡選單 → logo，跟學生端一樣不顯示頁面名稱；右邊是圓形頭像。
  點左上角 logo 回網站首頁（只有學生、教師兩個入口的那一頁）；onLogoClick 由 TeacherApp 決定要不要先確認。
  點頭像打開小選單：「帳號資訊」「設定」。點選單外面或按 Esc 會收起來。
*/
export default function Topbar({ sidebarOpen, onToggleSidebar, onLogoClick, userName, onGoto }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  function pick(id) {
    setMenuOpen(false)
    onGoto(id)
  }

  return (
    <div className="topbar-app">
      <button className="sidebar-toggle" aria-label="開啟／收合選單" onClick={onToggleSidebar}>
        {sidebarOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
      </button>
      <a className="landing-logo topbar-logo" href="/" onClick={onLogoClick}>
        <LogoMark />
        <span>Prompt Master</span>
      </a>
      <div className="topbar-user" ref={wrapRef}>
        <button
          type="button"
          className="topbar-avatar"
          aria-label={`${userName}，開啟帳號選單`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {userName.charAt(0)}
        </button>
        {menuOpen && (
          <div className="topbar-menu" role="menu">
            <div className="topbar-menu-who">{userName} 老師</div>
            <button type="button" role="menuitem" onClick={() => pick('account')}>帳號資訊</button>
            <button type="button" role="menuitem" onClick={() => pick('settings')}>設定</button>
          </div>
        )}
      </div>
    </div>
  )
}
