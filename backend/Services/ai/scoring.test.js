import { test } from "node:test";
import assert from "node:assert/strict";
import { createBoard, scoreAnswer } from "./scoring.js";

test("全新的面向給 1 分", () => {
  const board = createBoard();
  assert.equal(scoreAnswer(board, "A", { match: "new", label: "橋梁淨高過低" }).points, 1);
});

test("別組已經提過的面向給 0 分", () => {
  const board = createBoard();
  scoreAnswer(board, "A", { match: "new", label: "橋梁淨高過低" });
  assert.equal(scoreAnswer(board, "B", { match: "existing", facetId: "F1" }).points, 0);
});

test("基礎答案：每組第一次 0.5 分，之後 0 分", () => {
  const board = createBoard();
  assert.equal(scoreAnswer(board, "A", { match: "baseline", facetId: "B1" }).points, 0.5);
  assert.equal(scoreAnswer(board, "A", { match: "baseline", facetId: "B1" }).points, 0);
  assert.equal(scoreAnswer(board, "B", { match: "baseline", facetId: "B1" }).points, 0.5);
});