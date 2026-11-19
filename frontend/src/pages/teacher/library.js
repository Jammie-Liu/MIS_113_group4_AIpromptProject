/*
  新版首頁用的假資料與規則：教師帳號、題庫（含版本紀錄）、競賽（進行中＋歷史紀錄）。
  還沒接後端，全部存在 TeacherApp 的 state；之後接 API 時，這裡的函式就是前端要跟後端對齊的規則。

  題庫的公開／改編規則（docs/system-flow.md 八）：
  - 自己的題庫：直接修改，每次修改都記一筆版本。
  - 別人的公開題庫：不能直接改到原本那份，按「編輯」會另存一份「我的改編版本」（forkOf 記原題庫）。
    改編版本可以設公開或私人；設公開時，這次的內容會記進原題庫的版本紀錄（標明是誰改的）。
    之後改編者再修改自己的改編版本，只要是公開狀態，也一樣會記進原題庫。
  - 私人題庫只有自己看得到，不會出現在共享題庫。
*/

export const SEED_ACCOUNTS = [
  { id: 'T001', name: '張欣綠' },
  { id: 'T002', name: '王大明' },
  { id: 'T003', name: '林小美' },
]

// ID 規則：英文字母或數字，3～20 個字（之後接後端時，帳號唯一性由後端再檢查一次）
export const ACCOUNT_ID_PATTERN = /^[A-Za-z0-9]{3,20}$/

export function findAccount(accounts, id) {
  const key = id.trim().toUpperCase()
  return accounts.find((a) => a.id.toUpperCase() === key) ?? null
}

let seq = 0
export function newId(prefix) {
  seq += 1
  return `${prefix}${Date.now().toString(36)}${seq}`
}

