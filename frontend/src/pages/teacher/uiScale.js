/*
  教師端的「畫面大小」：這個系統會放在大投影幕上展示，所以整個教師端可以一次放大。
  用 CSS 的 zoom 套在 <html> 上，整頁（含彈窗）的文字、間距、圖示會一起等比放大，
  就像瀏覽器的頁面縮放，但是會記住選擇，也只在教師端生效（離開教師端會還原）。
  同時設定 --ui-zoom，讓用 vh 算高度的地方（整頁最小高度、彈窗最大高度）可以除掉縮放倍率，
  不然放大之後會比視窗還高。
*/

const STORAGE_KEY = 'teacherUiScale'

export const UI_SCALES = [
  { id: 'standard', label: '標準', value: 1, desc: '一般電腦螢幕' },
  { id: 'large', label: '大', value: 1.25, desc: '預設，適合教室螢幕' },
  { id: 'projector', label: '投影', value: 1.5, desc: '大投影幕、後排也看得清楚' },
]

export function getUiScaleId() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return UI_SCALES.some((s) => s.id === saved) ? saved : 'large'
  } catch (e) {
    return 'large'
  }
}

export function applyUiScale(id) {
  const scale = UI_SCALES.find((s) => s.id === id) ?? UI_SCALES[1]
  const root = document.documentElement
  root.style.zoom = scale.value === 1 ? '' : String(scale.value)
  root.style.setProperty('--ui-zoom', String(scale.value))
}

export function setUiScaleId(id) {
  try { window.localStorage.setItem(STORAGE_KEY, id) } catch (e) { /* ignore */ }
  applyUiScale(id)
}

export function resetUiScale() {
  const root = document.documentElement
  root.style.zoom = ''
  root.style.removeProperty('--ui-zoom')
}
