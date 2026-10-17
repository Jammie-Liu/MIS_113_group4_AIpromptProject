import { DIM_4D, DIM_4D_MAX, ADJUST_LIMIT } from './data.js'

/*
  競賽評分的計算（依 docs/scoring-design.md 三、四、七、八）。評分 AI 只判斷 0／1／2 與各種標記，分數由這裡的公式算：
    A 基本要求：門檻，不給分；立場、配套各缺一項扣 10
    B 涵蓋面向（0～90）：只算「超出基準答案」的部分（基準答案＝不用 4D 技巧、直接問 AI 就有的內容）
        每個面向得分 ＝ max(0, 涵蓋程度 − 基準等級)；可進步空間 ＝ 2 − 基準等級（基準已經是 2 的面向不列入）
        B ＝ 各面向得分加總 ÷ 可進步空間加總 × 90
    解方分數（0～100）＝ B ＋ C 新面向加分 − A 缺項扣分 − D 幻覺扣分
    組 4D 分數（0～100）＝ 組員個人 4D 的平均；四個維度各最高 25 分，盡-1（資安隱私）觸發一次盡責 −5（最低 0）
  兩個排名分開算、不相加（第七節）：
    解方排名分數 ＝ 各回合解方分數的平均；最終 ＝ ＋ 老師的解方調整（±10）
    4D 排名分數  ＝ 各回合組 4D 分數的平均；最終 ＝ ＋ 老師的 4D 調整（±10）
*/

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round1 = (value) => Math.round(value * 10) / 10
const mean = (list) => list.reduce((sum, v) => sum + v, 0) / list.length

export const RANKINGS = [
  { key: 'solution', label: '解方排名', short: '解方', adjustKey: 'solutionAdjustment' },
  { key: 'fourD', label: '4D 排名', short: '4D', adjustKey: 'fourDAdjustment' },
]

// 一個面向是否超出基準答案（畫面標示「基本提問就有／超出基本提問」）
export function beyondBaseline(item) {
  return item.level > item.baselineLevel
}

// 一個回合的解方分數：AI 判斷的結果，老師不能改
export function solutionScore(round) {
  const aPenalty = (round.stance.ok ? 0 : 10) + (round.measures.ok ? 0 : 10)
  const counted = round.coverage.filter((item) => item.baselineLevel < 2)
  const earned = counted.reduce((sum, item) => sum + Math.max(0, item.level - item.baselineLevel), 0)
  const room = counted.reduce((sum, item) => sum + (2 - item.baselineLevel), 0)
  const b = room === 0 ? 0 : (earned / room) * 90
  const c = Math.min(10, 5 * round.bonusDims.filter((d) => d.active).length)
  const d = Math.min(20, round.flags.filter((f) => f.active).reduce((sum, f) => sum + f.penalty, 0))
  return { aPenalty, b, earned, room, c, d, total: clamp(b + c - aPenalty - d, 0, 100) }
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

// 老師對某個排名的調整（kind 是 'solution' 或 'fourD'），限制在 ±10
export function teamAdjustment(team, kind) {
  const { adjustKey } = RANKINGS.find((r) => r.key === kind)
  return clamp(Math.round(Number(team[adjustKey]) || 0), -ADJUST_LIMIT, ADJUST_LIMIT)
}

export function hasAdjustment(team) {
  return RANKINGS.some((r) => teamAdjustment(team, r.key) !== 0)
}

export function computeScores(team) {
  const rounds = team.rounds.map((round) => ({ solution: solutionScore(round), fourD: fourDScore(round) }))
  const avg = (pick) => mean(rounds.map(pick))
  const ranking = (kind, rankScore) => {
    const adjustment = teamAdjustment(team, kind)
    return { rankScore: round1(rankScore), adjustment, final: round1(clamp(rankScore + adjustment, 0, 100)) }
  }
  // 各維度跨回合平均（0～25），以及換算成 0～100 給雷達圖用
  const fourDDims = {}
  const fourDPercent = {}
  DIM_4D.forEach((dim) => {
    fourDDims[dim.key] = avg((r) => r.fourD.dims[dim.key])
    fourDPercent[dim.key] = (fourDDims[dim.key] / DIM_4D_MAX) * 100
  })
  return {
    rounds,
    solution: ranking('solution', avg((r) => r.solution.total)),
    fourD: ranking('fourD', avg((r) => r.fourD.total)),
    fourDDims,
    fourDPercent,
  }
}

// 依某一個排名（'solution' 或 'fourD'）排序；兩個排名分開，不相加、不設綜合排名
export function rankTeams(teams, kind) {
  return teams
    .map((team) => ({ team, scores: computeScores(team) }))
    .sort((x, y) => y.scores[kind].final - x.scores[kind].final)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))
}

