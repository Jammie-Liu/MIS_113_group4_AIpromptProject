import { readFileSync, writeFileSync } from "node:fs";
import { generateBaseline } from "./baseline.js";

// 現在先用 issue.json 模擬資料庫的 issue 和 question；之後改成後端從資料庫讀
const file = process.argv[2] ?? "issue.json";
const { issue, questions } = JSON.parse(readFileSync(file, "utf8"));

const { prompt, rows } = await generateBaseline({ issue, questions });
console.log("丟給 AI 的問題：\n" + prompt + "\n");
console.table(rows);

// 模擬資料庫存進 basic_ans 後自動給的 basic_ans_id（真正的資料庫會自己產生）
const saved = rows.map((r, i) => ({ basic_ans_id: i + 1, ...r }));
const out = `basic_ans-issue${issue.issue_id}.json`;
writeFileSync(out, JSON.stringify(saved, null, 2), "utf8");
console.log("已存成", out);