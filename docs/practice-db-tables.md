# 練習題資料表建議（給後端對照用）

- 狀態：2026-10-08，建議版，尚未和亭慧、芷琳確認
- 用途：對照目前「資料庫」試算表的「資料表草稿」，列出練習題這一塊需要的表與欄位。沿用原本的寫法（欄位、意義、型態、限制），最右欄標示與目前草稿的差異
- 設計依據：[practice-plan.md](practice-plan.md)（整體計畫書）與 [practice-frontend-handoff.md](practice-frontend-handoff.md)
- 同一份內容另有 Excel 版，方便直接複製貼上

## 名詞對照

- **回合**：一段完整對話（資料表 PracticeAttempt）。一題可以有很多回合；回合序號只給已結束的對話。
- **來回**：一問一答，使用者一則提示詞加 AI 一則回覆（資料表 PracticePromptLog 的一筆）。亭慧文件裡「8 回合內」的「回合」在這裡改稱「來回」。
- **完成**：任一回合提交的成果達到交付規格。可以靠模仿提示達成。
- **熟練度**：只取回合 1（第一個以提交或要提示結束的對話）的逐指標分數，鎖定後不再更動，只用在後台分析。

## 與目前草稿的差異摘要

| 表 | 動作 | 說明 |
|---|---|---|
| PracticeQuestion（#4） | 修改 | 移除 behavior_type；content 改名 scenario；新增成果類型、交付規格、觀察重點、參考答案、面向參考庫、版本、狀態、建立時間；材料與來回上限先建好但待確認 |
| PracticeAttempt（#5） | 修改 | 重新定義為「一段對話」；新增題目版本、狀態、回合序號；D1 到 D4 改成由指標分數算出的快取 |
| PracticePromptLog（#6） | 修改 | 重新定義為「一個來回」；新增 created_at 與 UNIQUE(attempt_id, seq) |
| Individual4DReport（#20） | 沿用 | 欄位不動。練習面的平均要用哪些對話算（建議只用回合 1），待和亭慧確認 |
| User | 注意 | role 目前只有 student、teacher。練習題出題者若要在系統內管理才需要新增 developer；MVP 用種子資料，created_by 可為 null |
| Indicator | 新增 | 指標主檔，約 22 筆固定資料，競賽與練習共用 |
| QuestionIndicator | 新增 | 每題的適用指標與分類 |
| QuestionHint | 新增 | 三級階梯提示 |
| HintUsage | 新增 | 提示在哪個來回之後出現 |
| PracticeSubmission | 新增 | 使用者提交的成果與完成檢查結果 |
| IndicatorScore | 新增 | 指標層級的 0／1／2、證據、理由、不確定標記，競賽與練習共用 |
| PracticeQuestionProgress | 新增 | 完成與熟練度來源分開存 |

## 資料表

### Indicator（指標主檔（競賽與練習共用，約 22 筆固定資料））— 新增

22 張 4D 判斷卡各一筆，內容來自評分文件。練習題與競賽都用它當外鍵，避免各自存一份指標編號。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | 指標編號（例：描-5、委-6＋7） | varchar | PK | 新增 |
| dimension | 所屬向度 | enum(委託,描述,辨識,盡責) | NOT NULL | 新增 |
| name | 指標名稱（例：釐清最終目標） | varchar | NOT NULL | 新增 |
| default_role | 預設分類（競賽用；練習題在 QuestionIndicator 逐題覆蓋） | enum(core,advanced,not_applicable,deduct_only) | NOT NULL | 新增 |

### PracticeQuestion（練習題）— 修改

每題要有完整的作答與評分資料。題目上不顯示任何指標或向度標籤。標【待確認】的欄位取決於和亭慧討論題型的結果，可以先建、先不填。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | 題目 ID | int | PK | 沿用 |
| title | 題目名稱 | varchar | NOT NULL | 沿用 |
| difficulty | 難度 | enum(簡單,中等,困難) | NOT NULL | 沿用 |
| behavior_type | 行為數（一個行為／多個行為） | enum | — | 移除（可由 QuestionIndicator 的筆數推算） |
| scenario | 情境：背景與要做的事（回合 1 開始時顯示） | text | NOT NULL | 改名（原 content） |
| deliverable_type | 成果類型，一句話（例：一封給教授的信） | varchar | NOT NULL | 新增 |
| delivery_spec | 交付規格：一組是非條件，全部達成才算「完成」（例：["是一封信","說明加簽的課程與原因","語氣禮貌"]） | json | NOT NULL | 新增 |
| observation_note | 觀察重點：這題在看什麼，不給答案（回合 1 結束後才顯示） | text | nullable | 新增 |
| reference_answer | 參考答案：一個完整的好提示，給評分 AI 校準（不顯示給使用者） | text | nullable | 新增 |
| facets | 面向參考庫：困難題才有，列出該涵蓋的面向（不顯示給使用者） | json | nullable | 新增 |
| materials | 【待確認】起始素材：例如現成的提示詞與它的產出、一段 AI 回答 | json | nullable | 新增 |
| max_exchanges | 【待確認】來回上限（null＝不限） | int | nullable | 新增 |
| prefill | 【待定，建議先不用】輸入框預填文字 | text | nullable | 新增 |
| version | 題目版本，改版時 +1（已鎖定的第一回合紀錄要綁當時的版本） | int | NOT NULL, default=1 | 新增 |
| status | 狀態 | enum(draft,published,retired) | NOT NULL, default=draft | 新增 |
| created_by | 出題者 | int | FK→User, nullable（MVP 種子資料可為 null） | 沿用 |
| created_at | 建立時間 | datetime | NOT NULL | 新增 |

