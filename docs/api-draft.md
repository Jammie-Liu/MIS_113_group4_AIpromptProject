# 練習題模組 API 草稿（只列清單，先不串接）

- 狀態：2026-10-09，草稿。先列出需要哪些 API，格式（命名風格、是否同步/串流）之後再定
- 範圍：練習題模組（學生端）。對應 [practice-plan.md](practice-plan.md)、[practice-frontend-handoff.md](practice-frontend-handoff.md)
- 這份只列「需要什麼」，還沒有完整的 request/response JSON 範例

---

## 題目列表頁

| Method | Path | 用途 | 回應大概要有什麼 |
|---|---|---|---|
| GET | /questions | 列出題目（依難度分組），含解鎖進度 | 每題：id、名稱、難度、狀態（未開始/進行中/已完成/鎖定）；每個難度：已完成題數／所需題數 N |
| GET | /questions/:id | 單題詳情 | 名稱、難度、情境、成果類型；回合 1 結束前不含觀察重點，結束後才加進來 |

## 作答頁（回合）

| Method | Path | 用途 | 回應大概要有什麼 |
|---|---|---|---|
| GET | /questions/:id/attempt | 取得這題目前的回合（沒有進行中的就回「尚未開始」） | 回合序號、狀態（進行中/已結束/放棄）、結束方式、已展開的提示級別 |
| POST | /questions/:id/attempts | 開新回合（提交後再練、要提示後開新回合、重開都走這個） | 新回合的 id 與序號 |
| GET | /attempts/:id/messages | 取得這個回合的對話記錄 | 訊息列表：id、角色（使用者/AI）、內容、時間 |
| POST | /attempts/:id/messages | 送出一則提示，拿 AI 回覆 | 使用者這則＋AI 回覆這則 |
| POST | /attempts/:id/restart | 重開（放棄目前對話） | 新回合 id |
| POST | /attempts/:id/request-hint | 要提示（回合 1 會連帶觸發評分並結束回合；回合 2+ 只是展開下一級） | 這次展開的提示內容；回合 1 時還會回傳評分結果 |
| GET | /attempts/:id/hints | 取得已展開的提示內容 | 依級別列出已開的提示 |
| POST | /attempts/:id/submit | 提交成果，觸發評分 | 評分結果（見下） |

## 回合結果

| Method | Path | 用途 | 回應大概要有什麼 |
|---|---|---|---|
| GET | /attempts/:id/result | 取得這個回合的評分結果 | 完成檢查（達標／未達標，未達成的條件）；指標列表（名稱、0/1/2 或「未觀察到」、證據訊息 id、理由）；各維度評語；觀察重點 |

## 個人能力頁

| Method | Path | 用途 | 回應大概要有什麼 |
|---|---|---|---|
| GET | /me/ability | 4D 能力條、行為熟練度 | 四個維度分數；每個行為的熟練度（做到的比率） |
| GET | /me/practice-records | 練習紀錄列表 | 每題：名稱、難度、完成狀態、回合數；可展開看各回合的回饋 |

---

## 還沒決定、之後再定義

- 命名風格：camelCase 還是 snake_case
- 評分是同步等結果，還是先回「已收到」、前端用輪詢查狀態
- AI 回覆要不要做成串流（一個字一個字出現），還是等整段回完才回傳
- 每支的完整 request/response JSON 範例
- 錯誤狀態怎麼回（例如 AI 呼叫失敗、對話已結束還送訊息）
