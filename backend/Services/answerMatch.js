/*
  判斷答案「像不像」。⚠️ 目前是暫時的做法，跟學生端 demo（frontend/src/pages/student/data.js）一樣：
  把標點、空白拿掉後，算兩段文字共同字元的比例。不是真的語意判斷，之後換成 AI。
  分數也先照 demo：基本答案 2 分、搶答 1～3 分、重複 0 分（等評分規格定案再改）。
*/

export const BASIC_MATCH_THRESHOLD = 0.5
export const PUBLIC_DUPLICATE_THRESHOLD = 0.65
export const BASIC_SCORE = 2

function normalize(text) {
  return text.replace(/[\s，。、！？「」『』（）()[\]{}：:；;,.!?~]/g, '').toLowerCase()
}

export function similarity(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.85
  const setA = new Set(na)
  const setB = new Set(nb)
  let overlap = 0
  setA.forEach((ch) => { if (setB.has(ch)) overlap++ })
  return overlap / Math.max(setA.size, setB.size)
}

// 跟「還沒亮的」基本答案比，回傳最像的那一格（不夠像回 null）
export function bestBasicMatch(text, basicAnswers, revealedIds) {
  let best = null
  for (const b of basicAnswers) {
    if (revealedIds.has(b.basic_ans_id)) continue
    const sim = similarity(text, b.content)
    if (sim >= BASIC_MATCH_THRESHOLD && (!best || sim > best.sim)) best = { ...b, sim }
  }
  return best
}

export function isDuplicate(text, publicTexts) {
  return publicTexts.some((t) => similarity(text, t) >= PUBLIC_DUPLICATE_THRESHOLD)
}

// 搶答分數：越接近基本答案分數越高
export function publicScore(text, basicAnswers) {
  const max = Math.max(0, ...basicAnswers.map((b) => similarity(text, b.content)))
  if (max >= 0.45) return 3
  if (max >= 0.25) return 2
  return 1
}
