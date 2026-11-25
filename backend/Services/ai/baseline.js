import { callAI } from "./aiClient.js";
import { askAnswerAI } from "./answerAI.js";

const RUNS = 3; // 同一題問幾次，合併起來比較完整

// 把資料庫的題目組成「原封不動」丟給回答 AI 的問題（原因、解方一起問）
const LABEL = { 原因: "階段一（原因）", 解方: "階段二（解方）" };

export function buildPrompt(issue, questions) {
  const stages = ["原因", "解方"]
    .map((type) => questions.find((q) => q.type === type))
    .filter(Boolean)
    .map((q) => `${LABEL[q.type]}：${q.description}`)
    .join("\n");
  return `${issue.topic}\n${issue.content}\n\n${stages}`;
}

// 請 AI 把幾次的回答整理成「每個階段一份面向清單」
const EXTRACT_SYSTEM = `你會收到同一個問題的幾份回答，問題分成「原因」和「解方」兩個階段。
請把回答裡提到的重點，依階段整理成不重複的面向清單，每個面向用一句話寫出。
意思相同的合併成一項，不要自己新增回答裡沒有的內容。
只輸出 JSON，不要其他文字，格式：{"原因":["…","…"],"解方":["…","…"]}`;

// 主函式：輸入資料庫的 issue 和 question，回傳要存進 basic_ans 的資料列
export async function generateBaseline({ issue, questions, mock }) {
  const prompt = buildPrompt(issue, questions);

  const answers = [];
  for (let i = 0; i < RUNS; i++) {
    const history = await askAnswerAI([], prompt);
    answers.push(history.at(-1).content);
  }

  const text = await callAI({
    system: EXTRACT_SYSTEM,
    messages: [{ role: "user", content: answers.map((a, i) => `【回答 ${i + 1}】\n${a}`).join("\n\n") }],
    mock: mock ?? JSON.stringify({ 原因: ["（假）原因一", "（假）原因二"], 解方: ["（假）解方一"] }),
  });
  const json = text.match(/\{[\s\S]*\}/);
  if (!json) throw new Error("整理基礎答案時 AI 沒有回傳 JSON：" + text);
  const byType = JSON.parse(json[0]);

  // 一個面向 = basic_ans 的一列（一格答案板）
  const rows = questions.flatMap((q) =>
    (Array.isArray(byType[q.type]) ? byType[q.type] : [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .map((content) => ({ q_id: q.q_id, content }))
  );
  if (rows.length === 0) throw new Error("AI 沒有整理出任何面向：" + text);

  return { prompt, answers, rows };
}

// 從資料庫讀回 basic_ans 後，轉成評分 AI 要的格式
export function baselineFromRows(rows, q_id) {
  return {
    facets: rows
      .filter((r) => r.q_id === q_id)
      .map((r) => ({ id: `B${r.basic_ans_id}`, basicAnsId: r.basic_ans_id, label: r.content })),
  };
}