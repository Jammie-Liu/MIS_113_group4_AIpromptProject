import { pool, query } from '../db/pool.js'

/* stu_ans 表（學生送出的答案）、基本答案板、公開搶答區 */

export async function listBasicAnswers(qId) {
  const { rows } = await query(
    'SELECT basic_ans_id, content FROM basic_ans WHERE q_id = $1 ORDER BY basic_ans_id', [qId])
  return rows
}

// 某一組在某個階段已經亮的格子：每格只取最早答到的那一筆
export async function listRevealed(comId, groupId, qId) {
  const { rows } = await query(
    `SELECT DISTINCT ON (a.basic_ans_id) a.basic_ans_id, s.name
       FROM stu_ans a JOIN student s ON s.stu_id = a.stu_id
      WHERE s.com_id = $1 AND s.group_id = $2 AND a.q_id = $3 AND a.basic_ans_id IS NOT NULL
      ORDER BY a.basic_ans_id, a.time, a.stu_ans_id`,
    [comId, groupId, qId],
  )
  return rows
}

// 公開搶答區：搶答成功的（沒對到基本答案、分數 > 0），依送出時間
export async function listPublicAnswers(comId, qId, db = { query }) {
  const { rows } = await db.query(
    `SELECT a.stu_ans_id, a.content, a.score, a.time, s.group_id, s.name
       FROM stu_ans a JOIN student s ON s.stu_id = a.stu_id
      WHERE s.com_id = $1 AND a.q_id = $2 AND a.basic_ans_id IS NULL AND a.score > 0
      ORDER BY a.time, a.stu_ans_id`,
    [comId, qId],
  )
  return rows
}

/*
  送出答案：在同一個交易裡「讀目前狀態 → 判斷 → 寫入」。
  先用 pg_advisory_xact_lock 把「這場競賽的這個階段」鎖住，同時有人送出時會排隊，
  避免同組兩個人同時答到同一格都算分、或兩個人同時搶到同一則搶答。
  judge(state) 回傳要寫入的每一筆 { content, basicAnsId, score }。
*/
export async function submitAnswers({ comId, groupId, qId, stuId }, judge) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [comId, qId])
    const { rows: revealed } = await client.query(
      `SELECT DISTINCT a.basic_ans_id FROM stu_ans a JOIN student s ON s.stu_id = a.stu_id
        WHERE s.com_id = $1 AND s.group_id = $2 AND a.q_id = $3 AND a.basic_ans_id IS NOT NULL`,
      [comId, groupId, qId],
    )
    const publicAnswers = await listPublicAnswers(comId, qId, client)
    const decisions = judge({
      revealedIds: new Set(revealed.map((r) => r.basic_ans_id)),
      publicTexts: publicAnswers.map((p) => p.content),
    })
    for (const d of decisions) {
      await client.query(
        'INSERT INTO stu_ans (stu_id, q_id, content, basic_ans_id, score) VALUES ($1, $2, $3, $4, $5)',
        [stuId, qId, d.content, d.basicAnsId, d.score],
      )
    }
    await client.query('COMMIT')
    return decisions
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
