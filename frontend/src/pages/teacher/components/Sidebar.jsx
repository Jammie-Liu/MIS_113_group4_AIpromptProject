const LINKS = [
  {
    id: 'teacher-home',
    label: '首頁',
    icon: (
      <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 11.5 12 4.5l8.5 7" />
        <path d="M5.5 10v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10" />
        <path d="M9.5 19.5V14a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" />
      </svg>
    ),
  },
  {
    id: 'bank-manage',
    label: '題庫管理',
    icon: (
      <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.2c-1.6-1.4-3.7-2-6.5-2A1 1 0 0 0 4.5 5.2v12.6c0 .6.5 1 1.1.9 2.5-.3 4.5.2 6 1.5" />
        <path d="M12 6.2c1.6-1.4 3.7-2 6.5-2a1 1 0 0 1 1 1v12.6c0 .6-.5 1-1.1.9-2.5-.3-4.5.2-6 1.5" />
        <path d="M12 6.2v14" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: '設定',
    icon: (
      <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2.8" />
        <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8 6.3 6.3" />
      </svg>
    ),
  },
]

export default function Sidebar({ activeScreen, open, onNavigate }) {
  return (
    <aside className={`sidebar${open ? '' : ' collapsed'}`}>
      <div className="sb-top">
        <div className="sb-avatar">張</div>
        <div className="sb-who">
          <div className="name">張欣綠 老師</div>
          <div className="role">資訊管理學系</div>
        </div>
      </div>
      {LINKS.map((link) => (
        <div
          key={link.id}
          className={`sb-link${activeScreen === link.id ? ' active' : ''}`}
          onClick={() => onNavigate(link.id)}
        >
          <span className="ic">{link.icon}</span>{link.label}
        </div>
      ))}
    </aside>
  )
}
