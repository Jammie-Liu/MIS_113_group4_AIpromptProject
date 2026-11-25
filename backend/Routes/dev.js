import { Router } from 'express'
import { query } from '../db/pool.js'
import { HttpError } from '../Middleware/httpError.js'
import { requireStudent } from '../Middleware/studentAuth.js'

/*
  ⚠️ 開發測試專用：教師端 API 還沒寫之前，讓學生端的「（Demo）老師開始競賽」等按鈕能真的改競賽狀態。
  - 帶學生的通行碼，改的是「這個學生所在的那場競賽」
  - NODE_ENV=production 時整組不掛上去（index.js），正式上線不會有
  - 之後教師端寫好開始／暫停／開放階段／結束的 API，就可以把這個檔案刪掉
  狀態怎麼變見 migrations/003 的註解。
*/
const router = Router()

const ACTIONS = {
  // 開始：開放階段一並開始倒數
  start: `UPDATE competition SET status = 'running', current_stage = 1,
            stage_ends_at = now() + make_interval(mins => time), remaining_sec = NULL
          WHERE com_id = $1 AND status = 'waiting'`,
  // 暫停：記下還剩幾秒
  pause: `UPDATE competition SET status = 'paused',
            remaining_sec = GREATEST(0, EXTRACT(EPOCH FROM stage_ends_at - now()))::int
          WHERE com_id = $1 AND status = 'running'`,
  // 繼續：用剩下的秒數重算結束時間
  resume: `UPDATE competition SET status = 'running',
             stage_ends_at = now() + make_interval(secs => remaining_sec), remaining_sec = NULL
           WHERE com_id = $1 AND status = 'paused'`,
  // 加時 2 分鐘
  extend: `UPDATE competition SET
             stage_ends_at = CASE WHEN status = 'running' THEN stage_ends_at + interval '2 minutes' ELSE stage_ends_at END,
             remaining_sec = CASE WHEN status = 'paused' THEN remaining_sec + 120 ELSE remaining_sec END
           WHERE com_id = $1 AND status IN ('running', 'paused')`,
  // 開放解方：換到階段二並重新計時
  'next-stage': `UPDATE competition SET status = 'running', current_stage = 2,
                   stage_ends_at = now() + make_interval(mins => time), remaining_sec = NULL
                 WHERE com_id = $1 AND current_stage = 1 AND status IN ('running', 'paused')`,
  // 結束
  end: `UPDATE competition SET status = 'ended' WHERE com_id = $1 AND status <> 'ended'`,
}

router.post('/dev/competition/:action', requireStudent, async (req, res) => {
  const sql = ACTIONS[req.params.action]
  if (!sql) throw new HttpError(404, 'NOT_FOUND', `沒有這個動作：${req.params.action}`)
  const { rowCount } = await query(sql, [req.student.com_id])
  if (rowCount === 0) throw new HttpError(409, 'INVALID_STATE', '現在的競賽狀態不能做這個動作')
  res.json({ ok: true })
})

export default router
