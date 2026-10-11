import { DIM_4D, DIM_4D_MAX, ADJUST_LIMIT } from './data.js'

/*
  競賽評分的計算（依 docs/scoring-design.md）。評分 AI 只判斷 0／1／2 與各種標記，分數由這裡的公式算：
    解方分數（0～100）＝ A 基本要求（20）＋ B 涵蓋面向（70）＋ C 新面向加分 − D 幻覺扣分
    組 4D 分數（0～100）＝ 組員個人 4D 的平均；四個維度各最高 25 分，盡-1（資安隱私）觸發一次盡責 −5（最低 0）
    每回合小組分數 ＝ 解方分數 ＋ 組 4D 分數（兩項各滿分 100，所以每回合滿分 200）
    排名分數 ＝ 各回合小組分數的平均
    最終排名分數 ＝ 排名分數 ＋ 老師調整（±10 分以內）
*/

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round1 = (value) => Math.round(value * 10) / 10

// 一個回合的解方分數：AI 判斷的結果，老師不能改
export function solutionScore(round) {
  const a = (round.stance.ok ? 10 : 0) + (round.measures.ok ? 10 : 0)
  const levelSum = round.coverage.reduce((sum, item) => sum + item.level, 0)
  const b = (levelSum / (round.coverage.length * 2)) * 70
  const c = Math.min(10, 5 * round.bonusDims.filter((d) => d.active).length)
  const d = Math.min(20, round.flags.filter((f) => f.active).reduce((sum, f) => sum + f.penalty, 0))
  return { a, b, c, d, total: clamp(a + b + c - d, 0, 100) }
}

// 一個回合的 4D：每位組員各評一次（四個維度各 0～25），盡-1 觸發時，被點名那位組員的盡責 −5（最低 0）；
// 小組 4D ＝ 組員個人 4D 的平均（維度分數與總分都是平均）
export function fourDScore(round) {
  const hit = new Map()
  ;(round.privacy ?? []).forEach((item) => hit.set(item.member, (hit.get(item.member) ?? 0) + 1))
  const members = Object.entries(round.memberFourD).map(([name, raw]) => {
    const dims = { ...raw }
    if (hit.has(name)) dims.D4 = Math.max(0, dims.D4 - 5)
    return { name, dims, total: DIM_4D.reduce((sum, dim) => sum + dims[dim.key], 0), privacyHit: hit.has(name) }
  })
  const dims = {}
  DIM_4D.forEach((dim) => { dims[dim.key] = members.reduce((sum, m) => sum + m.dims[dim.key], 0) / members.length })
  return { dims, total: members.reduce((sum, m) => sum + m.total, 0) / members.length, members, privacyHit: hit.size > 0 }
}

export function teamAdjustment(team) {
  return clamp(Math.round(Number(team.adjustment) || 0), -ADJUST_LIMIT, ADJUST_LIMIT)
}

export function computeScores(team) {
  const rounds = team.rounds.map((round) => {
    const solution = solutionScore(round)
    const fourD = fourDScore(round)
    return { solution, fourD, total: solution.total + fourD.total }
  })
  const avg = (pick) => rounds.reduce((sum, r) => sum + pick(r), 0) / rounds.length
  const rankScore = avg((r) => r.total)
  const adjustment = teamAdjustment(team)
  const finalScore = Math.max(0, rankScore + adjustment)
  // 各維度跨回合平均，換算成 0～100 給雷達圖用
  const fourDPercent = {}
  DIM_4D.forEach((dim) => { fourDPercent[dim.key] = (avg((r) => r.fourD.dims[dim.key]) / DIM_4D_MAX) * 100 })
  return {
    rounds,
    solutionAvg: avg((r) => r.solution.total),
    fourDAvg: avg((r) => r.fourD.total),
    fourDPercent,
    rankScore: round1(rankScore),
    adjustment,
    final: round1(finalScore),
    total: round1(finalScore), // 排名、頒獎台、總覽都用最終分數
  }
}

export function rankTeams(teams) {
  return teams
    .map((team) => ({ team, scores: computeScores(team) }))
    .sort((x, y) => y.scores.total - x.scores.total)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))
}

// 老師調整的檢查：有加減分就一定要寫理由
export function adjustmentMissingReason(team) {
  return teamAdjustment(team) !== 0 && !String(team.adjustReason ?? '').trim()
}

