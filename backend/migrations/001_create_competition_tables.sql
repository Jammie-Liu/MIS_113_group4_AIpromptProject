-- ============================================================================
-- 001_create_competition_tables.sql
-- 競賽模組的 9 張表（依 ERD：Professor、Competition、Issue、Question、Basic_Ans、
-- Student、Message、4D_score、Stu_Ans）
--
-- 命名：PostgreSQL 會把沒加引號的名字轉成小寫，而且名字不能用數字開頭，所以
--   - 表名、欄位名一律小寫（Stu_Ans → stu_ans、Q_id → q_id）
--   - 4D_score → score_4d，4DScore_id → score_4d_id
--
-- 型態對照（ERD → PostgreSQL）：
--   int PK   → INT GENERATED ALWAYS AS IDENTITY（自動編號 1、2、3…）
--   datetime → TIMESTAMPTZ（會記錄時區）
--   enum     → VARCHAR + CHECK（只接受列出的值）
-- ============================================================================


-- 1. Professor（老師）
CREATE TABLE professor (
  prof_id INT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name    VARCHAR(50) NOT NULL
);


-- 3. Issue（背景）
CREATE TABLE issue (
  issue_id INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic    VARCHAR(100) NOT NULL,                  -- 題目名稱
  content  TEXT         NOT NULL                   -- 背景說明
);


-- 2. Competition（一場競賽）
CREATE TABLE competition (
  com_id        INT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_id      INT        NOT NULL REFERENCES issue(issue_id),
  prof_id       INT        NOT NULL REFERENCES professor(prof_id),
  code          VARCHAR(6) NOT NULL UNIQUE,                            -- 賽場代碼
  grp_num       INT        NOT NULL CHECK (grp_num >= 1),              -- 組別數
  stu_num       INT        NOT NULL CHECK (stu_num >= 1),              -- 老師輸入的應到人數
  time          INT        NOT NULL CHECK (time >= 1),                 -- 每個階段的時限（分鐘）
  current_stage INT        NOT NULL DEFAULT 0
                           CHECK (current_stage IN (0, 1, 2))          -- 0＝還沒開始、1＝原因、2＝解方
);


-- 4. Question（問題／階段）
CREATE TABLE question (
  q_id        INT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_id    INT         NOT NULL REFERENCES issue(issue_id),
  description TEXT        NOT NULL,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('原因', '解方')),
  UNIQUE (issue_id, type)                          -- 一個背景的原因、解方各一題
);


-- 5. Basic_Ans（基本答案板的一格）
CREATE TABLE basic_ans (
  basic_ans_id INT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  q_id         INT  NOT NULL REFERENCES question(q_id),
  content      TEXT NOT NULL
);


-- 6. Student（參加競賽的學生，不用登入）
CREATE TABLE student (
  stu_id   INT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name     VARCHAR(50) NOT NULL,
  com_id   INT         NOT NULL REFERENCES competition(com_id),
  group_id INT         NOT NULL CHECK (group_id >= 1)    -- 不能超過 grp_num：資料庫擋不住，後端檢查
);


-- 7. Message（對話紀錄）
CREATE TABLE message (
  mess_id INT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stu_id  INT         NOT NULL REFERENCES student(stu_id),
  q_id    INT         NOT NULL REFERENCES question(q_id),
  role    VARCHAR(10) NOT NULL CHECK (role IN ('ai', 'student')),
  content TEXT        NOT NULL,
  time    TIMESTAMPTZ NOT NULL DEFAULT now()       -- 存入時間
);


-- 8. 4D_score（4D 分數：一次來回評一次，一個維度一筆）
CREATE TABLE score_4d (
  score_4d_id INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mess_id     INT          NOT NULL REFERENCES message(mess_id),     -- 被評分的那則學生訊息
  type        VARCHAR(2)   NOT NULL CHECK (type IN ('D1', 'D2', 'D3', 'D4')),
  score       DECIMAL(5,2) NOT NULL,
  suggestion  TEXT,                                                  -- 評語（可空）
  UNIQUE (mess_id, type)                           -- 同一則訊息每個維度只評一次
);


-- 9. Stu_Ans（學生送出的答案）
CREATE TABLE stu_ans (
  stu_ans_id   INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stu_id       INT          NOT NULL REFERENCES student(stu_id),
  q_id         INT          NOT NULL REFERENCES question(q_id),
  content      TEXT         NOT NULL,
  basic_ans_id INT          REFERENCES basic_ans(basic_ans_id),  -- 空的＝沒對到，進公開搶答區；
                                                                 -- 必須是同一個 q_id 的格子：後端檢查
  score        DECIMAL(5,2),                                     -- 評分完成前是空的
  time         TIMESTAMPTZ  NOT NULL DEFAULT now()               -- 送出時間（公開搶答先搶先贏）
);
