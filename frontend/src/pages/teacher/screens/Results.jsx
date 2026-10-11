import { useEffect, useRef, useState } from 'react'
import Podium from '../components/Podium.jsx'
import ResultsGrading from '../components/ResultsGrading.jsx'
import FinalKnowledgeMap from '../components/FinalKnowledgeMap.jsx'
import { RESULT_TEAMS, RESULT_HIGHLIGHTS, DIM_4D, TEAMS } from '../data.js'
import { rankTeams, buildFinalMap, adjustmentMissingReason, activeHallucinations, teamAdjustment, courseFourDStats } from '../scoring.js'
import FourDStatsTable from '../components/FourDStatsTable.jsx'
import { IconSparkStar, IconBulb, IconTrophy, IconChart } from '../icons.jsx'
import { playSuccess, playToggle, playUnlock } from '../sound.js'

const TABS = [
  { id: 'grade', label: '評分作業' },
  { id: 'kmap', label: '集體知識地圖' },
  { id: 'overview', label: '總覽' },
]

const MENU = [
  { id: 'highlights', label: '賽後亮點', hint: '看看各隊最精彩的 prompt', Icon: IconSparkStar, tone: '#B58CFF' },
  { id: 'insights', label: '下堂課建議', hint: '這場競賽整理出的教學重點', Icon: IconBulb, tone: '#FFC66D' },
  { id: 'ranking', label: '最終排名', hint: '各隊分數與組成明細', Icon: IconTrophy, tone: '#C5F36B' },
  { id: 'stats', label: '班級 4D 統計', hint: '寫入課程資料庫的統計', Icon: IconChart, tone: '#6EA8FF' },
]