// 評分 AI 標記、列給老師「參考」的項目（不用逐項確認，只是讓老師決定要不要加減分）：
// 不確定、疑似錯誤／無法確認（待查證，不扣分）、幻覺扣分（明確錯誤、前後矛盾）、盡-1 資安與隱私扣分
export function priorityItems(team) {
  const items = []
  team.rounds.forEach((round, ri) => {
    const label = `第 ${ri + 1} 回合`
    round.coverage.forEach((item) => {
      if (item.uncertain) items.push({ key: `r${ri}-cov-${item.dim}`, round: label, kind: '不確定', title: item.dim, desc: '評分 AI 在兩個分數之間猶豫，給了較低的分數。' })
    })
    round.flags.forEach((flag, idx) => {
      items.push({ key: `r${ri}-flag-${idx}`, round: label, kind: flag.type, title: flag.text, desc: flag.reason, penalty: flag.active ? flag.penalty : 0 })
    })
    ;(round.privacy ?? []).forEach((item, idx) => {
      items.push({ key: `r${ri}-privacy-${idx}`, round: label, kind: '盡-1 資安隱私', title: `${item.member}：${item.text}`, desc: item.reason, penalty: 5 })
    })
    ;(round.fourDUncertain ?? []).forEach((item, idx) => {
      items.push({ key: `r${ri}-4d-${idx}`, round: label, kind: '4D 不確定', title: `${item.member}・${item.indicator}`, desc: `${item.evidence}：${item.reason}` })
    })
  })
  return items
}

// 隊伍有沒有被扣幻覺分（任一回合、確認為幻覺）
export function activeHallucinations(team) {
  return team.rounds.flatMap((round) => round.flags.filter((f) => f.active && f.penalty > 0))
}

// 賽後集體知識地圖：官方面向 + 各隊自創面向，每格是該隊「最後一回合」最終回答的涵蓋深度 0/1/2；被幻覺扣分的面向該隊不計
export function buildFinalMap(teams) {
  const last = (team) => team.rounds[team.rounds.length - 1]
  const letters = teams.map((t) => t.id)
  const official = last(teams[0]).coverage.map((c) => c.dim)
  const created = []
  teams.forEach((team) => {
    last(team).bonusDims.forEach((d) => { if (!created.includes(d.dim)) created.push(d.dim) })
  })
  const rows = [...official.map((dim) => ({ dim, origin: 'official' })), ...created.map((dim) => ({ dim, origin: 'team' }))]
  return rows.map((row) => {
    const cells = {}
    letters.forEach((id) => {
      const round = last(teams.find((t) => t.id === id))
      let level = 0
      let excluded = null
      if (row.origin === 'official') {
        level = round.coverage.find((c) => c.dim === row.dim).level
        const flag = round.flags.find((f) => f.active && f.dim === row.dim)
        if (flag) { excluded = flag.text; level = 0 }
      } else {
        const bonus = round.bonusDims.find((d) => d.dim === row.dim)
        level = bonus && bonus.active ? 2 : 0
      }
      cells[id] = { level, excluded }
    })
    const covered = letters.filter((id) => cells[id].level >= 1)
    const solid = letters.filter((id) => cells[id].level === 2)
    return { ...row, cells, covered, solid }
  })
}

// ───── 課程 4D 統計（競賽結束後寫入課程資料庫）─────
// 以每位學生各回合平均的 4D 分數為資料，四個維度分開計算：平均、高標（第 75 百分位）、低標（第 25 百分位）、中位數、標準差（母體）
function percentile(sorted, p) {
  if (sorted.length === 1) return sorted[0]
  const pos = (sorted.length - 1) * p
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export function courseFourDStats(teams) {
  const stats = {}
  DIM_4D.forEach((dim) => {
    const perStudent = {}
    teams.forEach((team) => {
      team.rounds.forEach((round) => {
        fourDScore(round).members.forEach((m) => {
          ;(perStudent[m.name] ??= []).push(m.dims[dim.key])
        })
      })
    })
    const values = Object.values(perStudent).map((list) => list.reduce((a, b) => a + b, 0) / list.length).sort((a, b) => a - b)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    stats[dim.key] = { mean: round1(mean), p75: round1(percentile(values, 0.75)), p25: round1(percentile(values, 0.25)), median: round1(percentile(values, 0.5)), sd: round1(Math.sqrt(variance)), n: values.length }
  })
  return stats
}
