import { pool, query } from '../db/pool.js'

/*
  message 表（跟 AI 的對話）。
  AI 回覆的「列點」怎麼存：message.content 是一段文字，列點各自一行、用「- 」開頭；
  讀出來時把這些行拆成 points 陣列給前端（docs/api-student.md 5.1）。
*/

export function toPoints(content) {
  return content.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim())
}

export async function listMessages(stuId, qId) {
  const { rows } = await query(
    `SELECT mess_id, role, content, time FROM message
      WHERE stu_id = $1 AND q_id = $2 ORDER BY time, mess_id`,
    [stuId, qId],
  )
  return rows
}

// 學生這則＋AI 這則一起存（要嘛兩則都存、要嘛都不存）
export async function insertExchange(stuId, qId, studentContent, aiContent) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const insert = (role, content) => client.query(
      `INSERT INTO message (stu_id, q_id, role, content) VALUES ($1, $2, $3, $4)
       RETURNING mess_id, role, content, time`,
      [stuId, qId, role, content],
    )
    const { rows: [studentMessage] } = await insert('student', studentContent)
    const { rows: [aiMessage] } = await insert('ai', aiContent)
    await client.query('COMMIT')
    return { studentMessage, aiMessage }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