export default function Results({ caseName, competitionId, onRecordCompetition, onBackHome, onToast }) {
  const [tab, setTab] = useState('grade')
  const [teams, setTeams] = useState(() => RESULT_TEAMS.map((team) => ({ ...team })))
  // stage 0：老師查看 AI 評分、加減分；stage 1：老師按了「確認評分」或「跳過評分」，已計算最終排名並公布前三名
  const [stage, setStage] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [menuCount, setMenuCount] = useState(0)
  const [section, setSection] = useState(null)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  // 頒獎台揭曉完之後，三個按鈕依序冒出來
  useEffect(() => {
    if (revealed < 3) return undefined
    const ids = MENU.map((_, idx) => 500 + 700 * idx).map((delay, idx) => window.setTimeout(() => {
      setMenuCount((count) => Math.max(count, idx + 1))
      playToggle()
    }, delay))
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [revealed])

  function openSection(id) {
    setSection((current) => (current === id ? null : id))
    playToggle()
  }

  const ranked = rankTeams(teams)
  const published = stage >= 1
  const adjustedCount = teams.filter((t) => teamAdjustment(t) !== 0).length
  const missingTeams = teams.filter(adjustmentMissingReason)
  const canConfirm = missingTeams.length === 0
  // 評分作業一律依隊伍順序排列、不顯示名次（名次只在「總覽」、且老師確認或跳過評分後才出現）
  const gradingItems = teams.map((team) => ranked.find((item) => item.team.id === team.id))
  const finalMap = buildFinalMap(teams)
  const fourDStats = courseFourDStats(teams)

  // 全班各維度的平均（換算成 0～100，雷達圖與下堂課建議用）
  const classAvg4D = Object.fromEntries(DIM_4D.map((dim) => [dim.key, ranked.reduce((sum, item) => sum + item.scores.fourDPercent[dim.key], 0) / ranked.length]))
  const avgTotal = ranked.reduce((sum, item) => sum + item.scores.total, 0) / ranked.length
  const hallucinationTeams = teams.filter((t) => activeHallucinations(t).length > 0)
  const avgExchanges = TEAMS.reduce((sum, t) => sum + t.exchanges, 0) / TEAMS.length
  const official = finalMap.filter((r) => r.origin === 'official')
  const coverageRate = Math.round((official.filter((r) => r.covered.length > 0).length / official.length) * 100)
  const weakest = DIM_4D.reduce((min, dim) => (classAvg4D[dim.key] < classAvg4D[min.key] ? dim : min), DIM_4D[0])
  const gaps = finalMap.filter((r) => r.covered.length === 0)

  function updateTeam(id, fn) {
    setTeams((list) => list.map((team) => (team.id === id ? fn(team) : team)))
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
    const rankedFinal = rankTeams(finalTeams)
    onRecordCompetition?.({
      id: competitionId,
      title: caseName,
      meta: `${new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })} · ${finalTeams.length} 隊參賽 · 冠軍：${rankedFinal[0].team.name}`,
      fourD: courseFourDStats(finalTeams),
      ranks: rankedFinal.slice(0, 3).map((item, i) => ({ medal: ['gold', 'silver', 'bronze'][i], team: item.team.name, members: item.team.members.join('、') })),
    })
    setStage(1)
    setRevealed(0)
    setTab('overview')
    playSuccess()
    onToast('已公布結果：前三名全班可見；各隊看得到自己的總分、名次、互評與老師評價。')
  }

  function confirmGrading() {
    if (!canConfirm) return
    publishResults(teams)
  }

  function skipGrading() {
    if (!window.confirm('跳過評分會把所有隊伍的老師加減分歸零（不需要寫理由），直接用 AI 的分數計算最終排名。確定要跳過嗎？')) return
    const zeroed = teams.map((team) => ({ ...team, adjustment: 0, adjustReason: '' }))
    setTeams(zeroed)
    publishResults(zeroed)
  }

  const steps = [
    { label: '查看 AI 評分、加減分', done: published, note: `${adjustedCount} / ${teams.length} 隊有加減分` },
    { label: '確認評分（或跳過）', done: published, note: '按下後才計算最終排名' },
    { label: '公布前三名', done: published && revealed >= 3, note: '全班可見；各隊看自己的詳情' },
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
          <div className="rs-bar-actions">
            {stage === 0 && (
              <>
                <button type="button" className="arena-tool-btn" onClick={skipGrading} title="不調整任何隊伍的分數，直接用 AI 的分數計算最終排名">跳過評分</button>
                <button
                  type="button"
                  className="hint-btn rs-primary"
                  onClick={confirmGrading}
                  disabled={!canConfirm}
                  title={canConfirm ? '' : `${missingTeams.map((t) => t.name).join('、')} 有加減分但還沒寫理由`}
                >
                  確認評分
                </button>
              </>
            )}
            {stage >= 1 && <span className="rs-published">✓ 結果已公布</span>}
            <button type="button" className="arena-tool-btn" onClick={onBackHome}>回首頁</button>
          </div>
        </header>

        <div className="rs-tabs td-tabs" role="tablist">
          {TABS.map((item) => (
            <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => setTab(item.id)}>
              {item.label}
              {item.id === 'grade' && adjustedCount > 0 && <i>{adjustedCount} 隊調整</i>}
              {item.id === 'overview' && !published && <i>未解鎖</i>}
            </button>
          ))}
        </div>

        {tab === 'overview' && !published && (
          <section className="arena-panel rs-locked" aria-label="名次尚未產生">
            <div className="rs-locked-icon" aria-hidden="true">?</div>
            <h3>名次還沒有產生</h3>
            <p>要等你在「評分作業」看完 AI 的評分，按下上方的 <b>確認評分</b> 或 <b>跳過評分</b>，才會計算最終排名並產生總覽。</p>
            <ul className="rs-locked-list">
              {teams.map((team) => (
                <li className={teamAdjustment(team) !== 0 ? 'done' : ''} key={team.id}>
                  <b>{team.name}</b>
                  <span>{adjustmentMissingReason(team) ? '有加減分・缺理由' : teamAdjustment(team) !== 0 ? `老師調整 ${teamAdjustment(team) > 0 ? '+' : ''}${teamAdjustment(team)}` : '未調整'}</span>
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
                <div><h3>名次揭曉</h3><p>{revealed === 0 ? '按下「揭曉名次」依序揭曉第三、第二、第一名' : '前三名已公布給學生端'}</p></div>
              </div>
              <Podium ranked={ranked} revealed={revealed} onReveal={revealPodium} />
              <div className="rs-others">
                {ranked.slice(3).map((item) => (
                  <span key={item.team.id}><b>{item.rank}</b>{item.team.name}<small>{item.scores.total.toFixed(1)}</small></span>
                ))}
              </div>
            </section>

            {revealed >= 3 && (
            <div className="rs-kpis">
              <div><span>全班平均總分</span><b>{avgTotal.toFixed(1)}</b></div>
              <div><span>最高分</span><b>{ranked[0].scores.total.toFixed(1)}</b></div>
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

            {section === 'highlights' && (
              <div className="rs-section-body" key="highlights">
            <section className="arena-panel" aria-labelledby="hl-heading">
              <div className="arena-section-heading compact-heading">
                <div><p className="arena-section-kicker">HIGHLIGHTS</p><h3 id="hl-heading">賽後亮點</h3><p>取自各隊對話紀錄，課堂檢討時可以直接念出來</p></div>
              </div>
              <div className="rs-awards">
                {RESULT_HIGHLIGHTS.map((award) => (
                  <article className={`rs-award tone-${award.key}`} key={award.key}>
                    <div className="rs-award-top"><span aria-hidden="true">{award.icon}</span><b>{award.title}</b></div>
                    <div className="rs-award-who">{award.team}・{award.who}</div>
                    <blockquote>{award.quote}</blockquote>
                    <small>{award.reason}</small>
                  </article>
                ))}
              </div>
            </section>
              </div>
            )}

            {section === 'insights' && (
              <div className="rs-section-body" key="insights">
            <section className="arena-panel" aria-labelledby="insight-heading">
              <div className="arena-section-heading compact-heading">
                <div><p className="arena-section-kicker">TEACHING INSIGHTS</p><h3 id="insight-heading">下堂課建議</h3><p>由這場競賽的結果整理出來的教學重點</p></div>
              </div>
              <div className="rs-insights">
                <div className="rs-insight">
                  <span className="rs-insight-tag">全班偏弱向度</span>
                  <b>{weakest.key} {weakest.label}　平均 {classAvg4D[weakest.key].toFixed(0)} 分</b>
                  <p>可安排「查證 AI 說法」「質疑推論」這類小練習，讓學生實際對一段 AI 回答做查核。</p>
                </div>
                <div className="rs-insight warn">
                  <span className="rs-insight-tag">幻覺陷阱</span>
                  {hallucinationTeams.length === 0 ? <b>這場沒有隊伍被扣幻覺分</b> : (
                    <>
                      <b>「{activeHallucinations(hallucinationTeams[0])[0].text}」</b>
                      <p>{hallucinationTeams.map((t) => t.name).join('、')}採用了這個說法，適合拿來示範：數字沒有出處就不能直接引用。</p>
                    </>
                  )}
                </div>
                <div className="rs-insight gap">
                  <span className="rs-insight-tag">全班漏洞</span>
                  {gaps.length === 0 ? <b>每個面向至少有一隊涵蓋</b> : (
                    <>
                      <b>{gaps.map((g) => g.dim).join('、')}</b>
                      <p>全班都沒有隊伍談到，可以在課堂上帶討論，或當作下一次競賽的引導重點。</p>
                    </>
                  )}
                </div>
              </div>
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
                <div><h3 id="rank-heading">最終排名</h3><p>排名分數 ＝ 各回合（解方分數 ＋ 組 4D 分數）的平均，滿分 200；最終排名分數 ＝ 排名分數 ＋ 老師調整（±10）</p></div>
              </div>
              <div className="rs-table-wrap">
                <table className="rs-table">
                  <thead><tr><th>名次</th><th>隊伍</th><th>解方（回合平均）</th><th>4D（回合平均）</th><th>排名分數（滿分 200）</th><th>老師調整</th><th>最終分數</th></tr></thead>
                  <tbody>
                    {ranked.map((item) => (
                      <tr key={item.team.id} className={item.rank === 1 ? 'first' : ''}>
                        <td className="rs-rk">{item.rank}</td>
                        <td><b>{item.team.name}</b><small>{item.team.members.join('、')}</small></td>
                        <td>{item.scores.solutionAvg.toFixed(1)}</td>
                        <td>{item.scores.fourDAvg.toFixed(1)}</td>
                        <td>{item.scores.rankScore.toFixed(1)}</td>
                        <td>
                          {item.scores.adjustment === 0 ? '—' : <b className={item.scores.adjustment > 0 ? 'rs-adj plus' : 'rs-adj minus'}>{item.scores.adjustment > 0 ? '+' : ''}{item.scores.adjustment}</b>}
                          {item.team.adjustReason && <small>{item.team.adjustReason}</small>}
                        </td>
                        <td className="rs-total-cell">{item.scores.total.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
              </div>
            )}
          </div>
        )}

        {tab === 'grade' && <ResultsGrading items={gradingItems} published={published} classAvg4D={classAvg4D} onUpdate={updateTeam} />}

        {tab === 'kmap' && (
          <section className="arena-panel rs-kmap-panel">
            <FinalKnowledgeMap teams={teams} caseName={caseName} />
          </section>
        )}
      </section>
    </div>
  )
}
