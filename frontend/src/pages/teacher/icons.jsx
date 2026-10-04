/*
  對應原本 教師端_最初版.js 裡的 `ICON` 物件（用字串拼 innerHTML 的一組共用小圖示）。
  這些圖示在好幾個畫面的動態列表（題庫卡片、隊伍卡片、彈跳視窗內容……）重複使用，
  所以獨立成元件放這裡；只出現一次的 icon 直接寫在各自畫面的 JSX 裡就好，不用搬過來。
*/

export function IconLock({ size = 12, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="10.5" width="14" height="9" rx="1.8" />
      <path d="M8 10.5V7.7a4 4 0 0 1 8 0v2.8" />
    </svg>
  )
}

export function IconGlobe({ size = 12, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.2 3.7 5.2 3.7 8.5s-1.3 6.3-3.7 8.5c-2.4-2.2-3.7-5.2-3.7-8.5S9.6 5.7 12 3.5z" />
    </svg>
  )
}

export function IconUser({ size = 13, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8.3" r="3.4" />
      <path d="M5 19.5c1-3.6 3.8-5.5 7-5.5s6 1.9 7 5.5" />
    </svg>
  )
}

export function IconCheck({ size = 12, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 12.3 10.3 15l6-6.5" />
    </svg>
  )
}

export function IconWarning({ size = 14, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5 2 20.5h20z" />
      <path d="M12 9.5v4.6" />
      <path d="M12 17v.05" />
    </svg>
  )
}

export function IconPause({ size = 14, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
      <rect x="5.5" y="4.5" width="4.3" height="15" rx="1" />
      <rect x="14.2" y="4.5" width="4.3" height="15" rx="1" />
    </svg>
  )
}

export function IconPlay({ size = 14, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
      <path d="M6.5 4.5v15l13-7.5z" />
    </svg>
  )
}

export function IconMenu({ size = 18, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  )
}

export function IconClose({ size = 18, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconExpand({ size = 12, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 5H5v4" />
      <path d="M15 19h4v-4" />
      <path d="M5 19l6-6" />
      <path d="M19 5l-6 6" />
    </svg>
  )
}

export function IconTrash({ size = 14, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.2a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7l1 12.3a1.8 1.8 0 0 0 1.8 1.7h5.4a1.8 1.8 0 0 0 1.8-1.7L17.5 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function IconCrown({ size = 14, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="#FFD166" stroke="#C98A2E" strokeWidth="1" strokeLinejoin="round" {...props}>
      <path d="M3.5 8.5 7 11l5-6.5 5 6.5 3.5-2.5-1.8 9.5H5.3z" />
    </svg>
  )
}

export function IconSparkStar({ size = 24, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11.5 4.5l2.35 4.75 5.25.78-3.8 3.7.9 5.22-4.7-2.48-4.7 2.48.9-5.22-3.8-3.7 5.25-.78z" />
      <path d="M20 2.5v3M18.5 4h3" />
      <path d="M4.5 3.5v2M3.5 4.5h2" />
    </svg>
  )
}

export function IconBulb({ size = 24, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 4a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9V16h5v-.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 4z" />
      <path d="M12 1v1M4 8H3M21 8h-1M5.6 2.6l.7.7M18.4 2.6l-.7.7" />
    </svg>
  )
}

export function IconTrophy({ size = 24, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 4h10v4.2a5 5 0 0 1-10 0z" />
      <path d="M7 5.2H4.3A2.8 2.8 0 0 0 7 9.5M17 5.2h2.7A2.8 2.8 0 0 1 17 9.5" />
      <path d="M12 13.2v3M9 20h6" />
      <path d="M10 16.2h4l.6 3.8H9.4z" />
      <path d="M10.2 7.2a2 2 0 0 0 1.3 1.3" />
    </svg>
  )
}

/* 題庫分類圖示：每個分類一個線條小圖示，放在一顆用分類色染淡底的圓角小方塊裡（CategoryBadge） */
const CATEGORY_ICON_PATHS = {
  '供應鏈與營運': (<><path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2z" /><path d="M4 7.2l8 4.3 8-4.3" /><path d="M12 11.5V21" /></>),
  '人力資源與勞動': (<><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7" /><circle cx="17" cy="9.5" r="2.4" /><path d="M15.5 14.6c2.4-.2 4.3 1.3 5 4.2" /></>),
  '行銷與定價': (<><path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0z" /><circle cx="8" cy="8" r="1.4" /></>),
  '財務與投資': (<><circle cx="12" cy="12" r="8.5" /><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.8 2.8 2-1.2 2-2.8 2c-1.3 0-2.4-.5-2.9-1.4" /><path d="M12 6.5v1.3M12 16.2v1.3" /></>),
  '科技與資安': (<><path d="M12 3l7.5 3v5.5c0 4.5-3.1 8-7.5 9.5-4.4-1.5-7.5-5-7.5-9.5V6z" /><path d="M8.8 12l2.3 2.3 4.2-4.6" /></>),
  '品牌與公關': (<><path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1z" /><path d="M18.5 9.5a4 4 0 0 1 0 5" /></>),
}

export function CategoryIcon({ name, size = 18, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {CATEGORY_ICON_PATHS[name] ?? <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.2h8a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19.2H5a1.5 1.5 0 0 1-1.5-1.5z" />}
    </svg>
  )
}

export function CategoryBadge({ name, tone, size = 34 }) {
  return (
    <span className="cat-badge" style={{ '--lv': tone, width: size, height: size }} aria-hidden="true">
      <CategoryIcon name={name} size={Math.round(size * 0.58)} />
    </span>
  )
}

export function IconEdit({ size = 14, ...props }) {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 19.5l1-4.2L16.6 4.2a1.8 1.8 0 0 1 2.5 0l.7.7a1.8 1.8 0 0 1 0 2.5L8.7 18.5z" />
      <path d="M14.5 6.3l3.2 3.2" />
    </svg>
  )
}
