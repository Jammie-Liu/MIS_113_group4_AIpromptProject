import { callAI } from "./aiClient.js";

// 評分 AI 的指示
function graderSystem(stage) {
  return `你是課堂競賽的評分助手。學生正在找出題目的「${stage}」。
你會收到三樣東西：基礎答案清單、已經有人提出的面向清單，以及一位學生送出的答案。

請完成：
1. 把學生的答案拆成一個一個獨立的「${stage}」。同一個意思只算一次。
2. 每一項依序判斷：
   - 如果跟「基礎答案」某一項意思相同 → match 填 "baseline"，facetId 填那一項的編號（例如 B1）
   - 否則，如果跟「已經有人提出的面向」某一項意思相同 → match 填 "existing"，facetId 填編號（例如 F1）
   - 否則，如果是合理的「${stage}」但兩份清單都沒有 → match 填 "new"，label 填一句 20 字以內的簡短描述
   - 如果不是「${stage}」（離題、客套話、重複題目內容）→ match 填 "none"
3. 每一項都要附 quote（從學生答案中引用的原文）和 reason（一句話說明為什麼這樣判斷）。

判斷「意思相同」時，看的是是不是同一個原因，不是字面上一不一樣。
只回覆 JSON，格式：
{"items": [{"match": "baseline", "facetId": "B1", "quote": "...", "reason": "..."},
           {"match": "new", "label": "...", "quote": "...", "reason": "..."}]}`;
}

// 檢查 AI 的回答：編號不存在、格式不對的項目，一律當作不計分，避免平白給分
function normalize(items, baseline, board) {
  const baselineIds = new Set(baseline.facets.map((f) => f.id));
  const boardIds = new Set(board.facets.map((f) => f.id));
  const seen = new Set();

  return items.map((it) => {
    if (it.match === "baseline" && !baselineIds.has(it.facetId)) return { ...it, match: "none", reason: `AI 回傳的基礎答案編號 ${it.facetId} 不存在` };
    if (it.match === "existing" && !boardIds.has(it.facetId)) return { ...it, match: "none", reason: `AI 回傳的面向編號 ${it.facetId} 不存在` };
    if (it.match === "new" && !it.label) return { ...it, match: "none", reason: "AI 沒有提供新面向的名稱" };
    if (!["baseline", "existing", "new", "none"].includes(it.match)) return { ...it, match: "none", reason: "AI 回傳的判斷看不懂" };

    // 同一次送出裡，同一個編號只算一次
    if (it.facetId) {
      if (seen.has(it.facetId)) return { ...it, match: "none", reason: "同一次答案裡重複提到" };
      seen.add(it.facetId);
    }
    return it;
  });
}

// stage：階段；baseline：這個階段的基礎答案；board：全班目前的面向清單；answerText：學生送出的答案
export async function judgeAnswer({ stage, baseline, board, answerText, mock }) {
  const list = (facets) => facets.map((f) => `${f.id}：${f.label}`).join("\n") || "（目前沒有）";
  const content = `【基礎答案】\n${list(baseline.facets)}\n\n【已經有人提出的面向】\n${list(board.facets)}\n\n【學生送出的答案】\n${answerText}`;

  const raw = await callAI({ system: graderSystem(stage), messages: [{ role: "user", content }], mock });
  const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  return normalize(json.items ?? [], baseline, board);
}