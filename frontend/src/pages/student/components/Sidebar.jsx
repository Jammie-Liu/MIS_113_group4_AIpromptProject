import { IconHome, IconCourses, IconHistory, IconLogout } from '../icons.jsx';

const NAV_ITEMS = [
  { id: 'home', label: '首頁', Icon: IconHome },
  { id: 'courses', label: '我的課程', Icon: IconCourses },
  { id: 'history', label: '競賽紀錄', Icon: IconHistory },
];

export default function Sidebar({ screen, onGoto, name }) {
  return (
    <aside className="stu-sidebar">
      <div className="stu-sb-top">
        <div className="stu-sb-avatar">{name.charAt(0)}</div>
        <div className="stu-sb-who">
          <div className="stu-sb-name">{name}</div>
          <div className="stu-sb-role">資管三 · Lv.5</div>
        </div>
      </div>
      <nav className="stu-sb-nav">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`stu-sb-link${screen === id ? ' stu-sb-link-active' : ''}`}
            onClick={() => onGoto(id)}
          >
            <span className="stu-ic"><Icon /></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button type="button" className="stu-sb-logout">
        <span className="stu-ic"><IconLogout /></span>
        <span>登出</span>
      </button>
    </aside>
  );
}
