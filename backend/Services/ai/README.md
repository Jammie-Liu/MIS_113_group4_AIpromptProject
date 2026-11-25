# AI 層（backend/Services/ai）

負責人：亭慧。回答 AI、基礎答案、評分 AI、4D 評分 AI 的呼叫與計分邏輯。

> ⚠️ 目前還**沒有**接到 Express 路由（`aiService.js` 仍是假回覆），也還沒存取資料庫。
> 這裡只提供函式，由後端（芷琳、筠靈）呼叫、負責讀寫資料庫。函式格式如果後端需要調整，請在 PR 留言討論。

## 切換模型：`AI_MODE`

所有 AI 呼叫都經過 `aiClient.js` 的 `callAI`，用環境變數切換，其他檔案不用改：

| `AI_MODE` | 用什麼 | 備註 |
|---|---|---|
| `mock`（預設） | 假資料 | 不花錢，開發、展示、自動測試用 |
| `nova` | Amazon Nova（`NOVA_MODEL`，建議 `us.amazon.nova-2-lite-v1:0`） | 過渡期用，消耗免費方案額度 |
| `bedrock` | Claude（Amazon Bedrock） | AWS 帳號升級成付費方案後才能用 |

- 權限用 `aws login` 的暫時身分，**沒有 API 金鑰**。過期就重新 `aws login`。
- 模型在 `us-east-1`（`BEDROCK_REGION` 可改），跟資料庫（雪梨）不同區沒關係。
- `DEBUG=1` 會印出 4D 評分 AI 的原始回覆。

## 函式格式（給後端呼叫）

| 函式 | 什麼時候呼叫 | 傳入 | 回傳 |
|---|---|---|---|
| `askAnswerAI(history, userText)`（`answerAI.js`） | 學生每送出一則訊息 | 這位學生這個階段之前的對話 `[{role, content}]`、這則訊息 | 更新後的完整對話（最後一則是 AI 回覆） |
| `generateBaseline({ issue, questions })`（`baseline.js`） | 老師新增題目後，一次 | `issue`（`topic`、`content`）、`questions`（`q_id`、`type`、`description`，原因和解方一起問） | `{ prompt, answers, rows }`；`rows` 是要存進 `basic_ans` 的 `[{ q_id, content }]`，一個面向一列 |
| `baselineFromRows(rows, q_id)`（`baseline.js`） | 評分前 | 從資料庫讀出的 `basic_ans` 列、這個階段的 `q_id` | 評分 AI 要的 `{ facets: [{ id: "B<basic_ans_id>", basicAnsId, label }] }` |
| `judgeAnswer({ stage, baseline, board, answerText })`（`grader.js`） | 學生送出答案 | 階段、基礎答案、全班已提出的面向、答案文字 | 每一項的判斷 `[{ match: baseline／existing／new／none, facetId, label, quote, reason }]` |
| `scoreSubmission(board, team, judgements)`（`scoring.js`） | 接在 `judgeAnswer` 後 | 全班面向板、組別、判斷結果 | `{ total, results }`（不呼叫 AI） |
| `judge4D({ stage, messages, finalAnswer })`（`fourD.js`） | 每回合結束後（背景執行） | 階段、這位學生這回合的整段對話、個人結果 | 每個指標的 0／1／2＋證據（第幾則）＋理由＋不確定標記、盡-1 檢查、四個維度的評語 |
| `score4D(judgement)`、`teamScore4D(scores)`（`score4D.js`） | 接在 `judge4D` 後 | `judge4D` 的結果；組員的個人分數 | 四個維度分數與總分；小組取組員平均（不呼叫 AI） |

計分規則見 [docs/scoring-design.md](../../../docs/scoring-design.md)：
- 評分：新面向 +1、已經有人提過 0、跟基礎答案一樣每組第一次 0.5 之後 0。
- 4D：維度分數 ＝ 核心得分 ÷ 核心滿分 × 25 ＋ 進階得分（最高 25）；盡-1 觸發盡責 −5（最低 0）。

**AI 只負責判斷，分數一律由程式計算**；AI 回傳的編號不存在、分數不在 0～2、證據不是學生訊息等情況，由各檔案的 `normalize` 擋下並標記。

## 待跟後端確認

- `docs/api-student.md` 目前的分數（基本答案 2 分、搶答 1～3 分）跟上面的評分規則不同。
- `score_4d` 表目前是「每則訊息」評一次，規格是「每回合」評一次。

## 怎麼跑

```bash
cd backend
npm install
cd Services/ai
node --test            # 自動測試（計分規則）
node tryGrade.js       # mock：示範評分規則
node try4D.js          # mock：示範 4D 計分；AI_MODE=nova/bedrock 時會請真的模型評
node makeBaseline.js   # 用 issue.json（模擬資料庫）產生基礎答案 → basic_ans-issue1.json
node realGrade.js      # 讀 basic_ans-issue1.json，請真的模型評分（要 AI_MODE=nova 或 bedrock）
node chat.js           # 在終端機跟回答 AI 對話，輸入 Q 結束
```

PowerShell 切換模式：`$env:AI_MODE="nova"`、`$env:NOVA_MODEL="us.amazon.nova-2-lite-v1:0"`。

## 用 Nova 測試時發現（換 Claude 後要再確認）

- 基礎答案整理時沒有合併同義項目（原因 12 項、解方 17 項有明顯重複）→ 考慮在 prompt 限制數量。
- 4D：描-8 和辨-3 混淆；理由與分數不一致；`indicators` 回成物件、編號寫成簡稱（程式已處理）。
- 同一段對話兩次評分不同 → Nova 已設 `temperature: 0`。
