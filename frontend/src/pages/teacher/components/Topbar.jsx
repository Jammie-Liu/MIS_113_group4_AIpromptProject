import { IconMenu, IconClose } from '../icons.jsx'

// 右上角人像：登入後才有，點了進「個人帳號管理」（帳號資料、歷史競賽紀錄、登出）
function IconPerson() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c.9-3.9 3.9-6 7.5-6s6.6 2.1 7.5 6" />
    </svg>
  )
}

export default function Topbar({ sidebarOpen, onToggleSidebar, title, subtitle, user, accountActive, onAccount }) {
  return (
    <div className="topbar-app">
      <button className="sidebar-toggle" aria-label="開啟／收合選單" onClick={onToggleSidebar}>
        {sidebarOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
      </button>
      <div className="crumb">
        {title}
        {subtitle && <span className="sub">{subtitle}</span>}
      </div>
      {user && (
        <button type="button" className={`tb-account${accountActive ? ' active' : ''}`} onClick={onAccount} aria-label={`個人帳號管理（${user.name}）`} title="個人帳號管理">
          <span className="tb-account-name">{user.name}</span>
          <span className="tb-account-ic"><IconPerson /></span>
        </button>
      )}
    </div>
  )
}
