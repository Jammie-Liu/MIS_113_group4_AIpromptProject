/*
  學生端的「畫面大小」：做法跟教師端 uiScale.js 完全一樣——用 CSS 的 zoom 套在 <html> 上，
  整頁（含彈窗）的文字、間距、圖示會一起等比放大，並設定 --ui-zoom 讓用 vh 算高度的地方
  （側邊欄高度）可以除掉縮放倍率，不然放大之後會比視窗還高。
  預設選「大」，不是「標準」——因為學生端原本的字體/間距偏小，一開始就放大一點比較好讀。
*/

const STORAGE_KEY = 'studentUiScale';

export const UI_SCALES = [
  { id: 'standard', label: '標準', value: 1, desc: '一般電腦螢幕' },
  { id: 'large', label: '大', value: 1.15, desc: '預設，畫面整體放大一些比較好讀' },
  { id: 'xlarge', label: '更大', value: 1.3, desc: '文字與間距再放大一點' },
];

export function getUiScaleId() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return UI_SCALES.some((s) => s.id === saved) ? saved : 'large';
  } catch (e) {
    return 'large';
  }
}

export function applyUiScale(id) {
  const scale = UI_SCALES.find((s) => s.id === id) ?? UI_SCALES[1];
  const root = document.documentElement;
  root.style.zoom = scale.value === 1 ? '' : String(scale.value);
  root.style.setProperty('--ui-zoom', String(scale.value));
}

export function setUiScaleId(id) {
  try { window.localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* ignore */ }
  applyUiScale(id);
}

export function resetUiScale() {
  const root = document.documentElement;
  root.style.zoom = '';
  root.style.removeProperty('--ui-zoom');
}
