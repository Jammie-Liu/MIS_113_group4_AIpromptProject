// 算分規則（依亭慧訂的規則，見 docs/scoring-design.md）：
// - 跟基本答案一樣（basic）：這一組第一次答到 0.5 分；這一組已經亮過的格子 → duplicate，0 分
// - 全班沒有人提過的新內容（public）：搶答成功 1 分
// - 已經有人搶答過、或同一次送出裡重複（duplicate）：0 分
// - 離題、客套話（none）：0 分，也不進公開搶答區
//
// 回傳的每一項就是要寫進 stu_ans 的一列：{ content, basic_ans_id, score }，再加上 result 和 reason
// 欄位名稱照資料庫；result 照 docs/api-student.md 的 basic／public／duplicate，多一個 none

export const BASIC_SCORE = 0.5;
export const PUBLIC_SCORE = 1;

// judgements：grader.js judgeAnswers 的結果
// revealedIds：這一組在這個階段已經亮過的 basic_ans_id（後端從 stu_ans 讀）
export function scoreAnswers(judgements, revealedIds = []) {
  const revealed = new Set(revealedIds); // 同一次送出中前面亮的格子，後面也算「已經亮過」

  const rows = judgements.map((j) => {
    const base = { content: j.content, basic_ans_id: null, reason: j.reason };
    if (j.match === "basic") {
      if (revealed.has(j.basic_ans_id)) {
        return { ...base, result: "duplicate", score: 0, reason: "這組已經答到這一格基本答案" };
      }
      revealed.add(j.basic_ans_id);
      return { ...base, result: "basic", basic_ans_id: j.basic_ans_id, score: BASIC_SCORE };
    }
    if (j.match === "public") return { ...base, result: "public", score: PUBLIC_SCORE };
    if (j.match === "duplicate") return { ...base, result: "duplicate", score: 0 };
    return { ...base, result: "none", score: 0 };
  });

  const total = rows.reduce((sum, r) => sum + r.score, 0);
  return { rows, total };
}
