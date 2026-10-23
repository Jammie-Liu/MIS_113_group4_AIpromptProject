-- ============================================================================
-- 001_create_case_bank.sql
-- 競賽面（題目）：題庫分類、題庫、題目↔分類、基準答案
-- 依據：試算表「資料庫」→ 分頁「競賽面（題目）」的 7、25、8、28 號表
--
-- 型態對照（試算表 → PostgreSQL）：
--   int PK   → INT GENERATED ALWAYS AS IDENTITY（自動編號 1、2、3…）
--   datetime → TIMESTAMPTZ（會記錄時區，時間一律用 UTC）
--   enum(…)  → TEXT + CHECK（以後要加選項，用新的 migration 改 CHECK 就好，比 PostgreSQL 的 ENUM 好改）
-- ============================================================================


-- 7. CaseBankCategory（題庫分類）
CREATE TABLE case_bank_category (
  id         INT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR     NOT NULL,
  color      VARCHAR     NOT NULL,                 -- 分類顏色（側邊欄、標籤），例如 '#3F97E0'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 8. CaseBank（議題題庫，老師填的內容）
CREATE TABLE case_bank (
  id           INT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         VARCHAR     NOT NULL,                                   -- 案例名稱
  difficulty   TEXT        NOT NULL CHECK (difficulty IN ('簡單', '中等', '困難')),
  background   TEXT        NOT NULL,                                   -- 情境背景（學生看得到）
  task         TEXT        NOT NULL,                                   -- 目標：要學生交出什麼（學生看得到）
  stakeholders TEXT[],                                                 -- 角色與立場（選填；只有評分 AI 與老師看得到）
  facets       TEXT[]      NOT NULL CHECK (cardinality(facets) > 0),   -- 解方檢查清單，至少要有一項
  visibility   TEXT        NOT NULL DEFAULT 'private'
                           CHECK (visibility IN ('system', 'public', 'private')),
  -- 出題老師。系統內建題目是 NULL。
  -- ⚠️ 還沒加 FK→User：users 表還沒建。建好 users 後，用新的 migration 補上：
  --    ALTER TABLE case_bank ADD FOREIGN KEY (owner_id) REFERENCES users(id);
  owner_id     INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()                      -- 後端修改題目時要一併更新
);


-- 25. CaseType（題目↔分類，多對多）
CREATE TABLE case_type (
  -- ON DELETE CASCADE：題目或分類被刪掉時，這裡對應的關聯一起刪掉，題目本身不受影響。
  -- 一題刪到一個分類都不剩，就算「未分類」。
  case_id     INT NOT NULL REFERENCES case_bank(id)          ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES case_bank_category(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, category_id)                          -- 同一題不能重複放進同一個分類
);

-- 依分類找題目（「這個分類底下有哪些題」）時會比較快。
CREATE INDEX case_type_category_idx ON case_type (category_id);


-- 28. CaseBaseline（基準答案，系統自動產生，老師不用填）
CREATE TABLE case_baseline (
  id           INT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  case_id      INT         NOT NULL REFERENCES case_bank(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL CHECK (status IN ('generating', 'ready', 'failed')),
  result       JSONB,                                    -- 3 次回答與各面向涵蓋程度（ready 才有）
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 找「某一題最新的基準答案」時會比較快。
CREATE INDEX case_baseline_case_idx ON case_baseline (case_id, generated_at DESC);
