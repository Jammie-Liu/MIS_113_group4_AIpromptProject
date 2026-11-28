import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreAnswers } from "./scoring.js";
import { normalize } from "./grader.js";

test("基本答案：這組第一次 0.5 分，回傳 basic_ans_id", () => {
  const { rows } = scoreAnswers([{ content: "橋太低", match: "basic", basic_ans_id: 12 }]);
  assert.deepEqual([rows[0].result, rows[0].score, rows[0].basic_ans_id], ["basic", 0.5, 12]);
});

test("這組已經亮過的格子：duplicate、0 分、basic_ans_id 空的", () => {
  const { rows } = scoreAnswers([{ content: "橋太低", match: "basic", basic_ans_id: 12 }], [12]);
  assert.deepEqual([rows[0].result, rows[0].score, rows[0].basic_ans_id], ["duplicate", 0, null]);
});

test("同一次送出兩項對到同一格：第二項 duplicate", () => {
  const { rows, total } = scoreAnswers([
    { content: "橋太低", match: "basic", basic_ans_id: 12 },
    { content: "橋的高度不夠", match: "basic", basic_ans_id: 12 },
  ]);
  assert.deepEqual(rows.map((r) => r.result), ["basic", "duplicate"]);
  assert.equal(total, 0.5);
});

test("新內容 public 1 分；重複、離題 0 分", () => {
  const { rows, total } = scoreAnswers([
    { content: "導航沒分車種", match: "public" },
    { content: "GPS 不分大小車", match: "duplicate", stu_ans_id: 305 },
    { content: "謝謝", match: "none" },
  ]);
  assert.deepEqual(rows.map((r) => [r.result, r.score]), [["public", 1], ["duplicate", 0], ["none", 0]]);
  assert.equal(total, 1);
});

test("normalize：不存在的編號、漏判的項目都改成 none", () => {
  const items = normalize(
    [
      { index: 1, match: "basic", basic_ans_id: 99 },
      { index: 2, match: "duplicate", stu_ans_id: 1 },
    ],
    { contents: ["a", "b", "c"], basicAnswers: [{ basic_ans_id: 12, content: "x" }], publicAnswers: [] }
  );
  assert.deepEqual(items.map((i) => i.match), ["none", "none", "none"]);
});
