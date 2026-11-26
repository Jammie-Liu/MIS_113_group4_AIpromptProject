import { callAI } from "./aiClient.js";

// 回答 AI 的指示（依 ai-roles.md：中立助手、不知道題目背景）
// 這段是你之後要反覆調整的內容
const SYSTEM = `你是一個中立的 AI 助手，回答使用者提出的問題。
請用繁體中文回答，內容清楚、有條理。
你不知道使用者正在參加什麼活動，只根據使用者提供的資訊回答。`;

// history：這位學生在這個階段之前的對話；userText：這次送出的內容
// 回傳更新後的完整對話，下一次再傳回來，AI 就會記得前面說過什麼
export async function askAnswerAI(history, userText) {
  const messages = [...history, { role: "user", content: userText }];
  const reply = await callAI({
    system: SYSTEM,
    messages,
    mock: `（假回覆）我收到你的第 ${Math.ceil(messages.length / 2)} 則訊息：「${userText}」`,
  });
  return [...messages, { role: "assistant", content: reply }];
}