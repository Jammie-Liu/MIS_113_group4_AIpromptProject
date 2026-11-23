-- ============================================================================
-- 002_issue_label_and_student_token.sql
-- 依 2026-11-23 ERD 修改：
--   - Professor 加登入用的 ID
--   - Issue 加改編來源、是否公開、出題老師
--   - 新增 Label（標籤）與 Issue_label（題目和標籤的多對多）
--   - Question 刪掉 description（題目文字固定是「原因」「解方」，前端依 type 顯示）
--   - Student 的組別可以先空著（加入後才選組），加通行碼 token
--
-- 不存「難度／學生平均分」：每次從作答紀錄算，避免忘記更新而出錯。
-- 注意：表裡如果已經有資料，加 NOT NULL 欄位會失敗，整個檔案會回復（不會只改一半）。
-- ============================================================================


-- 1. Professor：老師登入用的 ID（例：T001，3～20 個英文字母或數字，前端／後端檢查格式）
ALTER TABLE professor
  ADD COLUMN login_id VARCHAR(20) NOT NULL UNIQUE;


-- 3. Issue（背景／題庫）
ALTER TABLE issue
  ADD COLUMN source_issue_id INT     REFERENCES issue(issue_id),      -- 改編自哪一份；原創＝空
  ADD COLUMN publicity       BOOLEAN NOT NULL DEFAULT false,          -- true＝公開、false＝只有自己看得到
  ADD COLUMN prof_id         INT     NOT NULL REFERENCES professor(prof_id);  -- 出題（建立）的老師


-- 10. Label（標籤）
CREATE TABLE label (
  l_id        INT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  l_name      VARCHAR(20) NOT NULL UNIQUE,         -- 標籤名稱，不重複
  description TEXT                                 -- 說明（可空）
);


-- 11. Issue_label（哪個題目貼了哪些標籤：多對多）
CREATE TABLE issue_label (
  issue_id INT NOT NULL REFERENCES issue(issue_id),
  l_id     INT NOT NULL REFERENCES label(l_id),
  PRIMARY KEY (issue_id, l_id)                     -- 同一個標籤不會在同一題貼兩次
);


-- 4. Question：刪掉問題內容
ALTER TABLE question
  DROP COLUMN description;


-- 6. Student
ALTER TABLE student
  ALTER COLUMN group_id DROP NOT NULL,             -- 空的＝還沒選組（≥1 的檢查還在）
  ADD COLUMN token VARCHAR(64) NOT NULL UNIQUE;    -- 通行碼：加入時後端產生，之後每次請求比對
