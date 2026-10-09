/*
  教師端的音效／震動回饋小工具。不依賴外部音檔，用 Web Audio API 即時合成
  簡短的提示音，避免要額外準備、載入音效素材。開關狀態存在 localStorage，
  重新整理後還記得使用者的選擇。
*/

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

export function playClick() {
  tone(720, 0.05, 'square', 0.035)
}

export function playSuccess() {
  tone(660, 0.08, 'sine', 0.07)
  tone(990, 0.12, 'sine', 0.07, 0.07)
  vibrate(15)
}

export function playDelete() {
  tone(260, 0.16, 'sawtooth', 0.05)
  vibrate(25)
}

export function playToggle() {
  tone(500, 0.06, 'triangle', 0.05)
}

export function playUnlock() {
  tone(520, 0.09, 'triangle', 0.08)
  tone(780, 0.09, 'triangle', 0.08, 0.09)
  tone(1040, 0.16, 'triangle', 0.09, 0.18)
  vibrate([20, 40, 20])
}
