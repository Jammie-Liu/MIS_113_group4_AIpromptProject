/*
  學生端的「畫面大小」：做法跟教師端 uiScale.js 完全一樣——用 CSS 的 zoom 套在 <html> 上，
  整頁（含彈窗）的文字、間距、圖示會一起等比放大，並設定 --ui-zoom 讓用 vh 算高度的地方
  （側邊欄高度）可以除掉縮放倍率，不然放大之後會比視窗還高。
  第一次使用（localStorage 裡還沒存過選擇）預設選「標準」；使用者如果自己改過，
  之後進來會照 localStorage 存的值還原成上次選的那個大小（見 getUiScaleId）。

  2026-10-28 決定：三個選項整體往上調一級——原本「標準」（1 倍）的比例現在變成「小」，
  原本「大」（1.15 倍）的比例現在變成「標準」，「大」則再放大一級（1.3 倍）。預設仍然是
  `standard` 這個 id，所以新訪客第一次進來看到的畫面大小，比例上就是以前「大」的樣子。
*/

const STORAGE_KEY = 'studentUiScale';
const DEFAULT_SCALE_ID = 'standard';

export const UI_SCALES = [
  { id: 'small', label: '小', value: 1, desc: '一般電腦螢幕的原始大小' },
  { id: 'standard', label: '標準', value: 1.15, desc: '預設，畫面整體放大一些比較好讀' },
  { id: 'large', label: '大', value: 1.3, desc: '畫面整體再放大，字體間距最寬鬆' },
];

export function getUiScaleId() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return UI_SCALES.some((s) => s.id === saved) ? saved : DEFAULT_SCALE_ID;
  } catch (e) {
    return DEFAULT_SCALE_ID;
  }
}

export function applyUiScale(id) {
  const scale = UI_SCALES.find((s) => s.id === id) ?? UI_SCALES.find((s) => s.id === DEFAULT_SCALE_ID);
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
