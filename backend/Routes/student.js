import { Router } from 'express'
import { requireStudent } from '../Middleware/studentAuth.js'
import * as student from '../Controllers/studentController.js'

/* 學生端 API（docs/api-student.md）。除了 join，都要帶通行碼 */
const router = Router()

router.post('/student/join', student.join)

router.get('/student/me', requireStudent, student.getMe)
router.get('/student/groups', requireStudent, student.getGroups)
router.put('/student/group', requireStudent, student.setGroup)

router.get('/student/competition', requireStudent, student.getCompetition)
router.get('/student/messages', requireStudent, student.getMessages)
router.post('/student/messages', requireStudent, student.postMessage)
router.post('/student/answers', requireStudent, student.postAnswers)
router.get('/student/board', requireStudent, student.getBoard)
router.get('/student/public-answers', requireStudent, student.getPublicAnswers)

export default router
