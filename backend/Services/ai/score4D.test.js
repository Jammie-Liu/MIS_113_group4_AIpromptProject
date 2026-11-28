import { test } from "node:test";
import assert from "node:assert/strict";
import { INDICATORS } from "./indicators4D.js";
import { score4D, teamScore4D } from "./score4D.js";

// 小工具：全部指標給同一個分數，再用 overrides 改特定指標
function make(all, overrides = {}, privacy = false, isFinal = true) {
  return {
    isFinal,
    indicators: INDICATORS.filter((i) => isFinal || !i.finalOnly)
      .map((i) => ({ id: i.id, score: overrides[i.id] ?? all, uncertain: false })),
    privacy: { triggered: privacy },
    suggestions: { D1: "委託的評語" },
  };
}
const dim = (r, type) => r.rows.find((x) => x.type === type).score;

test("全部 2 分：每個維度 25，總分 100；rows 是 D1～D4", () => {
  const r = score4D(make(2));
  assert.equal(r.total, 100);
  assert.deepEqual(r.rows.map((x) => x.type), ["D1", "D2", "D3", "D4"]);
  assert.equal(r.rows[0].suggestion, "委託的評語");
});

test("D2（描述）：核心一半＋進階加分 = 4/8×25 + 2 = 14.5", () => {
  const r = score4D(make(1, { "描-1＋3": 0, "描-4": 2, "描-7": 0 }));
  assert.equal(dim(r, "D2"), 14.5);
});

test("盡-1 觸發：D4（盡責）−5，最低 0", () => {
  assert.equal(dim(score4D(make(2, {}, true)), "D4"), 20);
  assert.equal(dim(score4D(make(0, {}, true)), "D4"), 0);
});

test("暫定評分：盡-4 不算，D4 只看盡-3", () => {
  const r = score4D(make(0, { "盡-3": 2 }, false, false));
  assert.equal(r.isFinal, false);
  assert.equal(dim(r, "D4"), 25);
});

test("小組取組員平均", () => {
  const t = teamScore4D([score4D(make(2)), score4D(make(0))]);
  assert.equal(t.total, 50);
  assert.equal(t.rows.find((x) => x.type === "D3").score, 12.5);
});
