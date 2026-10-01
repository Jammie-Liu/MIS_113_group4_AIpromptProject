import { IconMenu, IconClose } from '../icons.jsx'

export default function Topbar({ sidebarOpen, onToggleSidebar, title, subtitle }) {
  return (
    <div className="topbar-app">
      <button className="sidebar-toggle" aria-label="開啟／收合選單" onClick={onToggleSidebar}>
        {sidebarOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
      </button>
      <div className="crumb">
        {title}
        <span className="sub">{subtitle}</span>
      </div>
    </div>
  )
}
