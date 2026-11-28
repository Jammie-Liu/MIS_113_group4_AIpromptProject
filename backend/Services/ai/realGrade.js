import { readFileSync } from "node:fs";
import { judgeAnswers } from "./grader.js";
import { scoreAnswers } from "./scoring.js";

// 用真的模型評分（AI_MODE=nova 或 bedrock）。先跑 makeBaseline.js 產生 basic_ans-issue1.json
// 資料格式照資料庫：basic_ans、stu_ans、student.group_id
const basicAnswers = JSON.parse(readFileSync("basic_ans-issue1.json", "utf8"))
  .filter((r) => r.q_id === 1) // q_id 1 = 原因
  .map(({ basic_ans_id, content }) => ({ basic_ans_id, content }));
console.log("原因的基本答案：");
console.table(basicAnswers);

const publicAnswers = [];
const revealedByGroup = { 1: [], 2: [] };
let nextStuAnsId = 101;

// 模擬三次送出：第 1 組、第 2 組、第 1 組
const submissions = [
  { group_id: 1, contents: ["導航沒有區分車種，把卡車導進來", "橋下淨高太低"] },
  { group_id: 2, contents: ["GPS 導航不分大小車", "租卡車的人多半是搬家的學生，不熟悉當地"] },
  { group_id: 1, contents: ["導航會把卡車帶進去", "今天天氣很好"] },
];

for (const s of submissions) {
  const judgements = await judgeAnswers({ stage: "原因", contents: s.contents, basicAnswers, publicAnswers });
  const { rows, total } = scoreAnswers(judgements, revealedByGroup[s.group_id]);

  console.log(`\n=== 第 ${s.group_id} 組`);
  console.table(rows.map((r) => ({ content: r.content, result: r.result, basic_ans_id: r.basic_ans_id, score: r.score, reason: r.reason })));
  console.log("這次得分：", total);

  for (const r of rows) {
    const stu_ans_id = nextStuAnsId++;
    if (r.basic_ans_id) revealedByGroup[s.group_id].push(r.basic_ans_id);
    if (r.result === "public") publicAnswers.push({ stu_ans_id, content: r.content });
  }
}

console.log("\n全班搶答成功的答案數：", publicAnswers.length);
if (publicAnswers.length > 0) console.table(publicAnswers);
for (const [group_id, ids] of Object.entries(revealedByGroup)) {
  console.log(`第 ${group_id} 組亮的基本答案：`, ids.length ? ids.join("、") : 0);
}
