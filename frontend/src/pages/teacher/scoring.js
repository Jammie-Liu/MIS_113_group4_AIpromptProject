import { DIM_4D } from './data.js'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round1 = (value) => Math.round(value * 10) / 10

// 解方分數：A 基本要求 20 + B 涵蓋面向 70 + C 新面向加分 − D 幻覺扣分（皆由程式依公式算，AI 只判斷 0/1/2）
export function solutionScore(team) {
  const a = (team.stance.ok ? 10 : 0) + (team.measures.ok ? 10 : 0)
  const levelSum = team.coverage.reduce((sum, item) => sum + item.level, 0)
  const b = (levelSum / (team.coverage.length * 2)) * 70
  const c = Math.min(10, 5 * team.bonusDims.filter((d) => d.active).length)
  const d = Math.min(20, team.flags.filter((f) => f.active).reduce((sum, f) => sum + f.penalty, 0))
  return { a, b, c, d, total: clamp(a + b + c - d, 0, 100) }
}

export function fourDAverage(team) {
  return DIM_4D.reduce((sum, dim) => sum + team.fourD[dim.key], 0) / DIM_4D.length
}

// 別組給的互評平均（滿分 100）
export function peerAverage(team) {
  return team.peerRatings.reduce((sum, r) => sum + r.score, 0) / team.peerRatings.length
}

// 總分沒有權重：解方分數 ＋ 別組互評平均 ＋ 老師個別加分。4D 只供參考，不計入。
export function computeScores(team) {
  const solution = solutionScore(team)
  const fourD = fourDAverage(team)
  const peer = peerAverage(team)
  const parts = { ai: solution.total, peer, bonus: team.bonusPoints }
  const total = Math.max(0, parts.ai + parts.peer + parts.bonus)
  return { solution, fourD, peer, parts, total: round1(total) }
}

export function rankTeams(teams) {
  return teams
    .map((team) => ({ team, scores: computeScores(team) }))
    .sort((x, y) => y.scores.total - x.scores.total)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))
}

// 需要老師確認的項目：評分 AI 標了「不確定」的判斷，以及所有幻覺／待查證標記
export function priorityItems(team) {
  const items = []
  team.coverage.forEach((item) => {
    if (item.uncertain) items.push({ key: `cov-${item.dim}`, kind: '不確定', title: item.dim, desc: '評分 AI 在兩個分數之間猶豫，給了較低的分數。' })
  })
  team.flags.forEach((flag, idx) => {
    items.push({ key: `flag-${idx}`, kind: flag.type, title: flag.text, desc: flag.reason })
  })
  return items
}

// 賽後集體知識地圖：官方面向 + 各隊自創面向，每格是該隊的涵蓋深度 0/1/2；被幻覺扣分的面向該隊不計
export function buildFinalMap(teams) {
  const letters = teams.map((t) => t.id)
  const official = teams[0].coverage.map((c) => c.dim)
  const created = []
  teams.forEach((team) => {
    team.bonusDims.forEach((d) => { if (!created.includes(d.dim)) created.push(d.dim) })
  })
  const rows = [...official.map((dim) => ({ dim, origin: 'official' })), ...created.map((dim) => ({ dim, origin: 'team' }))]
  return rows.map((row) => {
    const cells = {}
    letters.forEach((id) => {
      const team = teams.find((t) => t.id === id)
      let level = 0
      let excluded = null
      if (row.origin === 'official') {
        level = team.coverage.find((c) => c.dim === row.dim).level
        const flag = team.flags.find((f) => f.active && f.dim === row.dim)
        if (flag) { excluded = flag.text; level = 0 }
      } else {
        const bonus = team.bonusDims.find((d) => d.dim === row.dim)
        level = bonus && bonus.active ? 2 : 0
      }
      cells[id] = { level, excluded }
    })
    const covered = letters.filter((id) => cells[id].level >= 1)
    const solid = letters.filter((id) => cells[id].level === 2)
    return { ...row, cells, covered, solid }
  })
}
