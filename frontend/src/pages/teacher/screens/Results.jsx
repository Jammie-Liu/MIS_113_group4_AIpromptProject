import { useEffect, useRef, useState } from 'react'
import Podium from '../components/Podium.jsx'
import ResultsGrading from '../components/ResultsGrading.jsx'
import FinalKnowledgeMap from '../components/FinalKnowledgeMap.jsx'
import { RESULT_TEAMS, DIM_4D, TEAMS, roundSuggestion } from '../data.js'
import { RANKINGS, rankTeams, buildFinalMap, activeHallucinations, courseFourDStats, fourDLevels, reviewOf, sameReview, reviewHasChange } from '../scoring.js'
import FourDStatsTable from '../components/FourDStatsTable.jsx'
import RoundSuggestion from '../components/RoundSuggestion.jsx'
import { IconBulb, IconTrophy, IconChart } from '../icons.jsx'
import { playSuccess, playToggle, playUnlock } from '../sound.js'

const signed = (n) => (n > 0 ? `+${n}` : `${n}`)

const TABS = [
  { id: 'grade', label: '評分作業' },
  { id: 'kmap', label: '集體知識地圖' },
  { id: 'overview', label: '總覽' },
]

const MENU = [
  { id: 'suggestions', label: '各回合改善建議', hint: '評分 AI 每回合整理的 4D 建議', Icon: IconBulb, tone: '#FFC66D' },
  { id: 'ranking', label: '最終排名', hint: '解方、4D 兩個排名的分數明細', Icon: IconTrophy, tone: '#C5F36B' },
  { id: 'stats', label: '班級 4D 統計', hint: '寫入課程資料庫的統計', Icon: IconChart, tone: '#6EA8FF' },
]

/*
  提早「結束整場」時，排名只計已完成評分的回合（docs/scoring-design.md 七）：監控台把 scoredRounds 傳過來，
  這裡只取每隊前 scoredRounds 個回合的評分結果；一個回合都還沒評分就沒有分數可以排名，顯示說明。
  （直接進入結果頁、沒有經過監控台時 scoredRounds 是 undefined，就用全部回合。）
*/
export default function Results(props) {
  if (props.scoredRounds === 0) {
    return (
      <div className="arena-screen">
        <section className="arena-panel rs-locked" aria-label="沒有可以排名的回合">
          <div className="rs-locked-icon" aria-hidden="true">!</div>
          <h3>沒有完成評分的回合</h3>
          <p>這場競賽在第 1 回合評分完成前就結束了。排名只計已完成評分的回合，所以這場沒有分數與排名。</p>
          <button type="button" className="hint-btn rs-primary" onClick={props.onBackHome}>回首頁</button>
        </section>
      </div>
    )
  }
  return <ResultsBody {...props} />
}

