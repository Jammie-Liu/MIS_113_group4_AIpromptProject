# 後端（backend）

Node.js 22 + Express，資料庫是 AWS Aurora PostgreSQL（`database-1`，雪梨 `ap-southeast-2`）。
資料夾規劃照 [docs/architecture.md](../docs/architecture.md)。

> ⚠️ 後端技術棧還沒有在 CLAUDE.md 定案，這是先做出來可以跑的骨架，請教學後端、競賽後端確認。

## 第一次跑起來

1. 用 Node 22 以上（`nvm use 22`；Node 18 跑不動）。
2. 安裝套件：
   ```bash
   cd backend
   npm install
   ```
3. 建立自己的 `.env`，把 `DB_HOST` 改成 database-1 的「寫入器端點」（AWS 主控台 → 資料庫 → database-1 → 連線與安全性）：
   ```bash
   cp .env.example .env
   ```
4. 登入 AWS（資料庫用 IAM 身分驗證，沒有固定密碼；登入大約幾小時後會過期，過期再登一次）：
   ```bash
   aws login
   ```
5. 啟動（改程式會自動重開）：
   ```bash
   npm run dev
   ```
6. 打開 http://localhost:3000/api/v1/health ，看到 `"ok": true` 就代表後端連上資料庫了。

## 資料表怎麼加：migration

資料表不用一次設計完，可以一張一張慢慢加：

1. 在 `migrations/` 新增 SQL 檔，檔名用三位數編號開頭，例如 `001_create_users.sql`。
2. 執行 `npm run migrate`，只會跑還沒跑過的檔案，並記錄在資料庫的 `schema_migrations` 表。
3. **跑過的檔案不要再改**；要改資料表就新增下一個編號，例如 `002_add_user_department.sql`。
4. 一個檔案中間出錯會整個退回，不會只建一半。

> 資料表／ERD 是共用的介面約定（CLAUDE.md），新增 migration 的 PR 要請相關的人 review。

## 資料夾

| 資料夾 | 放什麼 |
|---|---|
| `index.js` | 進入點，所有 API 掛在 `/api/v1` |
| `Routes/` | 網址對應到哪個 controller |
| `Controllers/` | 處理請求、回傳結果 |
| `Models/` | 資料表相關的查詢 |
| `Services/` | 呼叫外部 AI 的邏輯（見 docs/ai-roles.md） |
| `Middleware/` | 進到 controller 前的檢查（登入、身分） |
| `db/` | 資料庫連線池（`pool.js`）與 migration 執行程式（`migrate.js`） |
| `migrations/` | 資料表變更的 SQL 檔 |
| `certs/` | AWS 官方公開的 RDS 憑證，用來確認連到的是真的 AWS 資料庫（不是機密） |

## 常見錯誤

| 訊息 | 原因 |
|---|---|
| `缺少資料庫設定` | 沒有 `.env`，或少填欄位 |
| `Your session has expired` / `Could not load credentials` | AWS 登入過期，重新 `aws login` |
| `PAM authentication failed` | 你的 AWS 帳號沒有連這個資料庫的權限，請管理 AWS 的組員幫忙加 |
| health 回 `DB_UNAVAILABLE` | 看終端機裡後端印出的錯誤訊息 |
