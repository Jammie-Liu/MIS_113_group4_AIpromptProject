import { HttpError } from '../Middleware/httpError.js'
import {
  findCompetitionByCode, findQuestionId, getCompetitionInfo, STAGE_TYPES,
} from '../Models/competitionModel.js'
import {
  createStudent, listStudentsInCompetition, updateGroup,
} from '../Models/studentModel.js'
import { insertExchange, listMessages, toPoints } from '../Models/messageModel.js'
import {
  listBasicAnswers, listPublicAnswers, listRevealed, submitAnswers,
} from '../Models/answerModel.js'
import { replyToStudent } from '../Services/aiService.js'
import {
  BASIC_SCORE, bestBasicMatch, isDuplicate, publicScore,
} from '../Services/answerMatch.js'

/* 學生端 API，規格見 docs/api-student.md（節號標在每支前面） */

// 資料庫的 snake_case → 回給前端的 camelCase
function toMe(s) {
  return { studentId: s.stu_id, name: s.name, groupId: s.group_id, competitionId: s.com_id }
}

// 1. POST /student/join：用賽場代碼＋名字加入
export async function join(req, res) {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : ''
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!code) throw new HttpError(400, 'VALIDATION_ERROR', '請輸入賽場代碼')
  if (!name || name.length > 20) throw new HttpError(400, 'VALIDATION_ERROR', '名字要 1～20 個字')

  const competition = await findCompetitionByCode(code)
  if (!competition) throw new HttpError(404, 'COMPETITION_NOT_FOUND', '找不到這個賽場代碼')

  const student = await createStudent({ name, comId: competition.com_id })
  res.status(201).json({ ...toMe(student), token: student.token })
}

// 2. GET /student/me：用通行碼找回自己的狀態
export async function getMe(req, res) {
  res.json(toMe(req.student))
}

// 3.1 GET /student/groups：各組名單（沒人的組也列出來）
export async function getGroups(req, res) {
  const { com_id, grp_num } = req.student
  const students = await listStudentsInCompetition(com_id)
  const groups = Array.from({ length: grp_num }, (_, i) => ({ groupId: i + 1, members: [] }))
  for (const s of students) {
    if (s.group_id) groups[s.group_id - 1]?.members.push({ studentId: s.stu_id, name: s.name })
  }
  res.json({ groupCount: grp_num, groups })
}

// 3.2 PUT /student/group：加入／換組／離開（groupId = null）
export async function setGroup(req, res) {
  const { groupId } = req.body ?? {}
  const { stu_id, group_id: currentGroup, grp_num, status } = req.student

  if (groupId !== null && !Number.isInteger(groupId)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'groupId 要是整數或 null')
  }
  if (groupId !== null && (groupId < 1 || groupId > grp_num)) {
    throw new HttpError(400, 'GROUP_OUT_OF_RANGE', `組別要在 1～${grp_num} 之間`)
  }
  // 開始後：還沒有組的人（例如遲到）可以選一次；已經有組的人不能再換或離開
  if (status !== 'waiting' && currentGroup !== null && groupId !== currentGroup) {
    throw new HttpError(409, 'COMPETITION_STARTED', '競賽已經開始，不能換組')
  }

  const student = await updateGroup(stu_id, groupId)
  res.json(toMe(student))
}

/* ---------- 下面幾支共用的檢查 ---------- */

// stage 要是 1 或 2
function parseStage(value) {
  const stage = Number(value)
  if (stage !== 1 && stage !== 2) throw new HttpError(400, 'VALIDATION_ERROR', 'stage 要是 1（原因）或 2（解方）')
  return stage
}

// 看：這個階段開放過就能看（舊階段可以點回去看）
function assertStageOpened(student, stage) {
  if (stage > student.current_stage) throw new HttpError(409, 'STAGE_NOT_OPEN', '這個階段還沒開放')
}

// 做（對話、送答案）：要有組、競賽進行中、而且是目前的階段
function assertCanAct(student, stage) {
  if (student.group_id === null) throw new HttpError(409, 'NO_GROUP', '請先選組別')
  if (student.status !== 'running') throw new HttpError(409, 'COMPETITION_NOT_RUNNING', '競賽還沒開始、暫停中或已經結束')
  if (stage !== student.current_stage) throw new HttpError(409, 'STAGE_NOT_OPEN', '只能在目前開放的階段作答')
}

function requireGroup(student) {
  if (student.group_id === null) throw new HttpError(409, 'NO_GROUP', '請先選組別')
}

function toMessage(m) {
  const out = { messageId: m.mess_id, role: m.role, content: m.content, time: m.time }
  if (m.role === 'ai') out.points = toPoints(m.content)
  return out
}

// 4. GET /student/competition：賽場資訊（含倒數用的時間）
export async function getCompetition(req, res) {
  const c = await getCompetitionInfo(req.student.com_id)
  const sizeOf = (type) => c.stages.find((s) => s.type === type)?.board_size ?? 0
  res.json({
    competitionId: c.com_id,
    code: c.code,
    topic: c.topic,
    content: c.content,
    groupCount: c.grp_num,
    stageMinutes: c.time,
    currentStage: c.current_stage,
    status: c.status,
    stageEndsAt: c.stage_ends_at,
    remainingSec: c.remaining_sec,
    serverTime: c.server_time,
    stages: [1, 2].map((stage) => ({ stage, type: STAGE_TYPES[stage], boardSize: sizeOf(STAGE_TYPES[stage]) })),
  })
}

