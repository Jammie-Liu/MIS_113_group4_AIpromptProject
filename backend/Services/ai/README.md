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

欄位名稱一律照資料庫（`backend/migrations/`）。

| 函式 | 什麼時候呼叫 | 傳入 | 回傳 |
|---|---|---|---|
| `askAnswerAI(history, content)`（`answerAI.js`） | 學生每送出一則訊息 | 這位學生這個階段之前的 `message`：`[{ role: "student" \| "ai", content }]`、這則訊息 | 更新後的完整對話（一樣用 `student`／`ai`），最後一則是 AI 回覆；列點用「- 」開頭，可以直接存進 `message.content` |
| `generateBaseline({ issue, questions })`（`baseline.js`） | 老師新增題目後，一次 | `issue`（`topic`、`content`）、這個 issue 的 `question`（`q_id`、`type`），原因和解方一起問 | `{ prompt, answers, rows }`；`rows` 是要存進 `basic_ans` 的 `[{ q_id, content }]`，一個面向一列 |
| `judgeAnswers({ stage, contents, basicAnswers, publicAnswers })`（`grader.js`） | 學生送出答案 | `stage`＝`question.type`；`contents`＝這次勾選的幾項；`basicAnswers`＝這個階段的 `basic_ans`（`basic_ans_id`、`content`）；`publicAnswers`＝全班搶答成功的 `stu_ans`（`stu_ans_id`、`content`） | 每一項的判斷 `{ content, match: basic／public／duplicate／none, basic_ans_id, stu_ans_id, reason }` |
| `scoreAnswers(judgements, revealedIds)`（`scoring.js`） | 接在 `judgeAnswers` 後 | 判斷結果、這一組（`group_id`）在這個階段已經亮過的 `basic_ans_id` | `{ rows, total }`；`rows` 每一項就是一列 `stu_ans`：`{ content, basic_ans_id, score }`，加上 `result`、`reason`（不呼叫 AI） |
| `judge4D({ stage, messages, isFinal, answers })`（`fourD.js`） | 回合中每 2 分鐘（`isFinal: false`，只評有新訊息的學生）；回合結束（`isFinal: true`） | 這位學生這個階段到目前為止的 `message`；正式評分時加上他送出的 `stu_ans.content` 陣列（盡-4 用） | 每個指標的 0／1／2 與證據（只在程式裡用來算分，不存）、盡-1 檢查、每個維度的 `suggestion` |
| `score4D(judgement)`、`teamScore4D(scores)`（`score4D.js`） | 接在 `judge4D` 後 | `judge4D` 的結果；組員的個人分數 | `{ isFinal, rows, total }`；`rows` 就是 `score_4d` 的四列 `{ type: "D1"～"D4", score, suggestion }`；小組取組員平均（不呼叫 AI） |

**D1～D4 對應**（照老師端 `frontend/src/pages/teacher/data.js` 的 `DIM_4D`）：D1 委託、D2 描述、D3 辨識、D4 盡責。

計分規則見 [docs/scoring-design.md](../../../docs/scoring-design.md)：
- 評分：`basic` 這一組第一次答到 0.5 分（同一組已經亮過 → `duplicate` 0 分）；`public` 全班第一個提出 1 分；`duplicate` 已經有人搶答過 0 分；`none` 離題 0 分、不進公開搶答區。
- 4D：維度分數 ＝ 核心得分 ÷ 核心滿分 × 25 ＋ 進階得分（最高 25）；盡-1 觸發 D4 −5（最低 0），直接算進分數。暫定評分時盡-4 不評，D4 只看盡-3。

**AI 只負責判斷，分數一律由程式計算**；AI 回傳的編號不存在、分數不在 0～2、證據不是學生訊息等情況，由各檔案的 `normalize` 擋下並標記。

## 待跟後端確認（芷琳）

- `result` 多了 `none`（離題、客套話）：0 分、不進公開搶答區。`docs/api-student.md` 的 `summary` 可能要加 `noneCount`。
- 分數：基本答案 0.5、搶答 1（`answerMatch.js` 目前是 2 和 1～3）。
- `score_4d` 改成「學生＋階段＋評分時間」：建議欄位 `stu_id`、`q_id`、`type`（D1～D4）、`score`、`suggestion`、`is_final`（是不是回合結束的正式分數）、`time`（評分時間），拿掉 `mess_id`。回合中每 2 分鐘只評有新訊息的學生；排名只用 `is_final` 的分數。

## 怎麼跑

```bash
cd backend
npm install
cd Services/ai
node --test            # 自動測試（計分規則，10 個）
node tryGrade.js       # mock：示範評分規則（stu_ans 格式）
node try4D.js          # mock：示範暫定／正式 4D 計分（score_4d 格式）；AI_MODE=nova/bedrock 時會請真的模型評
node makeBaseline.js   # 用 issue.json（模擬資料庫）產生基礎答案 → basic_ans-issue1.json
node realGrade.js      # 讀 basic_ans-issue1.json，請真的模型評分（要 AI_MODE=nova 或 bedrock）
node chat.js           # 在終端機跟回答 AI 對話，輸入 Q 結束
```

PowerShell 切換模式：`$env:AI_MODE="nova"`、`$env:NOVA_MODEL="us.amazon.nova-2-lite-v1:0"`。

## 用 Nova 測試時發現（換 Claude 後要再確認）

- 基礎答案整理時沒有合併同義項目（原因 12 項、解方 17 項有明顯重複）→ 考慮在 prompt 限制數量。
- 4D：描-8 和辨-3 混淆；理由與分數不一致；`indicators` 回成物件、編號寫成簡稱（程式已處理）。
- 同一段對話兩次評分不同 → Nova 已設 `temperature: 0`。
