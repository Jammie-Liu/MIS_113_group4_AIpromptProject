import { callAI } from "./aiClient.js";

// 回答 AI 的指示（依 ai-roles.md：中立助手、不知道題目背景）
// 這段是之後要反覆調整的內容
// 列點用「- 」開頭：後端存進 message.content 後，會把「- 」開頭的行拆成 points 給前端勾選
const SYSTEM = `你是一個中立的 AI 助手，回答使用者提出的問題。
請用繁體中文回答，內容清楚、有條理。
你不知道使用者正在參加什麼活動，只根據使用者提供的資訊回答。
回答的重點請用列點呈現：每個列點獨立一行，用「- 」開頭（減號加一個空格），一個列點只講一件事；
列點前可以有一句簡短的開場，列點裡不要再分子項目。`;

// 資料庫 message.role 用 student／ai；模型的格式是 user／assistant，呼叫前才轉換
export const toModelRole = (role) => (role === "ai" ? "assistant" : "user");

// history：這位學生在這個階段之前的對話 [{ role: "student" | "ai", content }]（跟 message 表一樣）
// content：這次送出的內容
// 回傳更新後的完整對話（一樣用 student／ai），最後一則是 AI 的回覆
export async function askAnswerAI(history, content) {
  const messages = [...history, { role: "student", content }];
  const reply = await callAI({
    system: SYSTEM,
    messages: messages.map((m) => ({ role: toModelRole(m.role), content: m.content })),
    mock: `（假回覆）我收到你的第 ${Math.ceil(messages.length / 2)} 則訊息，可以從這幾點思考：\n- （假）重點一\n- （假）重點二`,
  });
  return [...messages, { role: "ai", content: reply }];
}
