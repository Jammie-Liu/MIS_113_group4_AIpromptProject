import { judgeAnswers } from "./grader.js";
import { scoreAnswers } from "./scoring.js";

// mock 模式示範算分規則。資料格式照資料庫：basic_ans、stu_ans、student.group_id
const basicAnswers = [
  { basic_ans_id: 1, content: "橋梁淨高過低" },
  { basic_ans_id: 2, content: "租車公司沒提醒車高限制" },
];
const publicAnswers = [];              // 全班搶答成功的 stu_ans（basic_ans_id 空的、score > 0）
const revealedByGroup = { 1: [], 2: [] }; // 每一組已經亮過的 basic_ans_id
let nextStuAnsId = 101;                // 模擬資料庫給的 stu_ans_id

// 模擬三次送出：哪一組、勾選了哪幾項、（假回覆）AI 會怎麼判斷
const submissions = [
  { group_id: 1, contents: ["橋太低", "導航沒有區分大車小車"],
    mock: { items: [{ index: 1, match: "basic", basic_ans_id: 1, reason: "跟基本答案 1 相同" },
                    { index: 2, match: "public", reason: "基本答案沒有" }] } },
  { group_id: 2, contents: ["導航 App 沒分車種", "橋的高度太低"],
    mock: { items: [{ index: 1, match: "duplicate", stu_ans_id: 102, reason: "第 1 組已經搶答過" },
                    { index: 2, match: "basic", basic_ans_id: 1, reason: "跟基本答案 1 相同" }] } },
  { group_id: 1, contents: ["橋真的太低了", "謝謝你的回答"],
    mock: { items: [{ index: 1, match: "basic", basic_ans_id: 1, reason: "跟基本答案 1 相同" },
                    { index: 2, match: "none", reason: "客套話" }] } },
];

for (const s of submissions) {
  const judgements = await judgeAnswers({
    stage: "原因", contents: s.contents, basicAnswers, publicAnswers, mock: JSON.stringify(s.mock),
  });
  const { rows, total } = scoreAnswers(judgements, revealedByGroup[s.group_id]);

  console.log(`\n第 ${s.group_id} 組送出 → 得 ${total} 分`);
  for (const r of rows) {
    const stu_ans_id = nextStuAnsId++;
    console.log(`  ・${r.content}：${r.result}，${r.score} 分（${r.reason}）`);
    // 模擬後端寫進 stu_ans 後，更新這組亮過的格子、全班搶答區
    if (r.basic_ans_id) revealedByGroup[s.group_id].push(r.basic_ans_id);
    if (r.result === "public") publicAnswers.push({ stu_ans_id, content: r.content });
  }
}

console.log("\n全班搶答成功的答案：", publicAnswers);
