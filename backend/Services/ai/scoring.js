// 算分規則（依亭慧訂的規則）：
// - 全新的面向：第一個提出的組 +1 分，之後別組再提出同一個面向 0 分
// - 已經有人提過的面向：0 分
// - 跟基礎答案一樣的面向：每一組第一次提出 +0.5 分，之後同一組再提 0 分
//
// 參數 judgement 是 AI 的判斷結果，格式：
//   { match: "baseline", facetId: "B3" }   跟基礎答案的第 B3 項一樣
//   { match: "existing", facetId: "F7" }   跟已經出現過的 F7 一樣
//   { match: "new",      label: "..." }    全新的面向

export function createBoard() {
  return {
    facets: [],              // 已經出現過的新面向：{ id, label, team }
    baselineUsed: new Set(), // 哪一組已經拿過哪一項基礎答案的分數，例如 "A:B3"
  };
}

export function scoreAnswer(board, team, judgement) {
  if (judgement.match === "baseline") {
    const key = `${team}:${judgement.facetId}`;
    if (board.baselineUsed.has(key)) return { points: 0, reason: "這組已經提過這項基礎答案" };
    board.baselineUsed.add(key);
    return { points: 0.5, reason: "基礎答案，這組第一次提出" };
  }

  if (judgement.match === "existing") {
    return { points: 0, reason: "這個面向已經有人提過" };
  }

  if (judgement.match === "new") {
    const id = `F${board.facets.length + 1}`;
    board.facets.push({ id, label: judgement.label, team });
    return { points: 1, reason: "全新的面向", facetId: id };
  }

  if (judgement.match === "none") {
    return { points: 0, reason: "不是這個階段要找的內容" };
  }
  throw new Error(`看不懂的判斷結果：${JSON.stringify(judgement)}`);
}

// 一次送出可能包含好幾個原因，逐一算分後加總
export function scoreSubmission(board, team, judgements) {
  const results = judgements.map((j) => ({ ...j, ...scoreAnswer(board, team, j) }));
  const total = results.reduce((sum, r) => sum + r.points, 0);
  return { total, results };
}