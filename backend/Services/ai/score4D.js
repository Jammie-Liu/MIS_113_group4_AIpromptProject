import { INDICATORS, DIMENSIONS } from "./indicators4D.js";

const round = (x) => Math.round(x * 100) / 100;

// 個人一回合的 4D 分數（AI 只給 0/1/2，分數全部由這裡算）
export function score4D(judgement) {
  const scoreOf = new Map(judgement.indicators.map((x) => [x.id, x.score]));
  const dimensions = {};

  for (const dim of DIMENSIONS) {
    const core = INDICATORS.filter((i) => i.dim === dim && i.type === "核心");
    const adv = INDICATORS.filter((i) => i.dim === dim && i.type === "進階");
    const coreGot = core.reduce((s, i) => s + (scoreOf.get(i.id) ?? 0), 0);
    const coreMax = core.length * 2;
    const advGot = adv.reduce((s, i) => s + (scoreOf.get(i.id) ?? 0), 0);

    // 維度分數 = 核心得分 ÷ 核心滿分 × 25 + 進階得分，最高 25
    let score = Math.min(25, (coreGot / coreMax) * 25 + advGot);
    // 盡-1 觸發：盡責 −5，最低 0
    if (dim === "盡責" && judgement.privacy?.triggered) score = Math.max(0, score - 5);

    dimensions[dim] = { coreGot, coreMax, advGot, score: round(score) };
  }

  const total = round(DIMENSIONS.reduce((s, d) => s + dimensions[d].score, 0));
  const uncertain = judgement.indicators.filter((x) => x.uncertain).map((x) => x.id);
  return { dimensions, total, uncertain };
}

// 小組分數：組員個人分數的平均（總分和四個維度各自平均）
export function teamScore4D(memberScores) {
  const avg = (f) => round(memberScores.reduce((s, m) => s + f(m), 0) / memberScores.length);
  return {
    dimensions: Object.fromEntries(DIMENSIONS.map((d) => [d, avg((m) => m.dimensions[d].score)])),
    total: avg((m) => m.total),
  };
}