/*
  4D 三個層級（docs/scoring-design.md 四）：全班平均、各組平均、每位學生個人，每一層都有四個維度與總分。
  個人分數取各回合平均；組平均 ＝ 組員個人的平均；全班平均 ＝ 全班學生個人的平均（不是各組平均再平均，避免人數少的組權重過大）。
*/
export function fourDLevels(teams) {
  const withTotal = (dims) => ({ ...dims, total: DIM_4D.reduce((sum, dim) => sum + dims[dim.key], 0) })
  const averageDims = (list) => Object.fromEntries(DIM_4D.map((dim) => [dim.key, mean(list.map((d) => d[dim.key]))]))
  const teamRows = teams.map((team) => {
    const perMember = {}
    team.rounds.forEach((round) => {
      fourDScore(round).members.forEach((m) => { (perMember[m.name] ??= []).push(m.dims) })
    })
    const members = Object.entries(perMember).map(([name, list]) => ({ name, ...withTotal(averageDims(list)) }))
    return { id: team.id, name: team.name, ...withTotal(averageDims(members)), members }
  })
  const everyone = teamRows.flatMap((t) => t.members)
  return { class: withTotal(averageDims(everyone)), teams: teamRows }
}

// 評分 AI 標記、列給老師「參考」的項目（不用逐項確認，只是讓老師決定要不要加減分），分成兩類（docs/scoring-design.md 八）：
//   解方：A 基本要求缺項、不確定的面向、疑似錯誤／無法確認（待查證，不扣分）、幻覺扣分（明確錯誤、前後矛盾）
//   4D：「不確定」的指標、盡-1 資安與隱私扣分
export function priorityItems(team) {
  const items = []
  team.rounds.forEach((round, ri) => {
    const label = `第 ${ri + 1} 回合`
    ;[['stance', '立場不明確'], ['measures', '沒有具體配套措施']].forEach(([key, title]) => {
      if (!round[key].ok) items.push({ key: `r${ri}-a-${key}`, group: 'solution', round: label, kind: 'A 基本要求缺項', title, desc: '基本要求是門檻，缺一項扣 10 分。', penalty: 10 })
    })
    round.coverage.forEach((item) => {
      if (item.uncertain) items.push({ key: `r${ri}-cov-${item.dim}`, group: 'solution', round: label, kind: '不確定', title: item.dim, desc: '評分 AI 在兩個分數之間猶豫，給了較低的分數。' })
    })
    round.flags.forEach((flag, idx) => {
      items.push({ key: `r${ri}-flag-${idx}`, group: 'solution', round: label, kind: flag.type, title: flag.text, desc: flag.reason, penalty: flag.active ? flag.penalty : 0 })
    })
    ;(round.fourDUncertain ?? []).forEach((item, idx) => {
      items.push({ key: `r${ri}-4d-${idx}`, group: 'fourD', round: label, kind: '4D 不確定', title: `${item.member}・${item.indicator}`, desc: `${item.evidence}：${item.reason}` })
    })
    ;(round.privacy ?? []).forEach((item, idx) => {
      items.push({ key: `r${ri}-privacy-${idx}`, group: 'fourD', round: label, kind: '盡-1 資安隱私', title: `${item.member}：${item.text}`, desc: item.reason, penalty: 5 })
    })
  })
  return items
}

// 隊伍有沒有被扣幻覺分（任一回合、確認為幻覺）
export function activeHallucinations(team) {
  return team.rounds.flatMap((round) => round.flags.filter((f) => f.active && f.penalty > 0))
}

// 賽後集體知識地圖（docs/scoring-design.md 十一「完整版」）：官方面向 + 評分 AI 確認的新面向；
// 每格是該隊各回合中「最高」的涵蓋深度 0/1/2。某一回合被判定幻覺扣分的面向，那一回合不計；
// 如果每個回合都沒有算到分、又有幻覺扣分，就標示被幻覺排除（excluded 寫原因）
export function buildFinalMap(teams) {
  const letters = teams.map((t) => t.id)
  const official = teams[0].rounds[0].coverage.map((c) => c.dim)
  const created = []
  teams.forEach((team) => {
    team.rounds.forEach((round) => {
      round.bonusDims.forEach((d) => { if (d.active && !created.includes(d.dim)) created.push(d.dim) })
    })
  })
  const rows = [...official.map((dim) => ({ dim, origin: 'official' })), ...created.map((dim) => ({ dim, origin: 'team' }))]
  return rows.map((row) => {
    const cells = {}
    letters.forEach((id) => {
      const team = teams.find((t) => t.id === id)
      let level = 0
      let excluded = null
      team.rounds.forEach((round) => {
        if (row.origin === 'official') {
          const flag = round.flags.find((f) => f.active && f.dim === row.dim)
          if (flag) { excluded = excluded ?? flag.text; return }
          level = Math.max(level, round.coverage.find((c) => c.dim === row.dim).level)
        } else {
          const bonus = round.bonusDims.find((d) => d.dim === row.dim)
          if (bonus && bonus.active) level = 2
        }
      })
      cells[id] = { level, excluded: level > 0 ? null : excluded }
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
