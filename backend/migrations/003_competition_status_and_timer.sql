-- ============================================================================
-- 003_competition_status_and_timer.sql
-- Competition 加競賽狀態與倒數計時用的欄位
--
-- 倒數的做法：伺服器記「這個階段幾點結束」（stage_ends_at），每個人的畫面自己算
--   「結束時間 − 現在」，所以全班剩下的時間一樣，遲到的人剩得比較少。
--
-- 流程（老師端操作，學生端只讀）：
--   開始／開放下一階段：status = running，stage_ends_at = 現在 + time 分鐘
--   暫停：status = paused，remaining_sec = 還剩幾秒（stage_ends_at 先不用）
--   繼續（老師手動按）：status = running，stage_ends_at = 現在 + remaining_sec，remaining_sec 清空
--   結束：status = ended
-- current_stage 照舊：0＝還沒開始、1＝原因、2＝解方
-- ============================================================================

ALTER TABLE competition
  ADD COLUMN status        VARCHAR(10) NOT NULL DEFAULT 'waiting'
                           CHECK (status IN ('waiting', 'running', 'paused', 'ended')),
                                                   -- waiting＝等開始、running＝進行中、paused＝暫停、ended＝結束
  ADD COLUMN stage_ends_at TIMESTAMPTZ,            -- 這個階段幾點結束；還沒開始＝空
  ADD COLUMN remaining_sec INT CHECK (remaining_sec >= 0);  -- 暫停時還剩幾秒；沒暫停＝空
