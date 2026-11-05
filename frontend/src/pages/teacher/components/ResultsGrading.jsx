import { Fragment, useEffect, useRef, useState } from 'react'
import RadarChart from './RadarChart.jsx'
import { ADJUST_LIMIT, DIM_4D, DIM_4D_MAX } from '../data.js'
import { RANKINGS, priorityItems, teamAdjustment, teamHasReview, beyondBaseline } from '../scoring.js'
import { playToggle } from '../sound.js'

const LEVELS = [
  { value: 0, title: '沒提到' },
  { value: 1, title: '有提到但只是帶過' },
  { value: 2, title: '有具體做法或說明' },
]

const signed = (n) => (n > 0 ? `+${n}` : `${n}`)

/*
  收合區塊：標題列永遠看得到（區塊名稱＋一句重點數字），點一下才展開裡面的細節，
  讓整頁一眼看得完。tone="warn" 是需要老師注意的區塊（琥珀色）。
*/
function Section({ id, title, summary, open, onToggle, tone, children }) {
  return (
    <section className={`rs-acc${open ? ' open' : ''}${tone ? ` ${tone}` : ''}`}>
      <button type="button" className="rs-acc-head" aria-expanded={open} aria-controls={`rs-acc-${id}`} onClick={() => onToggle(id)}>
        <span className="rs-acc-title">{title}</span>
        <span className="rs-acc-summary">{summary}</span>
        <svg className="rs-acc-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && <div className="rs-acc-body" id={`rs-acc-${id}`}>{children}</div>}
    </section>
  )
}

function RoundSwitch({ rounds, value, onChange }) {
  return (
    <div className="rs-round-switch" role="tablist" aria-label="選擇回合">
      {rounds.map((_, i) => (
        <button type="button" role="tab" aria-selected={value === i} className={value === i ? 'on' : ''} key={i} onClick={() => onChange(i)}>第 {i + 1} 回合</button>
      ))}
    </div>
  )
}

/*
  評分作業：左邊是隊伍清單，進去是該隊的評分明細。依 docs/scoring-design.md：
  分數都是評分 AI 的判斷加上公式算出來的，老師不能改 AI 的判斷；老師只做兩件事——
  看 AI 標記的項目作參考，並在「解方排名分數」與「4D 排名分數」上分開加減分（各 ±10 以內、評語選填，也可以不調整）。
  兩個排名分開，不相加（docs/scoring-design.md 七、八）。
*/
const PRIORITY_GROUPS = [
  { key: 'solution', label: '解方', note: 'A 基本要求缺項、不確定的面向、待查證與幻覺扣分' },
  { key: 'fourD', label: '4D', note: '「不確定」的指標、盡-1 資安與隱私扣分' },
]