### QuestionIndicator（題目的適用指標）— 新增

每題只評一部分指標。標為 not_applicable 的指標不評，避免「沒有證據就是 0 分」懲罰了沒有機會做的行為。簡單題 1 個核心指標，中等題數個，困難題全面。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| question_id | 題目 | int | FK→PracticeQuestion, NOT NULL | 新增 |
| indicator_id | 指標 | varchar | FK→Indicator, NOT NULL | 新增 |
| role | 這題中的分類 | enum(core,advanced,not_applicable) | NOT NULL | 新增 |
| （約束） |  |  | UNIQUE(question_id, indicator_id) |  |

### QuestionHint（階梯提示）— 新增

每題三級提示。使用者在回合 1 結束後主動點開，一次一級。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| question_id | 題目 | int | FK→PracticeQuestion, NOT NULL | 新增 |
| level | 級別：1＝提醒要考慮什麼；2＝帶空格的模板；3＝完整範例 | int | NOT NULL, 1 到 3 | 新增 |
| content | 提示內容 | text | NOT NULL | 新增 |
| （約束） |  |  | UNIQUE(question_id, level) |  |

### PracticeAttempt（一段對話（使用者說的「回合」就是一段完整對話））— 修改

一題可以有很多段對話。回合序號只給「已結束」的對話（提交或要提示）；放棄的對話不編號、不評分，只留紀錄。回合 1 可以一直重開，所以重開後仍是回合 1。同一學生同一題最多一筆 status=active，離開頁面不算結束，對話保留。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | ID | int | PK | 沿用 |
| student_id | 學生 | int | FK→User | 沿用 |
| question_id | 題目 | int | FK→PracticeQuestion | 沿用 |
| question_version | 作答時的題目版本 | int | NOT NULL | 新增 |
| status | 狀態：active＝進行中；submitted＝使用者提交；hint_ended＝因要提示而結束（對話被截斷）；abandoned＝按重開，或離開後判定放棄 | enum(active,submitted,hint_ended,abandoned) | NOT NULL | 新增 |
| round_no | 回合序號：已結束（submitted 或 hint_ended）的對話數 + 1；回合 1 就是熟練度的來源。進行中與放棄的對話為 null | int | nullable | 新增 |
| started_at | 開始時間 | datetime | — | 沿用 |
| finished_at | 結束時間（active 時為 null） | datetime | nullable | 沿用 |
| d1_score | D1 分數：由後端依指標分數與公式算出的快取，只有已評分的對話才有值 | decimal | nullable | 修改（語意變更） |
| d2_score | D2 分數（同上） | decimal | nullable | 修改（語意變更） |
| d3_score | D3 分數（同上） | decimal | nullable | 修改（語意變更） |
| d4_score | D4 分數（同上） | decimal | nullable | 修改（語意變更） |

### PracticePromptLog（每個來回（使用者一則提示詞加 AI 一則回覆））— 修改

評分證據用 seq 引用。結構和競賽的 IndividualPromptLog 幾乎相同，兩邊可以先各自保留，之後再考慮合併成一張共用的對話紀錄表。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | ID | int | PK | 沿用 |
| attempt_id | 所屬對話 | int | FK→PracticeAttempt, NOT NULL | 沿用 |
| seq | 第幾個來回（從 1 開始） | int | NOT NULL | 沿用 |
| content | 使用者的提示詞 | text | NOT NULL | 沿用 |
| ai_response | AI 回覆 | text | NOT NULL | 沿用 |
| created_at | 送出時間 | datetime | NOT NULL | 新增 |
| （約束） |  |  | UNIQUE(attempt_id, seq) | 新增 |

### HintUsage（提示使用紀錄）— 新增

