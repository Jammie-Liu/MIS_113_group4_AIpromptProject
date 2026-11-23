import { query } from '../db/pool.js'

/* competition 表（以及它的題目、問題、基本答案）的查詢 */

// 賽場代碼不分大小寫
export async function findCompetitionByCode(code) {
  const { rows } = await query(
    `SELECT com_id, code, status FROM competition WHERE upper(code) = upper($1)`,
    [code],
  )
  return rows[0] ?? null
}

// 賽場資訊：競賽＋題目背景＋兩個階段的答案板格數（不含答案內容）
export async function getCompetitionInfo(comId) {
  const { rows: [c] } = await query(
    `SELECT c.com_id, c.code, c.grp_num, c.time, c.current_stage, c.status,
            c.stage_ends_at, c.remaining_sec, i.topic, i.content, now() AS server_time
       FROM competition c JOIN issue i ON i.issue_id = c.issue_id
      WHERE c.com_id = $1`,
    [comId],
  )
  const { rows: stages } = await query(
    `SELECT q.type, count(b.basic_ans_id)::int AS board_size
       FROM competition c
       JOIN question q ON q.issue_id = c.issue_id
       LEFT JOIN basic_ans b ON b.q_id = q.q_id
      WHERE c.com_id = $1
      GROUP BY q.q_id, q.type`,
    [comId],
  )
  return { ...c, stages }
}

// 階段 → 這場競賽對應的 question（1＝原因、2＝解方）
export const STAGE_TYPES = { 1: '原因', 2: '解方' }

export async function findQuestionId(comId, stage) {
  const { rows } = await query(
    `SELECT q.q_id FROM competition c JOIN question q ON q.issue_id = c.issue_id
      WHERE c.com_id = $1 AND q.type = $2`,
    [comId, STAGE_TYPES[stage]],
  )
  return rows[0]?.q_id ?? null
}
