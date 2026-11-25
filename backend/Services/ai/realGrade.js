import { readFileSync } from "node:fs";
import { baselineFromRows } from "./baseline.js";
import { judgeAnswer } from "./grader.js";
import { createBoard, scoreSubmission } from "./scoring.js";

// 讀 makeBaseline.js 產生的基礎答案（模擬資料庫的 basic_ans），只取原因（q_id 1）
const rows = JSON.parse(readFileSync("basic_ans-issue1.json", "utf8"));
const baseline = baselineFromRows(rows, 1);
console.log("原因的基礎答案：");
console.table(baseline.facets);

const board = createBoard();

// 模擬三次送出：A 組、B 組、A 組
const submissions = [
  { team: "A", text: "1. 導航沒有區分車種，把卡車導進來 2. 橋下淨高太低" },
  { team: "B", text: "GPS 導航不分大小車；還有租卡車的人多半是搬家的學生，不熟悉當地" },
  { team: "A", text: "導航會把卡車帶進去；另外今天天氣很好" },
];

for (const s of submissions) {
  const judged = await judgeAnswer({ stage: "原因", baseline, board, answerText: s.text });
  const items = Array.isArray(judged) ? judged : judged.items;
  const result = scoreSubmission(board, s.team, items);

  console.log(`\n=== ${s.team} 組：${s.text}`);
  console.table(result.results.map((r) => ({
    match: r.match, facetId: r.facetId, label: r.label, points: r.points, reason: r.reason,
  })));
  console.log("這次得分：", result.total);
}

// 統計：新面向數、各組點亮的基礎答案數
console.log("\n全班提出的新面向數：", board.facets.length);
if (board.facets.length > 0) console.table(board.facets);

const lit = [...board.baselineUsed];
console.log("點亮的基礎答案數：", lit.length);
if (lit.length > 0) console.log("（組別:格子）", lit.join("、"));