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
