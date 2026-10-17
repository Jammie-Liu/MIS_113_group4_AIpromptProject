import { IconSettings } from '../icons.jsx';

export default function Topbar({ title, subtitle, name, onGotoProfile, onGotoSettings }) {
  return (
    <div className="stu-topbar">
      <div className="stu-crumb">{title}<span className="stu-crumb-sub">{subtitle}</span></div>
      <div className="stu-topbar-right">
        <button type="button" className="stu-topbar-profile" onClick={onGotoProfile} aria-label="前往個人資料">
          <div className="stu-topbar-avatar">{name.charAt(0)}</div>
          <div className="stu-topbar-profile-meta">
            <div className="stu-name">{name}</div>
            <div className="stu-role">資管三 · Lv.5</div>
          </div>
        </button>
        <button type="button" className="stu-topbar-settings-btn" onClick={onGotoSettings} aria-label="設定" title="設定">
          <IconSettings />
        </button>
      </div>
    </div>
  );
}
