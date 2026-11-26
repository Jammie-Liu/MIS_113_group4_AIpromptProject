import { useEffect, useRef, useState } from 'react'
import { LogoMark } from '../../landing/Landing.jsx'
import Modal from './Modal.jsx'

/*
  上方列：左邊是 logo（2026-11-25 拿掉側邊欄後也拿掉漢堡選單），跟學生端一樣不顯示頁面名稱；右邊是圓形頭像。
  點左上角 logo 回網站首頁（只有學生、教師兩個入口的那一頁）；onLogoClick 由 TeacherApp 決定要不要先確認。
  點頭像打開小選單：「帳號資訊」「設定」，最下面是「登出」（會先跳確認視窗）。點選單外面或按 Esc 會收起來。
*/
export default function Topbar({ onLogoClick, userName, onGoto, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
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
            <button type="button" role="menuitem" className="topbar-menu-logout" onClick={() => { setMenuOpen(false); setLogoutOpen(true) }}>登出</button>
          </div>
        )}
      </div>

      <Modal show={logoutOpen} onClose={() => setLogoutOpen(false)} boxStyle={{ maxWidth: 380, textAlign: 'center' }} labelledBy="logoutModalTitle">
        <div className="modal-head" id="logoutModalTitle" style={{ paddingRight: 0 }}>
          <div className="name">確定要登出嗎？</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 8 }}>登出後需要重新登入才能繼續使用</div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button className="hint-btn ghost sm" onClick={() => setLogoutOpen(false)}>取消</button>
          <button className="hint-btn sm danger-btn" onClick={() => { setLogoutOpen(false); onLogout() }}>確認登出</button>
        </div>
      </Modal>
    </div>
  )
}
