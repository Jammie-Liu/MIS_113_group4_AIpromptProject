import { baselineFromRows } from "./baseline.js";
import { judgeAnswer } from "./grader.js";
import { createBoard, scoreSubmission } from "./scoring.js";

// 假的基礎答案（格式跟資料庫 basic_ans 一樣），只用 mock 模式示範算分規則
const baseline = baselineFromRows([
  { basic_ans_id: 1, q_id: 1, content: "橋梁淨高過低" },
  { basic_ans_id: 2, q_id: 1, content: "租車公司沒提醒車高限制" },
], 1);
const board = createBoard(); // 全班共用的面向清單，競賽開始時是空的

// 模擬的送出紀錄：哪一組、送出什麼、（假回覆）AI 會怎麼判斷
const submissions = [
  {
    team: "A",
    text: "原因可能是橋太低，而且導航沒有區分大車小車。",
    mock: { items: [
      { match: "baseline", facetId: "B1", quote: "橋太低", reason: "跟基礎答案 B1 相同" },
      { match: "new", label: "導航沒有區分車種", quote: "導航沒有區分大車小車", reason: "基礎答案沒有" },
    ] },
  },
  {
    team: "B",
    text: "我覺得是導航 App 沒分車種，另外橋的高度太低。",
    mock: { items: [
      { match: "existing", facetId: "F1", quote: "導航 App 沒分車種", reason: "A 組已經提過" },
      { match: "baseline", facetId: "B1", quote: "橋的高度太低", reason: "跟基礎答案 B1 相同" },
    ] },
  },
  {
    team: "A",
    text: "橋真的太低了，謝謝你的回答！",
    mock: { items: [
      { match: "baseline", facetId: "B1", quote: "橋真的太低了", reason: "跟基礎答案 B1 相同" },
      { match: "none", quote: "謝謝你的回答", reason: "客套話，不是原因" },
    ] },
  },
];

for (const s of submissions) {
  const judgements = await judgeAnswer({
    stage: "原因", baseline, board, answerText: s.text, mock: JSON.stringify(s.mock),
  });
  const { total, results } = scoreSubmission(board, s.team, judgements);

  console.log(`\n${s.team} 組送出：「${s.text}」→ 得 ${total} 分`);
  for (const r of results) console.log(`  ・${r.quote}：${r.points} 分（${r.reason}）`);
}

console.log("\n全班目前的新面向：", board.facets);