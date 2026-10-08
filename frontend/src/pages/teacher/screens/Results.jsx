import { useEffect, useRef, useState } from 'react'
import Podium from '../components/Podium.jsx'
import ResultsGrading from '../components/ResultsGrading.jsx'
import FinalKnowledgeMap from '../components/FinalKnowledgeMap.jsx'
import { RESULT_TEAMS, RESULT_HIGHLIGHTS, DIM_4D, TEAMS, SCORE_MAX } from '../data.js'
import { rankTeams, buildFinalMap } from '../scoring.js'
import { IconSparkStar, IconBulb, IconTrophy } from '../icons.jsx'
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
]

const PART_COLORS = { ai: '#C5F36B', peer: '#6EA8FF', bonus: '#B58CFF' }

export default function Results({ caseName, onBackHome, onToast }) {
  const [tab, setTab] = useState('grade')
  const [teams, setTeams] = useState(() => RESULT_TEAMS.map((team) => ({ ...team, confirmed: false, reviewed: {} })))
  const [stage, setStage] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [menuCount, setMenuCount] = useState(0)
  const [section, setSection] = useState(null)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  // 頒獎台揭曉完之後，三個按鈕依序冒出來
  useEffect(() => {
    if (revealed < 3) return undefined
    const ids = [500, 1200, 1900].map((delay, idx) => window.setTimeout(() => {
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
  const confirmedCount = teams.filter((t) => t.confirmed).length
  const allConfirmed = confirmedCount === teams.length
  // 評分作業一律依隊伍順序排列、不顯示名次（名次只在「總覽」、且全部確認後才出現）
  const gradingItems = teams.map((team) => ranked.find((item) => item.team.id === team.id))
  const finalMap = buildFinalMap(teams)

  const classAvg4D = Object.fromEntries(DIM_4D.map((dim) => [dim.key, teams.reduce((sum, t) => sum + t.fourD[dim.key], 0) / teams.length]))
  const avgTotal = ranked.reduce((sum, item) => sum + item.scores.total, 0) / ranked.length
  const hallucinationTeams = teams.filter((t) => t.flags.some((f) => f.active && f.penalty > 0))
  const avgExchanges = TEAMS.reduce((sum, t) => sum + t.exchanges, 0) / TEAMS.length
  const official = finalMap.filter((r) => r.origin === 'official')
  const coverageRate = Math.round((official.filter((r) => r.covered.length > 0).length / official.length) * 100)
  const weakest = DIM_4D.reduce((min, dim) => (classAvg4D[dim.key] < classAvg4D[min.key] ? dim : min), DIM_4D[0])
  const gaps = finalMap.filter((r) => r.covered.length === 0)

  function updateTeam(id, fn) {
    setTeams((list) => list.map((team) => (team.id === id ? fn(team) : team)))
  }

  function revealPodium() {
    if (!allConfirmed || stage >= 1) return
    setStage(1)
    setRevealed(0)
    ;[300, 1300, 2500].forEach((delay, idx) => {
      timers.current.push(window.setTimeout(() => {
        setRevealed(idx + 1)
        if (idx === 2) playUnlock()
        else playSuccess()
      }, delay))
    })
    onToast('階段一：已公布 AI 評定的名次，學生端可以看到前三名。')
  }

  function publishFinal() {
    if (stage !== 1 || !allConfirmed) return
    setStage(2)
    playUnlock()
    onToast('階段二：已公布各隊總分、互評與老師評語。')
  }

  const steps = [
    { label: '覆核 AI 評分', done: allConfirmed, note: `${confirmedCount} / ${teams.length} 隊已確認` },
    { label: '公布名次', done: stage >= 1, note: '階段一・AI 評定的名次' },
    { label: '公布總分與評語', done: stage >= 2, note: '階段二・含互評與老師評價' },
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
              <button type="button" className="hint-btn rs-primary" onClick={revealPodium} disabled={!allConfirmed} title={allConfirmed ? '' : '要先在「評分作業」確認每一隊的成績，才會產生名次'}>
                公布名次（階段一）
              </button>
            )}
            {stage === 1 && (
              <button type="button" className="hint-btn rs-primary" onClick={publishFinal} disabled={!allConfirmed} title={allConfirmed ? '' : '請先在「評分作業」確認每一隊的成績'}>
                公布總分與評語（階段二）
              </button>
            )}
            {stage === 2 && <span className="rs-published">✓ 結果已全部公布</span>}
            <button type="button" className="arena-tool-btn" onClick={onBackHome}>回首頁</button>
          </div>
        </header>

        <div className="rs-tabs td-tabs" role="tablist">
          {TABS.map((item) => (
            <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => setTab(item.id)}>
              {item.label}
              {item.id === 'grade' && <i>{confirmedCount}/{teams.length}</i>}
              {item.id === 'overview' && !allConfirmed && <i>未解鎖</i>}
            </button>
          ))}
        </div>

        {tab === 'overview' && !allConfirmed && (
          <section className="arena-panel rs-locked" aria-label="名次尚未產生">
            <div className="rs-locked-icon" aria-hidden="true">?</div>
            <h3>名次還沒有產生</h3>
            <p>要等每一隊的成績都在「評分作業」確認後，才會產生名次與總覽。目前 <b>{confirmedCount} / {teams.length}</b> 隊已確認。</p>
            <ul className="rs-locked-list">
              {teams.map((team) => (
                <li className={team.confirmed ? 'done' : ''} key={team.id}>
                  <b>{team.name}</b><span>{team.confirmed ? '✓ 已確認' : '待確認'}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="hint-btn rs-primary" onClick={() => setTab('grade')}>前往評分作業 →</button>
          </section>
        )}

        {tab === 'overview' && allConfirmed && (
          <div className="rs-overview">
            <section className="arena-panel rs-podium-panel" aria-label="名次">
              <div className="arena-section-heading compact-heading">
                <div><h3>名次揭曉</h3><p>{stage === 0 ? '按下「公布名次」依序揭曉第三、第二、第一名' : '前三名已公布給學生端'}</p></div>
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
                      <b>「{hallucinationTeams[0].flags.find((f) => f.active && f.penalty > 0).text}」</b>
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

            {section === 'ranking' && (
              <div className="rs-section-body" key="ranking">
            <section className="arena-panel" aria-labelledby="rank-heading">
              <div className="arena-section-heading compact-heading">
                <div><h3 id="rank-heading">最終排名</h3><p>總分 = 解方分數 + 各組互評平均 + 個別加分（沒有權重，直接相加；4D 只供參考，不計入總分）</p></div>
              </div>
              <div className="rs-table-wrap">
                <table className="rs-table">
                  <thead><tr><th>名次</th><th>隊伍</th><th>解方分數</th><th>互評</th><th>4D（參考）</th><th>加分</th><th>分數組成</th><th>總分</th></tr></thead>
                  <tbody>
                    {ranked.map((item) => (
                      <tr key={item.team.id} className={item.rank === 1 ? 'first' : ''}>
                        <td className="rs-rk">{item.rank}</td>
                        <td><b>{item.team.name}</b><small>{item.team.members.join('、')}</small></td>
                        <td>{item.scores.solution.total.toFixed(1)}</td>
                        <td>{item.scores.peer.toFixed(1)}<small> / 10</small></td>
                        <td>{item.scores.fourD.toFixed(1)}</td>
                        <td>{item.team.bonusPoints > 0 ? `+${item.team.bonusPoints}` : '—'}</td>
                        <td>
                          <div className="rs-mini-bar">
                            {Object.keys(PART_COLORS).map((key) => <span key={key} style={{ width: `${Math.max(0, (item.scores.parts[key] / SCORE_MAX) * 100)}%`, background: PART_COLORS[key] }} />)}
                          </div>
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

        {tab === 'grade' && <ResultsGrading items={gradingItems} published={stage >= 1} classAvg4D={classAvg4D} onUpdate={updateTeam} />}

        {tab === 'kmap' && (
          <section className="arena-panel rs-kmap-panel">
            <FinalKnowledgeMap teams={teams} caseName={caseName} />
          </section>
        )}
      </section>
    </div>
  )
}
