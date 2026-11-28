import { INDICATORS, DIMENSIONS } from "./indicators4D.js";

const round = (x) => Math.round(x * 100) / 100;

// 個人一回合的 4D 分數（AI 只給 0/1/2，分數全部由這裡算）
// 回傳的 rows 就是要寫進 score_4d 的四列：{ type: "D1"～"D4", score, suggestion }
export function score4D(judgement) {
  const isFinal = judgement.isFinal !== false;
  const scoreOf = new Map(judgement.indicators.map((x) => [x.id, x.score]));

  const rows = DIMENSIONS.map(({ type, label }) => {
    // 暫定評分時，只在正式評分才評的指標（盡-4）不算進核心滿分
    const inDim = INDICATORS.filter((i) => i.dim === label && (isFinal || !i.finalOnly));
    const core = inDim.filter((i) => i.type === "核心");
    const adv = inDim.filter((i) => i.type === "進階");
    const coreGot = core.reduce((s, i) => s + (scoreOf.get(i.id) ?? 0), 0);
    const advGot = adv.reduce((s, i) => s + (scoreOf.get(i.id) ?? 0), 0);

    // 維度分數 = 核心得分 ÷ 核心滿分 × 25 + 進階得分，最高 25
    let score = Math.min(25, (coreGot / (core.length * 2)) * 25 + advGot);
    // 盡-1（資安隱私）觸發：盡責（D4）−5，最低 0；結果直接算進分數存進 score_4d
    if (label === "盡責" && judgement.privacy?.triggered) score = Math.max(0, score - 5);

    return { type, score: round(score), suggestion: judgement.suggestions?.[type] ?? "" };
  });

  const total = round(rows.reduce((s, r) => s + r.score, 0));
  const uncertain = judgement.indicators.filter((x) => x.uncertain).map((x) => x.id);
  return { isFinal, rows, total, uncertain };
}

// 小組分數：組員個人分數的平均（四個維度各自平均，總分也是平均）
// memberScores：每位組員 score4D 的結果，或從 score_4d 讀出來的 { rows: [{ type, score }] }
export function teamScore4D(memberScores) {
  const avg = (list) => round(list.reduce((s, x) => s + x, 0) / list.length);
  const scoreOf = (m, type) => Number(m.rows.find((r) => r.type === type)?.score ?? 0);
  const rows = DIMENSIONS.map(({ type }) => ({ type, score: avg(memberScores.map((m) => scoreOf(m, type))) }));
  const total = avg(memberScores.map((m) => DIMENSIONS.reduce((s, { type }) => s + scoreOf(m, type), 0)));
  return { rows, total };
}