回合 1 因要提示而結束時，提示會出現在新開的回合 2，所以這筆紀錄掛在新的那段對話上，shown_after_seq 為 0。之後的提示不另開回合，只記錄出現的時間點。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| attempt_id | 提示出現在哪一段對話 | int | FK→PracticeAttempt, NOT NULL | 新增 |
| hint_id | 哪一級提示 | int | FK→QuestionHint, NOT NULL | 新增 |
| shown_after_seq | 在第幾個來回之後出現（0＝一開始就出現） | int | NOT NULL | 新增 |
| shown_at | 出現時間 | datetime | NOT NULL | 新增 |
| （約束） |  |  | UNIQUE(attempt_id, hint_id) |  |

### PracticeSubmission（提交的成果）— 新增

一段對話最多提交一次。content 是使用者自己編輯後的版本，不是自動複製 AI 的回覆，因為盡-4 要看使用者提交前有沒有檢查、修改。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| attempt_id | 所屬對話 | int | FK→PracticeAttempt, UNIQUE, NOT NULL | 新增 |
| content | 使用者提交的成果文字 | text | NOT NULL | 新增 |
| submitted_at | 提交時間 | datetime | NOT NULL | 新增 |
| delivery_passed | 完成檢查結果（評分完成前為 null） | boolean | nullable | 新增 |
| delivery_detail | 每條交付規格是否達成與理由 | json | nullable | 新增 |

### IndicatorScore（指標分數（競賽與練習共用））— 新增

評分文件要求評分 AI 對每個指標輸出 0／1／2、證據、理由與不確定標記，老師覆核頁也要列出不確定標記，目前草稿只存 D1 到 D4，缺這一層。競賽用 submission_id，練習用 attempt_id，兩者恰好一個非空。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| attempt_id | 練習用：所屬對話 | int | FK→PracticeAttempt, nullable | 新增 |
| submission_id | 競賽用：所屬個人提交 | int | FK→IndividualSubmission, nullable | 新增 |
| indicator_id | 指標 | varchar | FK→Indicator, NOT NULL | 新增 |
| score | 0／1／2；null＝未觀察到（被截斷的回合，行為還來不及出現） | tinyint | nullable | 新增 |
| evidence_seqs | 證據：引用的來回序號陣列 | json | nullable | 新增 |
| reason | 判斷理由 | text | nullable | 新增 |
| uncertain | 評分 AI 標記「不確定」（競賽交老師覆核，練習模式覆核人待定） | boolean | NOT NULL, default=false | 新增 |
| created_at | 建立時間 | datetime | NOT NULL | 新增 |
| （約束） |  |  | CHECK(attempt_id 與 submission_id 恰好一個非空)；UNIQUE(attempt_id, indicator_id)；UNIQUE(submission_id, indicator_id) |  |

### PracticeQuestionProgress（題目進度）— 新增

把「完成」與「熟練度」分開存。熟練度比率、解鎖進度、放棄次數都用查詢算，不另存欄位：熟練度＝查 mastery_attempt_id 那段對話的 IndicatorScore；解鎖進度＝各難度已完成題數；放棄次數＝PracticeAttempt 中 status=abandoned 的筆數。

| 欄位 | 意義 | 型態 | 限制 | 與目前草稿的差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| student_id | 學生 | int | FK→User, NOT NULL | 新增 |
| question_id | 題目 | int | FK→PracticeQuestion, NOT NULL | 新增 |
| completed | 是否完成：任一回合提交的成果達到交付規格 | boolean | NOT NULL, default=false | 新增 |
| completed_at | 完成時間 | datetime | nullable | 新增 |
| mastery_attempt_id | 熟練度來源：round_no=1 的那段對話；從未結束過回合 1 則為 null；鎖定後不再更動 | int | FK→PracticeAttempt, nullable | 新增 |
| updated_at | 更新時間 | datetime | NOT NULL | 新增 |
| （約束） |  |  | UNIQUE(student_id, question_id) |  |

## 待確認

- 欄位 materials、max_exchanges、prefill 取決於和亭慧討論題型與提示標籤的結果，可以先建、先不填。
- json 欄位（交付規格、面向參考庫、素材、證據序號）需要確認選用的資料庫是否支援 json／jsonb。
- 「同一學生同一題最多一筆 active 對話」建議用資料庫的部分唯一索引，或在應用程式裡檢查。
- 競賽的 IndividualSubmission 也要補上指標分數時，用 IndicatorScore.submission_id 連回去，競賽那邊的 D1 到 D4 欄位同樣改成快取。
- 對話紀錄是否合併成一張共用表（PracticePromptLog 與 IndividualPromptLog）：建議先各自保留，之後再議。
- Individual4DReport 在練習面用哪些對話算平均（建議只用回合 1），待確認。

## 這份建議刻意沒有建的表

- 題目變體（抓錯型的「預埋錯誤版」與「對照版」）：若採用亭慧的抓錯型，再加 QuestionVariant 表
- 通過後的反思與通過說明：若採用，再加 PracticeReflection 表
- 解鎖題數 N：放設定檔，不另建表
- 熟練度比率、解鎖進度、放棄次數：用查詢算，太慢再加快取表