function ResultsBody({ caseName, competitionId, totalRounds = 2, scoredRounds, onRecordCompetition, onBackHome, onToast }) {
  const [tab, setTab] = useState('grade')
  const [teams, setTeams] = useState(() => RESULT_TEAMS.map((team) => ({ ...team, rounds: team.rounds.slice(0, scoredRounds ?? team.rounds.length) })))
  const roundCount = teams[0].rounds.length
  const endedEarly = scoredRounds !== undefined && scoredRounds < totalRounds
  const [suggestRound, setSuggestRound] = useState(1)
  // 老師按「確認此隊分數」記錄下來的評分（對應 PUT …/teacher-review）：{ [teamId]: { review, savedAt } }；
  // teams 裡的加減分與評語是畫面上的草稿，按了確認才會記錄
  const [savedReviews, setSavedReviews] = useState({})
  // stage 0：老師查看 AI 評分、加減分；stage 1：老師按了「確認評分」或「跳過評分」，已計算最終排名並公布前三名
  const [stage, setStage] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [menuCount, setMenuCount] = useState(0)
  const [section, setSection] = useState(null)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  // 頒獎台揭曉完之後，三個按鈕依序冒出來；等第一名的「解鎖」音效播完（最長約 3 秒）才開始，避免音效疊在一起
  useEffect(() => {
    if (revealed < 3) return undefined
    const ids = MENU.map((_, idx) => 3000 + 600 * idx).map((delay, idx) => window.setTimeout(() => {
      setMenuCount((count) => Math.max(count, idx + 1))
      playToggle()
    }, delay))
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [revealed])

  function openSection(id) {
    setSection((current) => (current === id ? null : id))
    playToggle()
  }

  // 解方排名與 4D 排名分開計算（docs/scoring-design.md 七），不相加、不設綜合排名
  const rankedBy = Object.fromEntries(RANKINGS.map((r) => [r.key, rankTeams(teams, r.key)]))
  const ranked = rankedBy.solution
  const published = stage >= 1
  // 每隊的評分狀態：dirty ＝ 草稿跟已記錄的不同（還沒確認）；changed ＝ 已記錄的內容有加減分或評語
  const initialReviews = useRef(Object.fromEntries(teams.map((team) => [team.id, reviewOf(team)]))).current
  const statusOf = (team) => {
    const saved = savedReviews[team.id]
    const dirty = !sameReview(reviewOf(team), saved ? saved.review : initialReviews[team.id])
    return { saved, dirty, changed: Boolean(saved) && reviewHasChange(saved.review) }
  }
  const dirtyTeams = teams.filter((team) => statusOf(team).dirty)
  const changedTeams = teams.filter((team) => statusOf(team).changed)
  // 「確認評分」：至少一隊已確認、且有調整；還有隊伍改了但沒確認時也不能按（避免沒記錄到的調整被忽略）。
  // 都沒有調整就只能按「跳過評分」。
  const canConfirm = changedTeams.length > 0 && dirtyTeams.length === 0
  const confirmHint = dirtyTeams.length > 0
    ? `${dirtyTeams.map((t) => t.name).join('、')}有還沒確認的變更，請到該隊按「確認此隊分數」`
    : changedTeams.length === 0 ? '還沒有確認任何一隊的調整；不想調整請按「跳過評分」' : ''
  // 評分作業一律依隊伍順序排列、不顯示名次（名次只在「總覽」、且老師確認或跳過評分後才出現）
  const gradingItems = teams.map((team) => ranked.find((item) => item.team.id === team.id))
  const finalMap = buildFinalMap(teams)
  const fourDStats = courseFourDStats(teams)
  const levels = fourDLevels(teams)

  // 全班各維度的平均（換算成 0～100，雷達圖與下堂課建議用）
  const classAvg4D = Object.fromEntries(DIM_4D.map((dim) => [dim.key, ranked.reduce((sum, item) => sum + item.scores.fourDPercent[dim.key], 0) / ranked.length]))
  const avgOf = (kind) => ranked.reduce((sum, item) => sum + item.scores[kind].final, 0) / ranked.length
  const hallucinationTeams = teams.filter((t) => activeHallucinations(t).length > 0)
  const avgExchanges = TEAMS.reduce((sum, t) => sum + t.exchanges, 0) / TEAMS.length
  const official = finalMap.filter((r) => r.origin === 'official')
  const coverageRate = Math.round((official.filter((r) => r.covered.length > 0).length / official.length) * 100)

  function updateTeam(id, fn) {
    setTeams((list) => list.map((team) => (team.id === id ? fn(team) : team)))
  }

  // 「確認此隊分數」：把這隊目前的加減分與評語記錄下來
  function saveTeamReview(id) {
    const team = teams.find((t) => t.id === id)
    setSavedReviews((map) => ({ ...map, [id]: { review: reviewOf(team), savedAt: Date.now() } }))
    playSuccess()
    onToast(`已記錄 ${team.name} 的老師評分`)
  }

  // 頒獎台依序揭曉第三、第二、第一名（只有公布之後才能揭曉）
  function revealPodium() {
    if (!published || revealed > 0) return
    setRevealed(0)
    ;[300, 1300, 2500].forEach((delay, idx) => {
      timers.current.push(window.setTimeout(() => {
        setRevealed(idx + 1)
        if (idx === 2) playUnlock()
        else playSuccess()
      }, delay))
    })
  }

  // 老師按「確認評分」或「跳過評分」之後，才計算最終排名並公布結果（docs/scoring-design.md 八），
  // 同時「資料回存」：把這場的名次與課程 4D 統計寫進課程的過往競賽紀錄
  function publishResults(finalTeams) {
    const topThree = (kind) => rankTeams(finalTeams, kind).slice(0, 3).map((item, i) => ({ medal: ['gold', 'silver', 'bronze'][i], team: item.team.name, members: item.team.members.join('、') }))
    const solutionRanks = topThree('solution')
    const fourDRanks = topThree('fourD')
    onRecordCompetition?.({
      id: competitionId,
      title: caseName,
      meta: `${new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })} · ${finalTeams.length} 隊參賽 · 解方冠軍：${solutionRanks[0].team}・4D 冠軍：${fourDRanks[0].team}`,
      fourD: courseFourDStats(finalTeams),
      solutionRanks,
      fourDRanks,
    })
    setStage(1)
    setRevealed(0)
    setTab('overview')
    playSuccess()
    onToast('已公布結果：解方、4D 兩個排名的前三名全班可見；各隊看得到自己的分數、名次、互評與老師評價。')
  }

  function confirmGrading() {
    if (!canConfirm) return
    publishResults(teams)
  }

  function skipGrading() {
    if (!window.confirm('跳過評分會把所有隊伍的解方、4D 調整都歸零、清掉評語，直接用 AI 的分數計算兩個最終排名。確定要跳過嗎？')) return
    const zeroed = teams.map((team) => ({ ...team, solutionAdjustment: 0, fourDAdjustment: 0, teacherNote: '' }))
    setSavedReviews({})
    setTeams(zeroed)
    publishResults(zeroed)
  }

  const steps = [
    { label: '查看 AI 評分、加減分', done: published, note: `${changedTeams.length} / ${teams.length} 隊已確認調整` },
    { label: '確認評分（或跳過）', done: published, note: '按下後才計算兩個最終排名' },
    { label: '公布前三名', done: published && revealed >= 3, note: '解方、4D 各自公布；各隊看自己的詳情' },
  ]

  return (
    <div className="arena-screen">
      <section className="arena-console rs-console" aria-label="評分與總覽">
        <header className="rs-bar">
          <div className="rs-bar-title">
            <p className="arena-section-kicker">COMPETITION RESULTS</p>
            <h2>評分與總覽</h2>
            <span>{caseName}</span>
          </div>
          <ol className="rs-steps">
            {steps.map((step, idx) => (
              <li className={step.done ? 'done' : idx === steps.findIndex((s) => !s.done) ? 'current' : ''} key={step.label}>
                <i>{step.done ? '✓' : idx + 1}</i>
                <div><b>{step.label}</b><small>{step.note}</small></div>
              </li>
            ))}
          </ol>
        </header>

        {/* 動作按鈕放在框框外面自成一列：提示文字在左、按鈕在右 */}
        <div className="rs-bar-actions">
          {stage === 0 && confirmHint && <p className={`rs-confirm-hint${dirtyTeams.length > 0 ? ' warn' : ''}`}>{confirmHint}</p>}
          {stage === 0 && (
            <>
              <button type="button" className="arena-tool-btn" onClick={skipGrading} title="不調整任何隊伍的分數，直接用 AI 的分數計算兩個最終排名">跳過評分</button>
              <button type="button" className="hint-btn rs-primary" onClick={confirmGrading} disabled={!canConfirm} title={confirmHint}>確認評分</button>
            </>
          )}
          {stage >= 1 && <span className="rs-published">✓ 結果已公布</span>}
          <button type="button" className="arena-tool-btn" onClick={onBackHome}>回首頁</button>
        </div>

        <div className="rs-tabs td-tabs" role="tablist">
          {TABS.map((item) => (
            <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => setTab(item.id)}>
              {item.label}
              {item.id === 'grade' && changedTeams.length > 0 && <i>{changedTeams.length} 隊已確認</i>}
              {item.id === 'grade' && dirtyTeams.length > 0 && <i className="warn">{dirtyTeams.length} 隊未確認</i>}
              {item.id === 'overview' && !published && <i>未解鎖</i>}
            </button>
          ))}
        </div>

        {tab === 'overview' && !published && (
          <section className="arena-panel rs-locked" aria-label="名次尚未產生">
            <div className="rs-locked-icon" aria-hidden="true">?</div>
            <h3>名次還沒有產生</h3>
            <p>要等你在「評分作業」看完 AI 的評分，按下上方的 <b>確認評分</b> 或 <b>跳過評分</b>，才會計算解方、4D 兩個最終排名並產生總覽。</p>
            <ul className="rs-locked-list">
              {teams.map((team) => (
                <li className={statusOf(team).changed ? 'done' : ''} key={team.id}>
                  <b>{team.name}</b>
                  <span>{statusOf(team).dirty ? '有還沒確認的變更' : statusOf(team).changed ? `已確認：解方 ${signed(savedReviews[team.id].review.solutionAdjustment)}・4D ${signed(savedReviews[team.id].review.fourDAdjustment)}` : '未調整'}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="hint-btn rs-primary" onClick={() => setTab('grade')}>前往評分作業 →</button>
          </section>
        )}

        {tab === 'overview' && published && (
          <div className="rs-overview">
            <section className="arena-panel rs-podium-panel" aria-label="名次">
              <div className="arena-section-heading compact-heading">
                <div>
                  <h3>名次揭曉</h3>
                  <p>{revealed === 0 ? '解方、4D 兩個排名分開；按下「揭曉名次」同時依序揭曉第三、第二、第一名' : '兩個排名的前三名已公布給學生端'}</p>
                  {endedEarly && <p className="rs-early-note">這場提早結束：排名只計已完成評分的{roundCount === 1 ? '第 1 回合' : `第 1～${roundCount} 回合`}（共 {totalRounds} 回合）</p>}
                </div>
              </div>
              <div className="rs-podium-pair">
                {RANKINGS.map((r, idx) => (
                  <div className="rs-podium-col" key={r.key}>
                    <h4 className="rs-podium-title">{r.label}<small>滿分 100</small></h4>
                    <Podium ranked={rankedBy[r.key]} kind={r.key} revealed={revealed} onReveal={revealPodium} showReveal={idx === 0} />
                    <div className="rs-others">
                      {rankedBy[r.key].slice(3).map((item) => (
                        <span key={item.team.id}><b>{item.rank}</b>{item.team.name}<small>{item.scores[r.key].final.toFixed(1)}</small></span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {revealed >= 3 && (
            <div className="rs-kpis">
              <div><span>解方平均</span><b>{avgOf('solution').toFixed(1)}</b></div>
              <div><span>4D 平均</span><b>{avgOf('fourD').toFixed(1)}</b></div>
              <div className={hallucinationTeams.length > 0 ? 'warn' : ''}><span>幻覺扣分隊數</span><b>{hallucinationTeams.length}<small> / {teams.length}</small></b></div>
              <div><span>平均來回對話</span><b>{avgExchanges.toFixed(1)}<small> 次</small></b></div>
              <div><span>官方面向涵蓋率</span><b>{coverageRate}<small>%</small></b></div>
            </div>
            )}

            {menuCount > 0 && (
              <div className="rs-menu">
                <p className="rs-menu-lead">名次揭曉完了，接著想看什麼？<span>點選下面的項目，才會顯示對應內容</span></p>
                <div className="rs-menu-row" role="tablist" aria-label="賽後內容">
                  {MENU.slice(0, menuCount).map((item) => (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={section === item.id}
                      key={item.id}
                      className={`rs-menu-btn${section === item.id ? ' active' : ''}`}
                      style={{ '--mi': item.tone }}
                      onClick={() => openSection(item.id)}
                    >
                      <span className="rs-menu-icon" aria-hidden="true"><item.Icon size={26} /></span>
                      <span className="rs-menu-text"><b>{item.label}</b><small>{item.hint}</small></span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {section === 'suggestions' && (
              <div className="rs-section-body" key="suggestions">
            <section className="arena-panel" aria-labelledby="sg-heading">
              <div className="arena-section-heading compact-heading">
                <div><p className="arena-section-kicker">ROUND SUGGESTIONS</p><h3 id="sg-heading">各回合改善建議</h3><p>評分 AI 每回合依全班評分結果整理的 4D 建議，只有老師看得到{roundCount >= totalRounds ? '；最後一回合是整場 4D 總結' : ''}</p></div>
              </div>
              {roundCount > 1 && (
                <div className="rs-round-switch" role="tablist" aria-label="選擇回合">
                  {Array.from({ length: roundCount }, (_, i) => i + 1).map((r) => (
                    <button type="button" role="tab" aria-selected={suggestRound === r} className={suggestRound === r ? 'on' : ''} key={r} onClick={() => setSuggestRound(r)}>
                      {r >= totalRounds ? '整場總結' : `第 ${r} 回合`}
                    </button>
                  ))}
                </div>
              )}
              <RoundSuggestion suggestion={roundSuggestion(suggestRound, totalRounds)} />
            </section>
              </div>
            )}

            {section === 'stats' && (
              <div className="rs-section-body" key="stats">
            <section className="arena-panel" aria-labelledby="stats-heading">
              <div className="arena-section-heading compact-heading">
                <div><p className="arena-section-kicker">COURSE 4D STATS</p><h3 id="stats-heading">班級 4D 統計</h3><p>這場競賽的統計已寫入課程資料庫（{fourDStats.D1.n} 位學生），可以到課程的「4D 能力成長」追蹤變化</p></div>
              </div>
              <FourDStatsTable stats={fourDStats} tone="dark" />
            </section>
              </div>
            )}

            {section === 'ranking' && (
              <div className="rs-section-body" key="ranking">
            <section className="arena-panel" aria-labelledby="rank-heading">
              <div className="arena-section-heading compact-heading">
                <div><h3 id="rank-heading">最終排名</h3><p>解方、4D 分開排名，不相加。排名分數 ＝ 各回合分數的平均（滿分 100）；最終分數 ＝ 排名分數 ＋ 老師調整（各 ±10）</p></div>
              </div>
              {RANKINGS.map((r) => (
                <div className="rs-table-wrap" key={r.key}>
                  <h4 className="rs-table-title">{r.label}</h4>
                  <table className="rs-table">
                    <thead><tr><th>名次</th><th>隊伍</th><th>排名分數（回合平均）</th><th>老師調整</th><th>最終分數</th></tr></thead>
                    <tbody>
                      {rankedBy[r.key].map((item) => {
                        const sc = item.scores[r.key]
                        return (
                          <tr key={item.team.id} className={item.rank === 1 ? 'first' : ''}>
                            <td className="rs-rk">{item.rank}</td>
                            <td><b>{item.team.name}</b><small>{item.team.members.join('、')}</small></td>
                            <td>{sc.rankScore.toFixed(1)}</td>
                            <td>{sc.adjustment === 0 ? '—' : <b className={sc.adjustment > 0 ? 'rs-adj plus' : 'rs-adj minus'}>{signed(sc.adjustment)}</b>}</td>
                            <td className="rs-total-cell">{sc.final.toFixed(1)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
              </div>
            )}
          </div>
        )}

        {tab === 'grade' && <ResultsGrading items={gradingItems} published={published} classAvg4D={classAvg4D} fourDLevels={levels} onUpdate={updateTeam} statusOf={statusOf} onSave={saveTeamReview} />}

        {tab === 'kmap' && (
          <section className="arena-panel rs-kmap-panel">
            <FinalKnowledgeMap teams={teams} caseName={caseName} />
          </section>
        )}
      </section>
    </div>
  )
}
