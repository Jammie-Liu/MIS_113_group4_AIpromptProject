import { IconMenu, IconClose } from '../icons.jsx'
import { LogoMark } from '../../landing/Landing.jsx'

/*
  上方列：漢堡選單 → logo → 目前頁面名稱。跟學生端一樣，點左上角 logo 回網站首頁
  （只有學生、教師兩個入口的那一頁）；onLogoClick 由 TeacherApp 決定要不要先確認。
*/
export default function Topbar({ sidebarOpen, onToggleSidebar, title, subtitle, onLogoClick }) {
  return (
    <div className="topbar-app">
      <button className="sidebar-toggle" aria-label="開啟／收合選單" onClick={onToggleSidebar}>
        {sidebarOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
      </button>
      <a className="landing-logo topbar-logo" href="/" onClick={onLogoClick}>
        <LogoMark />
        <span>Prompt Master</span>
      </a>
      <div className="crumb">
        {title}
        {subtitle && <span className="sub">{subtitle}</span>}
      </div>
    </div>
  )
}
