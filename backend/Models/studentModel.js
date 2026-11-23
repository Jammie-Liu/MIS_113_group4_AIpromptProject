import crypto from 'node:crypto'
import { query } from '../db/pool.js'

/*
  student 表的查詢。
  token（通行碼）：64 字元亂碼，學生加入時產生，之後每次請求用它認人（docs/api-student.md 第 0 節）。
*/

export async function createStudent({ name, comId }) {
  const token = crypto.randomBytes(32).toString('hex')
  const { rows } = await query(
    `INSERT INTO student (name, com_id, token) VALUES ($1, $2, $3)
     RETURNING stu_id, name, group_id, com_id, token`,
    [name, comId, token],
  )
  return rows[0]
}

// 用通行碼找學生，順便帶出他那場競賽的狀態（很多檢查都要用到）
export async function findStudentByToken(token) {
  const { rows } = await query(
    `SELECT s.stu_id, s.name, s.group_id, s.com_id,
            c.grp_num, c.current_stage, c.status
       FROM student s
       JOIN competition c ON c.com_id = s.com_id
      WHERE s.token = $1`,
    [token],
  )
  return rows[0] ?? null
}

export async function listStudentsInCompetition(comId) {
  const { rows } = await query(
    `SELECT stu_id, name, group_id FROM student WHERE com_id = $1 ORDER BY stu_id`,
    [comId],
  )
  return rows
}

export async function updateGroup(stuId, groupId) {
  const { rows } = await query(
    `UPDATE student SET group_id = $2 WHERE stu_id = $1
     RETURNING stu_id, name, group_id, com_id`,
    [stuId, groupId],
  )
  return rows[0]
}