// 5.1 GET /student/messages?stage=1：我在這個階段的對話
export async function getMessages(req, res) {
  const stage = parseStage(req.query.stage)
  assertStageOpened(req.student, stage)
  const qId = await findQuestionId(req.student.com_id, stage)
  const messages = await listMessages(req.student.stu_id, qId)
  res.json({ stage, messages: messages.map(toMessage) })
}

// 5.2 POST /student/messages：送訊息、拿 AI 回覆（目前是假回覆）
export async function postMessage(req, res) {
  const stage = parseStage(req.body?.stage)
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  if (!content || content.length > 1000) throw new HttpError(400, 'VALIDATION_ERROR', '訊息要 1～1000 個字')
  assertCanAct(req.student, stage)

  const qId = await findQuestionId(req.student.com_id, stage)
  const ai = await replyToStudent({ stageType: STAGE_TYPES[stage], content })
  const aiContent = [ai.intro, ...ai.points.map((p) => `- ${p}`)].join('\n')
  const saved = await insertExchange(req.student.stu_id, qId, content, aiContent)
  res.status(201).json({ studentMessage: toMessage(saved.studentMessage), aiMessage: toMessage(saved.aiMessage) })
}

// 6. POST /student/answers：送出勾選的答案
export async function postAnswers(req, res) {
  const stage = parseStage(req.body?.stage)
  const contents = req.body?.contents
  if (!Array.isArray(contents) || contents.length < 1 || contents.length > 10) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'contents 要是 1～10 項的陣列')
  }
  const texts = contents.map((t) => (typeof t === 'string' ? t.trim() : ''))
  if (texts.some((t) => !t || t.length > 500)) throw new HttpError(400, 'VALIDATION_ERROR', '每項答案要 1～500 個字')
  assertCanAct(req.student, stage)

  const { com_id, group_id, stu_id } = req.student
  const qId = await findQuestionId(com_id, stage)
  const basicAnswers = await listBasicAnswers(qId)
  const indexOf = new Map(basicAnswers.map((b, i) => [b.basic_ans_id, i]))

  // 一項一項判斷；前面亮的格子、搶到的內容，後面的項目也要算進去
  const decisions = await submitAnswers({ comId: com_id, groupId: group_id, qId, stuId: stu_id }, ({ revealedIds, publicTexts }) =>
    texts.map((content) => {
      const match = bestBasicMatch(content, basicAnswers, revealedIds)
      if (match) {
        revealedIds.add(match.basic_ans_id)
        return { content, basicAnsId: match.basic_ans_id, score: BASIC_SCORE, result: 'basic' }
      }
      // 對到的是自己這組「已經亮過」的格子：不計分，也不進公開搶答區
      if (bestBasicMatch(content, basicAnswers, new Set())) return { content, basicAnsId: null, score: 0, result: 'duplicate' }
      if (isDuplicate(content, publicTexts)) return { content, basicAnsId: null, score: 0, result: 'duplicate' }
      publicTexts.push(content)
      return { content, basicAnsId: null, score: publicScore(content, basicAnswers), result: 'public' }
    }))

  const results = decisions.map((d) => (d.result === 'basic'
    ? { content: d.content, result: 'basic', boardIndex: indexOf.get(d.basicAnsId), score: d.score }
    : { content: d.content, result: d.result, score: d.score }))
  const count = (r) => results.filter((x) => x.result === r).length
  res.status(201).json({
    results,
    summary: {
      basicCount: count('basic'),
      publicCount: count('public'),
      duplicateCount: count('duplicate'),
      totalScore: results.reduce((sum, r) => sum + r.score, 0),
    },
  })
}

// 7. GET /student/board?stage=1：我們這組的答案板（沒亮的格子不給內容）
export async function getBoard(req, res) {
  const stage = parseStage(req.query.stage)
  requireGroup(req.student)
  assertStageOpened(req.student, stage)
  const { com_id, group_id } = req.student
  const qId = await findQuestionId(com_id, stage)
  const basicAnswers = await listBasicAnswers(qId)
  const revealed = new Map((await listRevealed(com_id, group_id, qId)).map((r) => [r.basic_ans_id, r.name]))
  res.json({
    stage,
    boardSize: basicAnswers.length,
    cells: basicAnswers.map((b, index) => (revealed.has(b.basic_ans_id)
      ? { index, revealed: true, content: b.content, byName: revealed.get(b.basic_ans_id) }
      : { index, revealed: false })),
  })
}

// 8. GET /student/public-answers?stage=1：公開搶答區
export async function getPublicAnswers(req, res) {
  const stage = parseStage(req.query.stage)
  assertStageOpened(req.student, stage)
  const qId = await findQuestionId(req.student.com_id, stage)
  const answers = await listPublicAnswers(req.student.com_id, qId)
  res.json({
    stage,
    answers: answers.map((a) => ({
      answerId: a.stu_ans_id, groupId: a.group_id, studentName: a.name,
      content: a.content, score: Number(a.score), time: a.time,
    })),
  })
}
