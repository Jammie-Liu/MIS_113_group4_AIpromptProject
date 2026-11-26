import { HttpError } from './httpError.js'
import { findStudentByToken } from '../Models/studentModel.js'

/*
  學生通行碼檢查：header 要帶 `Authorization: Bearer <token>`。
  通過的話把學生放在 req.student，controller 直接用：
    { stu_id, name, group_id, com_id, grp_num, current_stage, status }
*/
export async function requireStudent(req, res, next) {
  const match = /^Bearer\s+(\S+)$/.exec(req.get('Authorization') ?? '')
  const student = match ? await findStudentByToken(match[1]) : null
  if (!student) throw new HttpError(401, 'INVALID_TOKEN', '通行碼不正確，請重新輸入賽場代碼加入')
  req.student = student
  next()
}