function GradingDetail({ current, published, classAvg4D, fourDLevels, savedAt, onUpdate, onBack }) {
  const { team, scores } = current
  const [showFormula, setShowFormula] = useState(false)
  const formulaRef = useRef(null)
  const [roundView, setRoundView] = useState(0)
  const [memberView, setMemberView] = useState(team.members[0])
  const locked = published
  const items = priorityItems(team)
  const levelRow = fourDLevels.teams.find((t) => t.id === team.id)
  // 預設展開「老師評分」，有 AI 標記時也展開標記清單
  // 不再有組內投票，「小組最終回答」區塊先拿掉（老師端要呈現什麼樣的答案還沒決定，2026-10-24）
  const [openSecs, setOpenSecs] = useState(() => new Set(items.length > 0 ? ['priority', 'teacher'] : ['teacher']))
  const sectionIds = ['priority', 'teacher', 'rounds', 'fourD', 'solution', 'peer']
  const allOpen = sectionIds.every((id) => openSecs.has(id))
  const round = team.rounds[roundView]
  const roundScore = scores.rounds[roundView]

  useEffect(() => {
    if (!showFormula) return undefined
    function onDown(e) {
      if (formulaRef.current && !formulaRef.current.contains(e.target)) setShowFormula(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setShowFormula(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showFormula])

  function update(fn) { onUpdate(team.id, fn) }

  function toggleSection(id) {
    setOpenSecs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const secProps = (id) => ({ id, open: openSecs.has(id), onToggle: toggleSection })

  // 用函式更新目前值，連點幾下也不會漏算；kind 是 'solution' 或 'fourD'，兩個調整分開
  function bumpAdjustment(kind, delta) {
    const { adjustKey } = RANKINGS.find((r) => r.key === kind)
    update((t) => ({ ...t, [adjustKey]: Math.max(-ADJUST_LIMIT, Math.min(ADJUST_LIMIT, teamAdjustment(t, kind) + delta)) }))
    playToggle()
  }

  return (
    <div className="rs-grading">
      <div className="arena-panel rs-detail">
        <button type="button" className="rs-back" onClick={onBack}>← 回到所有隊伍</button>
        <header className="rs-detail-head">
          <div>
            <p className="arena-section-kicker">TEAM REVIEW</p>
            <h3>{team.name}</h3>
            <small>{team.members.join('、')}</small>
          </div>
          <div className="rs-total" ref={formulaRef}>
            <span>
              最終排名分數（兩個排名分開）
              <button type="button" className="rs-info-btn" aria-label="查看分數怎麼算" aria-expanded={showFormula} onClick={() => setShowFormula((v) => !v)}>i</button>
            </span>
            <div className="rs-total-pair">
              {RANKINGS.map((r, i) => (
                <Fragment key={r.key}>
                  {i > 0 && <i className="rs-total-sep" aria-hidden="true">/</i>}
                  <div><small>{r.short}</small><b>{scores[r.key].final.toFixed(1)}</b></div>
                </Fragment>
              ))}
            </div>
            {showFormula && (
              <div className="rs-formula" role="dialog" aria-label="分數計算方式">
                <h5>分數怎麼算？<small>以下數字是 {team.name} 目前的實際分數</small></h5>
                <div className="rs-formula-step">
                  <b>① 每回合的兩個分數（各滿分 100，分開排名、不相加）</b>
                  {scores.rounds.map((r, i) => (
                    <p key={i}>第 {i + 1} 回合：解方 <em>{r.solution.total.toFixed(1)}</em>・4D <em>{r.fourD.total.toFixed(1)}</em></p>
                  ))}
                  <ul>
                    <li>解方分數 ＝ B 涵蓋面向（90）＋ C 新面向加分 − A 基本要求缺項扣分 − D 幻覺扣分；B 只算超出基準答案（直接問 AI 就有的內容）的部分</li>
                    <li>組 4D 分數 ＝ 組員個人 4D 的平均，四個維度各最高 25 分</li>
                  </ul>
                </div>
                <div className="rs-formula-step">
                  <b>② 排名分數 ＝ 各回合分數的平均</b>
                  {RANKINGS.map((r) => <p className="eq" key={r.key}>{r.short}：<em>{scores[r.key].rankScore.toFixed(1)}</em></p>)}
                </div>
                <div className="rs-formula-step">
                  <b>③ 最終排名分數 ＝ 排名分數 ＋ 老師調整（各自 ±{ADJUST_LIMIT}）</b>
                  {RANKINGS.map((r) => {
                    const sc = scores[r.key]
                    return <p key={r.key}>{r.short}：<em>{sc.rankScore.toFixed(1)}</em> {sc.adjustment >= 0 ? '＋' : '−'} <em>{Math.abs(sc.adjustment)}</em> ＝ <em>{sc.final.toFixed(1)}</em></p>
                  })}
                </div>
                <p className="rs-formula-note">老師不能改 AI 的判斷，只能在兩個排名分數上分開加減分（可以只調一個，評語選填，也可以跳過不調整）。互評是各組給的文字留言，不計分。</p>
              </div>
            )}
          </div>
        </header>

        <div className="rs-acc-tools">
          <span>點標題列展開或收合各區塊</span>
          <button type="button" onClick={() => setOpenSecs(allOpen ? new Set() : new Set(sectionIds))}>{allOpen ? '全部收合' : '全部展開'}</button>
        </div>

        <Section {...secProps('priority')} tone={items.length > 0 ? 'warn' : undefined} title="評分 AI 的標記（供參考）" summary={items.length > 0 ? `${items.length} 項` : '沒有'}>
          {items.length === 0 ? <p className="rs-none">這一隊沒有需要特別參考的標記。</p> : (
            <>
              <p className="rs-priority-note">以下是評分 AI 沒把握、或判定有問題的地方，不用逐項確認，供你決定要不要加減分。解方類對應解方調整、4D 類對應 4D 調整。</p>
              {PRIORITY_GROUPS.map((group) => {
                const list = items.filter((item) => item.group === group.key)
                return (
                  <div className="rs-priority-group" key={group.key}>
                    <h5 className="rs-sub">{group.label}類　<em>{list.length} 項</em><small>{group.note}</small></h5>
                    {list.length === 0 ? <p className="rs-none">沒有。</p> : (
                      <ul className="rs-priority-list">
                        {list.map((item) => (
                          <li key={item.key}>
                            <span className="rs-kind">{item.kind}</span>
                            <div>
                              <b>{item.title}</b>
                              <span>{item.round}・{item.desc}{item.penalty ? `（已扣 ${item.penalty} 分）` : ''}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </Section>

        <Section {...secProps('teacher')} title="老師評分（加／減分）" summary={teamHasReview(team) ? RANKINGS.map((r) => `${r.short} ${signed(teamAdjustment(team, r.key))}`).join('・') : '未調整（維持 AI 分數）'}>
          <p className="rs-priority-note">在 AI 算出的解方、4D 排名分數上分開加減分，各 ±{ADJUST_LIMIT} 分，可以只調一個。評語選填，有寫才會顯示在這一隊的「老師評價」。改了就自動儲存；不想調整就維持 0，沒調整的隊伍維持 AI 分數。</p>
          {RANKINGS.map((r) => {
            const sc = scores[r.key]
            return (
              <div className="rs-adjust" key={r.key}>
                <span className="rs-adjust-label">{r.label}</span>
                <div className="rs-adjust-stepper" role="group" aria-label={`${r.label}調整分數`}>
                  <button type="button" aria-label={`${r.short}減 1 分`} disabled={locked || sc.adjustment <= -ADJUST_LIMIT} onClick={() => bumpAdjustment(r.key, -1)}>−</button>
                  <b className={sc.adjustment > 0 ? 'plus' : sc.adjustment < 0 ? 'minus' : ''}>{signed(sc.adjustment)}</b>
                  <button type="button" aria-label={`${r.short}加 1 分`} disabled={locked || sc.adjustment >= ADJUST_LIMIT} onClick={() => bumpAdjustment(r.key, 1)}>＋</button>
                </div>
                <div className="rs-adjust-calc">
                  <span>AI 排名分數</span><b>{sc.rankScore.toFixed(1)}</b>
                  <span>{sc.adjustment >= 0 ? '＋' : '−'} 調整</span><b>{Math.abs(sc.adjustment)}</b>
                  <span>＝ 最終</span><b className="final">{sc.final.toFixed(1)}</b>
                </div>
              </div>
            )
          })}
          <label className="rs-field">
            <span>老師評語（選填）</span>
            <textarea
              value={team.teacherNote}
              disabled={locked}
              placeholder="可以說明為什麼加分或扣分，例如：員工溝通面處理得特別細膩，AI 評分沒有完全反映。"
              onChange={(e) => update((t) => ({ ...t, teacherNote: e.target.value }))}
            />
          </label>
          {/* 加減分、評語一改就自動存成草稿（對應 PUT …/teacher-review），這裡顯示最後一次自動儲存的時間 */}
          {!locked && (
            <p className={`rs-autosave${savedAt ? ' saved' : ''}`} role="status">
              {savedAt ? `✓ 已自動儲存（${new Date(savedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}）` : '調整分數或寫評語後會自動儲存，不用另外按存檔。'}
            </p>
          )}
        </Section>

        <Section {...secProps('rounds')} title="各回合分數" summary={RANKINGS.map((r) => `${r.short}平均 ${scores[r.key].rankScore.toFixed(1)}`).join('・')}>
          <div className="rs-rounds">
            {team.rounds.map((r, i) => {
              const sc = scores.rounds[i]
              return (
                <article className="rs-round" key={i}>
                  <header>
                    <b>第 {i + 1} 回合</b>
                    <span>解方 <em>{sc.solution.total.toFixed(1)}</em>・4D <em>{sc.fourD.total.toFixed(1)}</em>（各滿分 100）</span>
                  </header>
                  <dl>
                    <div><dt>解方分數</dt><dd>{sc.solution.total.toFixed(1)}<small>　B {sc.solution.b.toFixed(1)}・C +{sc.solution.c}・A 缺項 −{sc.solution.aPenalty}・D −{sc.solution.d}</small></dd></div>
                    <div><dt>組 4D 分數</dt><dd>{sc.fourD.total.toFixed(1)}<small>　{DIM_4D.map((d) => `${d.key} ${sc.fourD.dims[d.key].toFixed(1)}`).join('・')}（各維度滿分 {DIM_4D_MAX}）</small></dd></div>
                  </dl>
                </article>
              )
            })}
          </div>
        </Section>

        <Section {...secProps('fourD')} title="4D 能力" summary={`各回合平均 ${scores.fourD.rankScore.toFixed(1)} / 100`}>
          <div className="rs-radar-box">
            <RadarChart values={scores.fourDPercent} compare={classAvg4D} />
            <div className="rs-radar-legend"><span><i className="team" />{team.name}（各回合平均）</span><span><i className="avg" />全班平均</span></div>
          </div>
          <h5 className="rs-sub">三個層級比較<small>各回合平均；比較這組與全班、組內每位同學的差異</small></h5>
          <table className="rs-4d-table rs-4d-levels">
            <thead><tr><th>層級</th>{DIM_4D.map((d) => <th key={d.key}>{d.key} {d.label}</th>)}<th>4D 總分</th></tr></thead>
            <tbody>
              <tr className="class-row">
                <td>全班平均</td>
                {DIM_4D.map((d) => <td key={d.key}>{fourDLevels.class[d.key].toFixed(1)}</td>)}
                <td className="total">{fourDLevels.class.total.toFixed(1)}</td>
              </tr>
              <tr className="group">
                <td>{team.name}平均</td>
                {DIM_4D.map((d) => {
                  const diff = levelRow[d.key] - fourDLevels.class[d.key]
                  return <td key={d.key}>{levelRow[d.key].toFixed(1)}<small className={diff >= 0 ? 'up' : 'down'}>{diff >= 0 ? '+' : ''}{diff.toFixed(1)}</small></td>
                })}
                <td className="total">{levelRow.total.toFixed(1)}</td>
              </tr>
              {levelRow.members.map((m) => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  {DIM_4D.map((d) => <td key={d.key}>{m[d.key].toFixed(1)}</td>)}
                  <td className="total">{m.total.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h5 className="rs-sub">各回合明細</h5>
          <RoundSwitch rounds={team.rounds} value={roundView} onChange={setRoundView} />
          <p className="rs-vote-note">小組 4D ＝ 組員個人 4D 的平均；每位組員每回合各評一次，四個維度各最高 {DIM_4D_MAX} 分。</p>
          <table className="rs-4d-table">
            <thead><tr><th>組員</th>{DIM_4D.map((d) => <th key={d.key}>{d.key} {d.label}</th>)}<th>個人 4D</th></tr></thead>
            <tbody>
              {roundScore.fourD.members.map((m) => (
                <tr key={m.name}>
                  <td>{m.name}{m.privacyHit && <em className="uncertain" title="盡-1 資安與隱私：盡責維度 −5">盡-1 −5</em>}</td>
                  {DIM_4D.map((d) => <td key={d.key}>{m.dims[d.key].toFixed(1)}</td>)}
                  <td className="total">{m.total.toFixed(1)}</td>
                </tr>
              ))}
              <tr className="group">
                <td>小組（平均）</td>
                {DIM_4D.map((d) => <td key={d.key}>{roundScore.fourD.dims[d.key].toFixed(1)}</td>)}
                <td className="total">{roundScore.fourD.total.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
          <h5 className="rs-sub">個人 4D 評語</h5>
          <div className="rs-round-switch" role="tablist" aria-label="選擇組員">
            {roundScore.fourD.members.map((m) => (
              <button type="button" role="tab" aria-selected={memberView === m.name} className={memberView === m.name ? 'on' : ''} key={m.name} onClick={() => setMemberView(m.name)}>{m.name}</button>
            ))}
          </div>
          <div className="rs-4d-comments">
            {DIM_4D.map((d) => {
              const member = roundScore.fourD.members.find((m) => m.name === memberView) ?? roundScore.fourD.members[0]
              return <div key={d.key}><b>{d.key} {d.label}　{member.dims[d.key].toFixed(1)} / {DIM_4D_MAX}</b><p>{round.memberFourDComments[member.name][d.key]}</p></div>
            })}
          </div>
        </Section>

        <Section {...secProps('solution')} title="AI 解方評分明細" summary={`解方平均 ${scores.solution.rankScore.toFixed(1)} / 100`}>
          <RoundSwitch rounds={team.rounds} value={roundView} onChange={setRoundView} />

          <h5 className="rs-sub">A 基本要求（門檻）　<em>{roundScore.solution.aPenalty === 0 ? '通過' : `−${roundScore.solution.aPenalty}`}</em><small>不給分，缺一項扣 10</small></h5>
          {[['stance', '立場明確'], ['measures', '有提出具體配套措施']].map(([key, label]) => (
            <div className="rs-check static" key={key}>
              <span className={`rs-mark ${round[key].ok ? 'ok' : 'no'}`} aria-label={round[key].ok ? '符合' : '不符合'}>{round[key].ok ? '✓' : '✕'}</span>
              <span><b>{label}</b><small>{round[key].quote ? `「${round[key].quote}」` : '解方中找不到對應內容'}</small></span>
              <i>{round[key].ok ? '通過' : '−10'}</i>
            </div>
          ))}

          <h5 className="rs-sub">B 涵蓋面向　<em>{roundScore.solution.b.toFixed(1)} / 90</em><small>只算超出基準答案的部分：{roundScore.solution.earned} ÷ {roundScore.solution.room} × 90</small></h5>
          <p className="rs-vote-note">基準 ＝ 不用任何 4D 技巧、直接把題目丟給 AI 就會問到的程度。每個面向得分 ＝ 涵蓋程度 − 基準（最低 0）；基準已經是 2 的面向不列入。</p>
          <ul className="rs-cov">
            {round.coverage.map((item) => (
              <li key={item.dim} className={item.baselineLevel >= 2 ? 'skipped' : ''}>
                <div className="rs-cov-main">
                  <b>
                    {item.dim}
                    {item.uncertain && <em className="uncertain">不確定</em>}
                    {item.level > 0 && (beyondBaseline(item)
                      ? <em className="beyond">超出基本提問</em>
                      : <em className="basic">基本提問就有</em>)}
                  </b>
                  <small>{item.quote ? `「${item.quote}」` : '解方中沒有提到'}</small>
                  <small className="rs-cov-base">基準 {item.baselineLevel}・{item.baselineLevel >= 2 ? '不列入計算' : `得分 ${Math.max(0, item.level - item.baselineLevel)} / ${2 - item.baselineLevel}`}</small>
                </div>
                <div className="rs-seg readonly" role="img" aria-label={`涵蓋深度 ${item.level}：${LEVELS[item.level].title}`} title={LEVELS[item.level].title}>
                  {LEVELS.map((level) => <span key={level.value} className={item.level === level.value ? 'active' : ''}>{level.value}</span>)}
                </div>
              </li>
            ))}
          </ul>

          <h5 className="rs-sub">C 新面向加分　<em>+{roundScore.solution.c}</em><small>不含基準答案就有的新面向</small></h5>
          {round.bonusDims.length === 0 ? <p className="rs-none">沒有官方清單外的新面向。</p> : round.bonusDims.map((dim) => (
            <div className="rs-check static" key={dim.dim}>
              <span className={`rs-mark ${dim.active ? 'ok' : 'no'}`}>{dim.active ? '✓' : '✕'}</span>
              <span><b>{dim.dim}</b><small>{dim.reason}</small></span>
              <i>{dim.active ? '+5' : '0'}</i>
            </div>
          ))}

          <h5 className="rs-sub">D 幻覺扣分　<em>−{roundScore.solution.d}</em></h5>
          {round.flags.length === 0 ? <p className="rs-none">沒有幻覺或待查證標記。</p> : round.flags.map((flag, idx) => (
            <div className="rs-check static flag" key={idx}>
              <span className={`rs-mark ${flag.active ? 'no' : 'warn'}`}>{flag.active ? '!' : '?'}</span>
              <span><b>{flag.type}：{flag.text}</b><small>{flag.reason}</small></span>
              <i>{flag.penalty === 0 ? '標記' : `−${flag.penalty}`}</i>
            </div>
          ))}

          <div className="rs-comment ai"><span>AI 評語（第 {roundView + 1} 回合）</span><p>{round.aiComment}</p></div>
        </Section>

        <Section {...secProps('peer')} title="各組互評留言" summary={`${team.peerComments.length} 則（不計分）`}>
          <p className="rs-vote-note">其他小組留給這一隊的文字評論，只是回饋，不計分。</p>
          <ul className="rs-comments">
            {team.peerComments.map((c) => (
              <li key={c.from}>
                <span className="rs-peer-from">{c.from}</span>
                <p>{c.comment}</p>
              </li>
            ))}
          </ul>
        </Section>

        <footer className="rs-confirm">
          <span>{locked ? '結果已公布，不能再修改老師評分。' : '調整會自動儲存。看完所有隊伍後，到上方按「確認評分」公布；不調整也可以直接確認。'}</span>
          <button type="button" className="hint-btn ghost sm" onClick={onBack}>回到所有隊伍</button>
        </footer>
      </div>
    </div>
  )
}

/*
  評分作業先列出所有隊伍的大按鈕，點選其中一隊才會展開該隊的評分明細，
  明細頁用「回到所有隊伍」返回，避免把隊伍清單固定卡在旁邊。
*/
export default function ResultsGrading({ items, published, classAvg4D, fourDLevels, savedAt, onUpdate }) {
  const [selectedId, setSelectedId] = useState(null)
  const current = items.find((item) => item.team.id === selectedId)

  if (current) {
    return (
      <GradingDetail
        current={current}
        published={published}
        classAvg4D={classAvg4D}
        fourDLevels={fourDLevels}
        savedAt={savedAt[current.team.id]}
        onUpdate={onUpdate}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <section className="arena-panel rs-pick" aria-label="選擇隊伍">
      <div className="rs-pick-head">
        <div>
          <p className="arena-section-kicker">CHOOSE A TEAM</p>
          <h3>選擇要查看的隊伍</h3>
          <p>點選任一隊，查看 AI 的評分與標記，並在解方、4D 兩個排名分數上分開加減分（也可以不調整）。</p>
        </div>
      </div>
      <div className="rs-pick-grid">
        {items.map((item) => {
          const { team, scores } = item
          const flagCount = priorityItems(team).length
          return (
            <button type="button" key={team.id} className={`rs-pick-card${teamHasReview(team) ? ' confirmed' : ''}`} onClick={() => setSelectedId(team.id)}>
              <span className="rs-pick-mark">{team.id}</span>
              <b className="rs-pick-name">{team.name}</b>
              <small className="rs-pick-members">{team.members.join('、')}</small>
              <span className="rs-pick-total">{RANKINGS.map((r) => <span key={r.key}><small>{r.short} </small>{scores[r.key].rankScore.toFixed(1)}</span>)}<small>（AI，各滿分 100）</small></span>
              <span className={`rs-pick-status${teamHasReview(team) ? ' done' : ''}`}>
                {teamHasReview(team) ? `老師調整・${RANKINGS.map((r) => `${r.short} ${signed(scores[r.key].adjustment)}`).join('・')}` : '未調整（維持 AI 分數）'}
              </span>
              <span className="rs-pick-flags">{flagCount > 0 ? `AI 標記 ${flagCount} 項` : '無標記'}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