export function parseTags(text) {
  return [...new Set(text.split(/[,，、\s]+/).map((t) => t.trim().replace(/^#/, '')).filter(Boolean))]
}

function version(kind, editor, data, at, extra = {}) {
  return { id: newId('v'), kind, at, editorId: editor.id, editorName: editor.name, topic: data.topic, content: data.content, tags: data.tags, ...extra }
}

const A = SEED_ACCOUNTS[0]
const B = SEED_ACCOUNTS[1]
const C = SEED_ACCOUNTS[2]

function seedBank(id, owner, data, { visibility = 'public', scores = [], at = '2026-10-01T10:00', forkOf = null } = {}) {
  return {
    id, ...data, visibility, ownerId: owner.id, ownerName: owner.name, createdAt: at, updatedAt: at, forkOf, scores,
    versions: [version(forkOf ? 'fork-create' : 'create', owner, data, at)],
  }
}

const supplyChain = seedBank('b-supply', B, {
  topic: '供應鏈勞動爭議',
  content: '「安心生活」是台灣中大型電商平台，其熱銷生活用品供應商近期被爆料涉及超時工作與未依法投保，引發社群輿論與媒體關注。財務長擔心更換供應商墊高成本，永續長主張不處理會重創品牌信任。',
  tags: ['供應鏈', '企業倫理', '困難'],
}, { scores: [72.4, 68.1, 75.0], at: '2026-09-12T09:00' })

// 示範「別人改了我的公開題庫」：林小美改編了王大明的題庫並設為公開，所以王大明的題庫版本紀錄多一筆
const supplyChainFork = seedBank('b-supply-fork', C, {
  topic: '供應鏈勞動爭議（加入通路商觀點）',
  content: `${supplyChain.content}另外，主要通路商要求平台在兩週內提出改善方案，否則下架相關商品。`,
  tags: ['供應鏈', '企業倫理', '通路'],
}, { scores: [70.2], at: '2026-10-20T14:30', forkOf: { bankId: supplyChain.id, topic: supplyChain.topic, ownerName: B.name } })
supplyChain.versions.push(version('contrib', C, supplyChainFork, '2026-10-20T14:30', { sourceBankId: supplyChainFork.id }))

export const SEED_BANKS = [
  seedBank('b-retain', A, {
    topic: '團隊留任 vs 派遣轉正',
    content: '某部門有 5 名派遣人力已服務超過 2 年，部門主管希望轉正以留住熟練人力，但人事預算今年已被削減 15%，若全數轉正將排擠新進人力招募名額。',
    tags: ['人資', '預算', '中等'],
  }, { visibility: 'private', scores: [64.5], at: '2026-10-05T13:00' }),
  seedBank('b-drink', A, {
    topic: '老字號手搖飲品牌轉型兩難',
    content: '「甜心堂」是經營 20 年的手搖飲連鎖品牌，全台有 120 家分店。近年年輕消費者轉向精品咖啡與低糖健康飲品，營收連續三年下滑，行銷部提出全面轉型健康路線，財務部擔心現金流吃緊。',
    tags: ['行銷', '品牌轉型', '極困難'],
  }, { scores: [58.3], at: '2026-09-28T16:00' }),
  seedBank('b-esg', A, {
    topic: '綠色包材導入成本兩難',
    content: '某零售品牌承諾三年內全面改用可回收包材，但新包材成本高出 30%，採購部希望延後，永續部擔心延後會被認為漂綠。',
    tags: ['ESG', '成本'],
  }, { at: '2026-11-10T11:00' }),
  supplyChain,
  supplyChainFork,
  seedBank('b-delivery', B, {
    topic: '外送平台派單爭議兩難',
    content: '「快送」是外送媒合平台，演算法派單以效率為核心指標，但外送員反映尖峰時段等待與超時罰款機制不合理，社群串連要求平台調整制度。',
    tags: ['平台經濟', '勞動', '中等'],
  }, { scores: [80.6, 77.9], at: '2026-08-30T10:00' }),
  seedBank('b-pricing', C, {
    topic: '新品定價兩難',
    content: '某消費品牌即將推出新品，行銷部主張以低價快速搶市佔，財務部則堅持高毛利定價以維持品牌形象與獲利結構，雙方在上市前僵持不下。',
    tags: ['行銷', '定價', '困難'],
  }, { scores: [66.0], at: '2026-10-02T09:30' }),
  seedBank('b-private-b', B, {
    topic: '（王大明的私人題庫）併購後的組織整合',
    content: '兩家公司合併後，兩邊的業務團隊重疊，管理層要決定裁撤哪一邊的團隊。',
    tags: ['人資', '併購'],
  }, { visibility: 'private', at: '2026-11-01T10:00' }),
]

// 競賽：status 'active' 是已建立還沒結束（顯示在首頁），'ended' 是歷史紀錄（顯示在個人帳號管理）
export const SEED_COMPETITIONS = [
  {
    id: 'K-482913', code: '482913', ownerId: A.id, bankId: 'b-drink', title: '老字號手搖飲品牌轉型兩難',
    groupCount: 5, groupCap: 4, rounds: 2, timeLimit: 20, status: 'active', createdAt: '2026-11-18T09:10',
  },
  {
    id: 'K-310477', code: '310477', ownerId: A.id, bankId: 'b-drink', title: '老字號手搖飲品牌轉型兩難',
    groupCount: 4, groupCap: 3, rounds: 2, timeLimit: 20, status: 'ended', createdAt: '2026-10-14T10:00', endedAt: '2026-10-14T11:05', avgScore: 58.3,
  },
  {
    id: 'K-275106', code: '275106', ownerId: A.id, bankId: 'b-retain', title: '團隊留任 vs 派遣轉正',
    groupCount: 6, groupCap: 3, rounds: 2, timeLimit: 15, status: 'ended', createdAt: '2026-10-07T13:30', endedAt: '2026-10-07T14:20', avgScore: 64.5,
  },
]

export const GROUP_COUNT = { min: 2, max: 12 }
export const GROUP_CAP = { min: 2, max: 6 }

export function averageScore(bank) {
  if (!bank.scores?.length) return null
  return Math.round((bank.scores.reduce((a, b) => a + b, 0) / bank.scores.length) * 10) / 10
}

// 依平均分數由高到低排；還沒有人用來比賽過（沒有分數）的排在最後，彼此照最近更新排
export function sortByAverage(list) {
  return [...list].sort((a, b) => {
    const sa = averageScore(a)
    const sb = averageScore(b)
    if (sa === null && sb === null) return b.updatedAt.localeCompare(a.updatedAt)
    if (sa === null) return 1
    if (sb === null) return -1
    return sb - sa
  })
}

export function myBanks(banks, userId) {
  return banks.filter((b) => b.ownerId === userId)
}

export function sharedBanks(banks, userId) {
  return banks.filter((b) => b.visibility === 'public' && b.ownerId !== userId)
}

export function nowLocal() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatTime(value) {
  return value ? value.replace('T', ' ') : ''
}

/*
  儲存題庫，回傳新的題庫清單。三種情況：
  1. 新建：editing 為 null。
  2. 改自己的題庫：直接更新並記一筆版本；如果這份本身是改編別人的，而且存成公開，原題庫也記一筆。
  3. 改別人的公開題庫：另存一份我的改編版本；存成公開時，原題庫記一筆。
*/
export function saveBank(banks, { editing, data, user }) {
  const at = nowLocal()
  if (!editing) {
    const created = {
      id: newId('b'), ...data, ownerId: user.id, ownerName: user.name, createdAt: at, updatedAt: at, forkOf: null, scores: [],
      versions: [version('create', user, data, at)],
    }
    return { banks: [created, ...banks], saved: created }
  }

  if (editing.ownerId === user.id) {
    const updated = { ...editing, ...data, updatedAt: at, versions: [...editing.versions, version('edit', user, data, at)] }
    let next = banks.map((b) => (b.id === editing.id ? updated : b))
    if (editing.forkOf && data.visibility === 'public') next = addContribution(next, editing.forkOf.bankId, user, data, at, editing.id)
    return { banks: next, saved: updated }
  }

  const fork = {
    id: newId('b'), ...data, ownerId: user.id, ownerName: user.name, createdAt: at, updatedAt: at, scores: [],
    forkOf: { bankId: editing.id, topic: editing.topic, ownerName: editing.ownerName },
    versions: [version('fork-create', user, data, at)],
  }
  let next = [fork, ...banks]
  if (data.visibility === 'public') next = addContribution(next, editing.id, user, data, at, fork.id)
  return { banks: next, saved: fork }
}

function addContribution(banks, originId, user, data, at, sourceBankId) {
  return banks.map((b) => (b.id === originId ? { ...b, versions: [...b.versions, version('contrib', user, data, at, { sourceBankId })] } : b))
}

export const VERSION_LABELS = {
  create: '建立',
  edit: '修改',
  'fork-create': '從別人的題庫改編',
  contrib: '別人改編後公開',
}
