import { test } from "node:test";
import assert from "node:assert/strict";
import { INDICATORS } from "./indicators4D.js";
import { score4D, teamScore4D } from "./score4D.js";

// 小工具：全部指標給同一個分數，再用 overrides 改特定指標
function make(all, overrides = {}, privacy = false) {
  return {
    indicators: INDICATORS.map((i) => ({ id: i.id, score: overrides[i.id] ?? all, uncertain: false })),
    privacy: { triggered: privacy },
  };
}

test("全部 2 分：每個維度 25，總分 100", () => {
  const r = score4D(make(2));
  assert.equal(r.total, 100);
  assert.equal(r.dimensions.描述.score, 25);
});

test("核心一半＋進階加分：描述 = 4/8×25 + 2 = 14.5", () => {
  const r = score4D(make(1, { "描-1＋3": 0, "描-4": 2, "描-7": 0 }));
  assert.equal(r.dimensions.描述.score, 14.5);
});

test("進階加分不會超過 25", () => {
  const r = score4D(make(2)); // 核心滿分 25 + 進階 6
  assert.equal(r.dimensions.描述.score, 25);
});

test("盡-1 觸發：盡責 −5，最低 0", () => {
  assert.equal(score4D(make(2, {}, true)).dimensions.盡責.score, 20);
  assert.equal(score4D(make(0, {}, true)).dimensions.盡責.score, 0);
});

test("小組取組員平均", () => {
  const t = teamScore4D([score4D(make(2)), score4D(make(0))]);
  assert.equal(t.total, 50);
});