# 資料庫：之後可能要改的地方

- 狀態：2026-11-23，備忘。現在**不做**，等需求確定再寫成 migration
- 資料表現在的樣子以 `backend/migrations/` 為準；這份只記「如果以後要 X，該怎麼改」

---

## 1. 原因、解方的時限不一樣

**現在**：`competition.time` 一個數字，兩個階段共用（例：都是 10 分鐘）。

**如果要分開**（例：原因 8 分鐘、解方 12 分鐘）：

- 改法：`competition` 把 `time` 換成兩個欄位
  - `cause_min INT NOT NULL CHECK (cause_min >= 1)`：原因階段幾分鐘
  - `solution_min INT NOT NULL CHECK (solution_min >= 1)`：解方階段幾分鐘
- migration 要做的事：加兩個欄位 → 把舊的 `time` 複製進兩個欄位 → 刪掉 `time`
- 要跟著改：發起競賽的 API（老師填兩個時間）、開放階段時用對應的時間算 `stage_ends_at`、
  學生端 `GET /student/competition` 的 `stageMinutes` 改成每個階段各自的分鐘數
- 為什麼不放在 `question`：`question` 是題庫的一部分，會被很多場競賽共用；時限是「這一場」的設定

## 2. 要查每個階段的計時紀錄（拆表）

**現在**：計時放在 `competition`（`current_stage`、`status`、`stage_ends_at`、`remaining_sec`）。
兩個階段輪流用同一組欄位，換到解方時就覆蓋掉，所以**事後查不到**原因階段幾點開始、幾點結束、暫停過幾次。

**如果之後要**（例：結果頁顯示每個階段實際花多久、老師看暫停紀錄、兩個階段可以同時開）：

- 改法：新增一張 `competition_stage`，一場競賽的每個階段各一筆

  | 欄位 | 意義 | 型態 | 限制 |
  |---|---|---|---|
  | `com_id` | 哪一場 | INT | FK → competition |
  | `q_id` | 哪一題（原因或解方） | INT | FK → question |
  | `minutes` | 這個階段的時限 | INT | NOT NULL，≥1（順便解決第 1 點） |
  | `status` | 這個階段的狀態 | VARCHAR(10) | waiting／running／paused／ended |
  | `started_at` | 第一次開始的時間 | TIMESTAMPTZ | 可以空 |
  | `ends_at` | 預計結束時間 | TIMESTAMPTZ | 可以空 |
  | `remaining_sec` | 暫停時還剩幾秒 | INT | 可以空，≥0 |
  | `ended_at` | 實際結束時間 | TIMESTAMPTZ | 可以空 |
  | （約束） | 一場的每一題只有一筆 | | PK (`com_id`, `q_id`) |

- 要連暫停幾次、各停多久都記，再加一張 `stage_pause`（`com_id`、`q_id`、`paused_at`、`resumed_at`），每暫停一次一筆
- 拆完以後，`competition` 的 `stage_ends_at`、`remaining_sec`（和 `time`）就可以刪掉；
  `current_stage` 可以留著當「現在顯示哪一階段」
- 要跟著改：老師端開始／暫停／繼續的 API 改寫到新表；學生端 `GET /student/competition` 回傳格式可以不變

---

## 3. 速度與部署（資料庫在雪梨 ap-southeast-2，不能改區域）

- **現在（在自己電腦開發）**：台灣到雪梨每查一次資料庫來回約 220 毫秒，一支 API 通常查 2 次，所以約半秒。能用，只是不快
- **部署時：後端伺服器一定要放在雪梨（ap-southeast-2）**，跟資料庫同一區。後端查資料庫只要幾毫秒，
  學生只會感受到「台灣 → 雪梨」來回一趟（約 0.1～0.2 秒）
- **資料庫會睡著**：最小容量設 0，一段時間沒人用會自動暫停，醒來要 15 秒以上。
  **上課比賽前**先打一次 API 把它叫醒（例如 `/api/v1/health`），或暫時把最小容量調高（例如 0.5）
- 之後真的需要再優化：把一支 API 裡的多次查詢合併成一次

## 4. 其他待討論（來自 `docs/system-flow.md` 八，2026-11-19 前端更新）

- **題庫改編的版本紀錄**：`issue.source_issue_id` 已經能記「改編自哪一份」；如果要「每次存檔記一筆版本」，
  要再加一張版本表（例：`issue_version`：`issue_id`、`topic`、`content`、`prof_id`、`saved_at`）
- **發起競賽的「回合數、每回合時間」**：文件還這樣寫，跟「固定兩個階段（原因、解方）」對不上，要跟教師端確認
- **教師端側邊欄的「課程管理」**：目前沒有課程的設計，資料庫也沒有課程的表，要跟教師端確認要不要拿掉
