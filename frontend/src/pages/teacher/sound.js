/*
  教師端的音效／震動回饋小工具。預設提示音用 Web Audio API 即時合成，不需要音檔；
  鴨叫聲、放屁聲、打嗝聲則用 assets/sounds 裡的真實音檔。開關狀態存在 localStorage，
  重新整理後還記得使用者的選擇。
*/

import fartLongUrl from './assets/sounds/fart-long.mp3'
import fartShortUrl from './assets/sounds/fart-short.mp3'
import burpUrl from './assets/sounds/burp.mp3'
import duckUrl from './assets/sounds/duck.mp3'

const STORAGE_KEY = 'teacherSoundEnabled'

let enabled = (() => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === null ? true : saved === '1'
  } catch (e) {
    return true
  }
})()

const listeners = new Set()

export function isSoundEnabled() {
  return enabled
}

export function setSoundEnabled(value) {
  enabled = value
  try { window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0') } catch (e) { /* ignore */ }
  listeners.forEach((fn) => fn(enabled))
}

export function onSoundEnabledChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

let audioCtx = null
function getCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function tone(freq, duration, type = 'sine', peak = 0.08, delay = 0) {
  if (!enabled) return
  try {
    const ctx = getCtx()
    const start = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(peak, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0008, start + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  } catch (e) {
    /* Web Audio unavailable or blocked — fail silently, sound is a nice-to-have */
  }
}

function vibrate(pattern) {
  try { navigator.vibrate && navigator.vibrate(pattern) } catch (e) { /* unsupported */ }
}

/*
  鴨叫聲、放屁聲、打嗝聲：用真實音檔（assets/sounds）。duck 約 3 秒，但聲音只在 0.15～0.5 秒之間，其餘是空白，所以播放時從 0.15 秒開始、只取 0.4 秒。fart-short 約 0.4 秒，fart-long 約 4 秒（太長，
  只取前面一段並淡出）；burp 約 0.9 秒，但聲音只在 0.1～0.4 秒之間，其餘是空白，所以播放時從 0.08 秒開始、只取 0.3 秒。用 Web Audio 解碼後存在記憶體，播放時可以調整速度（音高）、音量與裁切。
  音檔第一次需要時才下載／解碼；切到放屁風格或第一次點擊畫面時會先預載，避免第一聲來不及播。
*/
const SAMPLE_URLS = { long: fartLongUrl, short: fartShortUrl, burp: burpUrl, duck: duckUrl }
const sampleBuffers = {}
let samplesLoading = null

function loadSamples() {
  if (samplesLoading) return samplesLoading
  try {
    const ctx = getCtx()
    samplesLoading = Promise.all(Object.entries(SAMPLE_URLS).map(async ([name, url]) => {
      const response = await fetch(url)
      sampleBuffers[name] = await ctx.decodeAudioData(await response.arrayBuffer())
    })).catch(() => { samplesLoading = null })
  } catch (e) {
    samplesLoading = null
  }
  return samplesLoading
}

// rate：播放速度（也會改變音高）；offset／duration：只播音檔的某一段；gain：音量
function sample(name, delay = 0, { rate = 1, gain = 0.6, offset = 0, duration, fade = 0.25 } = {}) {
  if (!enabled) return
  const buffer = sampleBuffers[name]
  if (!buffer) { loadSamples(); return }
  try {
    const ctx = getCtx()
    const start = ctx.currentTime + delay
    const length = Math.min(duration ?? buffer.duration - offset, buffer.duration - offset) / rate
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.setValueAtTime(rate, start)
    const volume = ctx.createGain()
    volume.gain.setValueAtTime(gain, start)
    if (duration !== undefined) {
      volume.gain.setValueAtTime(gain, start + Math.max(0, length - fade))
      volume.gain.linearRampToValueAtTime(0.0001, start + length)
    }
    source.connect(volume).connect(ctx.destination)
    source.start(start, offset, duration)
  } catch (e) {
    /* 沒有 Web Audio 就安靜不出聲 */
  }
}

// 音效風格：同一組事件（點擊、成功、刪除、切換、解鎖）在不同風格下用不同的聲音
const THEMES = {
  classic: {
    click: () => tone(720, 0.05, 'square', 0.035),
    success: () => { tone(660, 0.08, 'sine', 0.07); tone(990, 0.12, 'sine', 0.07, 0.07); vibrate(15) },
    remove: () => { tone(260, 0.16, 'sawtooth', 0.05); vibrate(25) },
    toggle: () => tone(500, 0.06, 'triangle', 0.05),
    unlock: () => { tone(520, 0.09, 'triangle', 0.08); tone(780, 0.09, 'triangle', 0.08, 0.09); tone(1040, 0.16, 'triangle', 0.09, 0.18); vibrate([20, 40, 20]) },
  },
  duck: {
    click: () => sample('duck', 0, { rate: 1.1 + Math.random() * 0.25, gain: 0.5, offset: 0.15, duration: 0.32, fade: 0.08 }),
    success: () => { sample('duck', 0, { rate: 1, gain: 0.7, offset: 0.15, duration: 0.4, fade: 0.1 }); sample('duck', 0.42, { rate: 1.18, gain: 0.7, offset: 0.15, duration: 0.4, fade: 0.1 }); vibrate(15) },
    remove: () => { sample('duck', 0, { rate: 0.65, gain: 0.85, offset: 0.15, duration: 0.4, fade: 0.15 }); vibrate(25) },
    toggle: () => sample('duck', 0, { rate: 1.4, gain: 0.5, offset: 0.15, duration: 0.32, fade: 0.08 }),
    unlock: () => { [[0, 0.95], [0.42, 1.1], [0.84, 1.3]].forEach(([delay, rate]) => sample('duck', delay, { rate, gain: 0.75, offset: 0.15, duration: 0.4, fade: 0.1 })); vibrate([20, 40, 20]) },
  },
  burp: {
    click: () => sample('burp', 0, { rate: 1.05 + Math.random() * 0.25, gain: 0.55, offset: 0.08, duration: 0.3, fade: 0.1 }),
    success: () => { sample('burp', 0, { rate: 1.25, gain: 0.7, offset: 0.08, duration: 0.32, fade: 0.1 }); sample('burp', 0.34, { rate: 0.95, gain: 0.7, offset: 0.08, duration: 0.32, fade: 0.1 }); vibrate(15) },
    remove: () => { sample('burp', 0, { rate: 0.6, gain: 0.85, offset: 0.08, duration: 0.5, fade: 0.2 }); vibrate(25) },
    toggle: () => sample('burp', 0, { rate: 1.5, gain: 0.55, offset: 0.08, duration: 0.3, fade: 0.1 }),
    unlock: () => { [[0, 1.0], [0.34, 1.2], [0.68, 0.65]].forEach(([delay, rate]) => sample('burp', delay, { rate, gain: 0.8, offset: 0.08, duration: 0.4, fade: 0.15 })); vibrate([20, 40, 20]) },
  },
  fart: {
    click: () => sample('short', 0, { rate: 0.95 + Math.random() * 0.2, gain: 0.55 }),
    success: () => { sample('short', 0, { rate: 1.05, gain: 0.7 }); sample('short', 0.22, { rate: 0.85, gain: 0.7 }); vibrate(15) },
    remove: () => { sample('long', 0, { gain: 0.45, duration: 1.6, fade: 0.5 }); vibrate(25) },
    toggle: () => sample('short', 0, { rate: 1.3, gain: 0.5 }),
    unlock: () => { sample('short', 0, { rate: 1.2, gain: 0.7 }); sample('short', 0.22, { rate: 1, gain: 0.7 }); sample('long', 0.5, { gain: 0.45, duration: 2.4, fade: 0.7 }); vibrate([20, 40, 20]) },
  },
}

export const SOUND_THEMES = [
  { id: 'classic', label: '預設提示音', desc: '簡短的電子提示音' },
  { id: 'duck', label: '鴨叫聲', desc: '真實的鴨叫音效，嘎！' },
  { id: 'fart', label: '放屁聲', desc: '真實的放屁音效，輕鬆一點的課堂氣氛' },
  { id: 'burp', label: '打嗝聲', desc: '真實的打嗝音效' },
]

// 用真實音檔的風格，需要先預載音檔
const SAMPLE_THEMES = ['duck', 'fart', 'burp']

const THEME_KEY = 'teacherSoundTheme'
let theme = (() => {
  try {
    const saved = window.localStorage.getItem(THEME_KEY)
    return saved && THEMES[saved] ? saved : 'classic'
  } catch (e) {
    return 'classic'
  }
})()

export function getSoundTheme() {
  return theme
}

export function setSoundTheme(next) {
  if (!THEMES[next]) return
  theme = next
  try { window.localStorage.setItem(THEME_KEY, next) } catch (e) { /* ignore */ }
  if (SAMPLE_THEMES.includes(next)) loadSamples()
}

// 上次選的是放屁風格時，使用者第一次點畫面就預載音檔（瀏覽器要有使用者操作才能開始音訊）
if (SAMPLE_THEMES.includes(theme) && typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => loadSamples(), { once: true })
}

// 設定頁選風格時試聽：播這個風格的「成功」音效（受總開關影響）
export async function previewSoundTheme(id) {
  cancelPendingClick()
  if (SAMPLE_THEMES.includes(id)) await loadSamples()
  THEMES[id]?.success()
}

/*
  點擊音是「延後一個 tick」才播：全站的點擊音在 capture 階段就排程了（比各按鈕自己的處理函式早），
  如果同一次點擊的處理函式接著播了「重要動作」的音效（成功、刪除、切換、解鎖），就把還沒播的點擊音取消，
  這樣建立、刪除、暫停這類動作只會聽到重要動作的聲音，不會再疊一聲點擊音。
*/
let clickTimer = null
function cancelPendingClick() {
  if (clickTimer !== null) {
    window.clearTimeout(clickTimer)
    clickTimer = null
  }
}

export function playClick() {
  cancelPendingClick()
  clickTimer = window.setTimeout(() => {
    clickTimer = null
    THEMES[theme].click()
  }, 0)
}
export function playSuccess() { cancelPendingClick(); THEMES[theme].success() }
export function playDelete() { cancelPendingClick(); THEMES[theme].remove() }
export function playToggle() { cancelPendingClick(); THEMES[theme].toggle() }
export function playUnlock() { cancelPendingClick(); THEMES[theme].unlock() }
