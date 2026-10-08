import { useEffect, useRef, useState } from 'react'
import RadarChart from './RadarChart.jsx'
import { SCORE_MAX } from '../data.js'
import { priorityItems } from '../scoring.js'
import { playSuccess, playToggle } from '../sound.js'

const LEVELS = [
  { value: 0, label: '0', title: '沒提到' },
  { value: 1, label: '1', title: '有提到但只是帶過' },
  { value: 2, label: '2', title: '有具體做法或說明' },
]

const PART_META = [
  { key: 'ai', label: '解方分數', color: '#C5F36B' },
  { key: 'peer', label: '各組互評', color: '#6EA8FF' },
  { key: 'bonus', label: '個別加分', color: '#B58CFF' },
]

/*
  評分作業：左邊是隊伍清單，右邊是該隊的 AI 評分明細。老師不直接改總分，而是
  覆核 AI 的各項判斷（涵蓋深度、幻覺扣分等），總分由程式依公式即時重算；
  「不確定」與幻覺標記要先標示已覆核，才能確認這一隊的成績。
*/
/*
  小組最終投票：每位組員各有一份候選答案，組員互相投票選出「哪一份最好」，得票最多的就是
  這隊的最終回答（AI 只評這一份）。老師這裡只看最終勝出的那一份與它的票數，落選的答案不顯示；
  萬一同票，才會把同票的幾份都列出來（同票怎麼決定還沒定案）。
*/
function FinalVote({ votes }) {
  if (!votes || votes.length === 0) return null
  const total = votes.reduce((n, c) => n + c.voters.length, 0)
  const top = Math.max(...votes.map((c) => c.voters.length))
  const leaders = votes.filter((c) => c.voters.length === top)
  const tie = leaders.length > 1
  return (
    <section className="rs-vote" aria-label="小組最終投票">
      <h4>小組最終投票 <em>{tie ? `${leaders.map((c) => c.member).join('、')} 同票` : `${top} / ${total} 票`}</em></h4>
      <p className="rs-vote-note">{tie ? '目前同票，尚未選出最終回答。' : '組員投票選出的最終回答，AI 只針對這一份評分。'}</p>
      <ul>
        {leaders.map((c) => (
          <li className={tie ? '' : 'win'} key={c.member}>
            <span className="rs-vote-avatar" aria-hidden="true">{c.member.slice(0, 1)}</span>
            <div className="rs-vote-main">
              <div className="rs-vote-top">
                <b>{c.member} 的答案</b>
                {!tie && <span className="rs-vote-crown">最終回答</span>}
              </div>
              <p>{c.summary}</p>
              <div className="rs-vote-bar"><span style={{ width: `${total ? (c.voters.length / total) * 100 : 0}%` }} /></div>
              <div className="rs-vote-who">
                <small>投給這份答案：</small>
                {c.voters.map((v) => <span key={v}>{v}{v === c.member ? '（自己）' : ''}</span>)}
              </div>
            </div>
            <strong className="rs-vote-count">{c.voters.length}<small> 票</small></strong>
          </li>
        ))}
      </ul>
    </section>
  )
}

function GradingDetail({ current, published, classAvg4D, onUpdate, onBack }) {
  const [showFormula, setShowFormula] = useState(false)
  const formulaRef = useRef(null)
  const { team, scores } = current
  const locked = team.confirmed
  const priority = priorityItems(team)
  const pending = priority.filter((item) => !team.reviewed[item.key]).length

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

  function toggleConfirm() {
    update((t) => ({ ...t, confirmed: !t.confirmed }))
    if (team.confirmed) {
      playToggle()
    } else {
      playSuccess()
      onBack()
    }
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
              總分（程式依公式計算）
              <button type="button" className="rs-info-btn" aria-label="查看總分怎麼算" aria-expanded={showFormula} onClick={() => setShowFormula((v) => !v)}>i</button>
            </span>
            <b>{scores.total.toFixed(1)}</b>
            {showFormula && (
              <div className="rs-formula" role="dialog" aria-label="總分計算方式">
                <h5>總分怎麼算？<small>以下數字是 {team.name} 目前的實際分數</small></h5>
                <div className="rs-formula-step">
                  <b>① 解方分數（滿分 100）</b>
                  <p>A 基本要求 <em>{scores.solution.a}</em>（滿分 20）＋ B 涵蓋面向 <em>{scores.solution.b.toFixed(1)}</em>（滿分 70）＋ C 新面向加分 <em>{scores.solution.c}</em> − D 幻覺扣分 <em>{scores.solution.d}</em></p>
                  <p className="eq">＝ <em>{scores.solution.total.toFixed(1)}</em></p>
                  <ul>
                    <li>B ＝ 各面向分數加總 ÷（面向數 × 2）× 70</li>
                    <li>C：官方清單外的新面向，每個 +5，最多 +10</li>
                    <li>D：確認的幻覺，每個 −5，最多 −20</li>
                  </ul>
                </div>
                <div className="rs-formula-step">
                  <b>② 總分（沒有權重，直接相加）</b>
                  <p>解方分數 <em>{scores.parts.ai.toFixed(1)}</em></p>
                  <p>＋ 各組互評平均 <em>{scores.parts.peer.toFixed(1)}</em>（滿分 10，{team.peerRatings.length} 組給的分數取平均）</p>
                  <p>＋ 老師個別加分 <em>{scores.parts.bonus.toFixed(1)}</em></p>
                  <p className="eq">＝ <em>{scores.total.toFixed(1)}</em></p>
                </div>
                <p className="rs-formula-note">老師不能直接改總分，只能覆核 AI 的各項判斷，總分會依公式重算。4D 能力只當作能力指標顯示，不計入總分。</p>
              </div>
            )}
          </div>
        </header>

        <div className="rs-score-row">
          <div className="rs-compose">
            <h4>分數組成</h4>
            <div className="rs-compose-bar" role="img" aria-label="分數組成">
              {PART_META.map((part) => (
                <span key={part.key} style={{ width: `${Math.max(0, (scores.parts[part.key] / SCORE_MAX) * 100)}%`, background: part.color }} title={`${part.label} ${scores.parts[part.key].toFixed(1)}`} />
              ))}
            </div>
            <ul>
              {PART_META.map((part) => (
                <li key={part.key}>
                  <i style={{ background: part.color }} />
                  <span>{part.label}</span>
                  <b>{scores.parts[part.key].toFixed(1)}</b>
                </li>
              ))}
            </ul>
          </div>
          <div className="rs-radar-box">
            <h4>4D 能力</h4>
            <RadarChart values={team.fourD} compare={classAvg4D} />
            <div className="rs-radar-legend"><span><i className="team" />{team.name}</span><span><i className="avg" />全班平均</span></div>
          </div>
        </div>

        <FinalVote votes={team.finalVote} />

        <section className="rs-peer" aria-label="各組互評">
          <h4>各組互評 <em>平均 {scores.parts.peer.toFixed(1)} / 10</em></h4>
          <p className="rs-vote-note">其他小組給這一隊的分數（0～10 分）與留言，總分會把平均分數直接加進去。</p>
          <ul>
            {team.peerRatings.map((r) => (
              <li key={r.from}>
                <span className="rs-peer-from">{r.from}</span>
                <p>{r.comment}</p>
                <strong>{r.score}<small> / 10</small></strong>
              </li>
            ))}
          </ul>
        </section>

        {priority.length > 0 && (
          <section className="rs-priority" aria-label="需要你確認">
            <h4>需要你確認 <em>{pending > 0 ? `${pending} 項待處理` : '全部完成'}</em></h4>
            <p className="rs-priority-note">以下是 AI 沒把握的項目，確認後才能送出這一隊的成績。</p>
            <ul>
              {priority.map((item) => {
                const done = Boolean(team.reviewed[item.key])
                return (
                  <li className={done ? 'done' : ''} key={item.key}>
                    <span className="rs-kind">{item.kind}</span>
                    <div><b>{item.title}</b><span>{item.desc}</span></div>
                    <button type="button" disabled={locked} onClick={() => update((t) => ({ ...t, reviewed: { ...t.reviewed, [item.key]: !t.reviewed[item.key] } }))}>
                      {done ? '✓ 已覆核' : '標示已覆核'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="rs-block">
          <h4>A 基本要求 <em>{scores.solution.a} / 20</em></h4>
          {[['stance', '立場明確'], ['measures', '有提出具體配套措施']].map(([key, label]) => (
            <label className="rs-check" key={key}>
              <input type="checkbox" checked={team[key].ok} disabled={locked} onChange={() => update((t) => ({ ...t, [key]: { ...t[key], ok: !t[key].ok } }))} />
              <span><b>{label}</b><small>{team[key].quote ? `「${team[key].quote}」` : '解方中找不到對應內容'}</small></span>
              <i>{team[key].ok ? '+10' : '0'}</i>
            </label>
          ))}
        </section>

        <section className="rs-block">
          <h4>B 涵蓋面向 <em>{scores.solution.b.toFixed(1)} / 70</em></h4>
          <ul className="rs-cov">
            {team.coverage.map((item) => (
              <li key={item.dim}>
                <div className="rs-cov-main">
                  <b>{item.dim}{item.uncertain && <em className="uncertain">不確定</em>}</b>
                  <small>{item.quote ? `「${item.quote}」` : '解方中沒有提到'}</small>
                </div>
                <div className="rs-seg" role="radiogroup" aria-label={`${item.dim}涵蓋深度`}>
                  {LEVELS.map((level) => (
                    <button type="button" key={level.value} role="radio" aria-checked={item.level === level.value} title={level.title} disabled={locked}
                      className={item.level === level.value ? 'active' : ''}
                      onClick={() => update((t) => ({ ...t, coverage: t.coverage.map((c) => (c.dim === item.dim ? { ...c, level: level.value } : c)) }))}>
                      {level.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="rs-two">
          <section className="rs-block">
            <h4>C 新面向加分 <em>+{scores.solution.c}</em></h4>
            {team.bonusDims.length === 0 ? <p className="rs-none">沒有官方清單外的新面向。</p> : team.bonusDims.map((dim) => (
              <label className="rs-check" key={dim.dim}>
                <input type="checkbox" checked={dim.active} disabled={locked} onChange={() => update((t) => ({ ...t, bonusDims: t.bonusDims.map((d) => (d.dim === dim.dim ? { ...d, active: !d.active } : d)) }))} />
                <span><b>{dim.dim}</b><small>{dim.reason}</small></span>
                <i>+5</i>
              </label>
            ))}
          </section>
          <section className="rs-block">
            <h4>D 幻覺扣分 <em>−{scores.solution.d}</em></h4>
            {team.flags.length === 0 ? <p className="rs-none">沒有幻覺或待查證標記。</p> : team.flags.map((flag, idx) => (
              <label className="rs-check flag" key={idx}>
                <input type="checkbox" checked={flag.active} disabled={locked || flag.penalty === 0} onChange={() => update((t) => ({ ...t, flags: t.flags.map((f, i) => (i === idx ? { ...f, active: !f.active } : f)) }))} />
                <span><b>{flag.type}：{flag.text}</b><small>{flag.reason}</small></span>
                <i>{flag.penalty === 0 ? '標記' : `−${flag.penalty}`}</i>
              </label>
            ))}
          </section>
        </div>

        <section className="rs-block">
          <h4>評語與加分</h4>
          <div className="rs-comment ai"><span>AI 評語</span><p>{team.aiComment}</p></div>
          <label className="rs-field">
            <span>老師評語</span>
            <textarea value={team.teacherNote} disabled={locked} onChange={(e) => update((t) => ({ ...t, teacherNote: e.target.value }))} />
          </label>
          <label className="rs-field inline">
            <span>個別彈性加分</span>
            <input type="number" min="0" max="10" value={team.bonusPoints} disabled={locked}
              onChange={(e) => update((t) => ({ ...t, bonusPoints: Math.max(0, Math.min(10, Number(e.target.value) || 0)) }))} />
            <small>0～10 分，計入總分</small>
          </label>
        </section>

        <footer className="rs-confirm">
          <span>{locked ? (published ? '名次已經公布，此隊成績不能再修改。' : '此隊成績已確認，解鎖後才能修改。') : pending > 0 ? `還有 ${pending} 項需要確認的項目還沒處理，處理完才能確認。` : '所有項目已覆核，可以確認成績。'}</span>
          <button type="button" className="hint-btn rs-confirm-btn" disabled={locked ? published : pending > 0} onClick={toggleConfirm}>
            {locked ? '解鎖修改' : '確認這一隊的成績'}
          </button>
        </footer>
      </div>
    </div>
  )
}

/*
  評分作業先列出所有隊伍的大按鈕，點選其中一隊才會展開該隊的評分明細，
  明細頁用「回到所有隊伍」返回，避免把隊伍清單固定卡在旁邊。
*/
export default function ResultsGrading({ items, published, classAvg4D, onUpdate }) {
  const [selectedId, setSelectedId] = useState(null)
  const current = items.find((item) => item.team.id === selectedId)

  if (current) {
    return (
      <GradingDetail
        current={current}
        published={published}
        classAvg4D={classAvg4D}
        onUpdate={onUpdate}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  const confirmedCount = items.filter((item) => item.team.confirmed).length

  return (
    <section className="arena-panel rs-pick" aria-label="選擇隊伍">
      <div className="rs-pick-head">
        <div>
          <p className="arena-section-kicker">CHOOSE A TEAM</p>
          <h3>選擇要評分的隊伍</h3>
          <p>點選任一隊，查看並覆核該隊的評分。</p>
        </div>
        <div className="rs-pick-progress"><b>{confirmedCount}</b><span> / {items.length} 隊已確認</span></div>
      </div>
      <div className="rs-pick-grid">
        {items.map((item) => {
          const pending = priorityItems(item.team).filter((p) => !item.team.reviewed[p.key]).length
          const status = item.team.confirmed ? '已確認' : pending > 0 ? `${pending} 項待確認` : '可以確認'
          return (
            <button
              type="button"
              key={item.team.id}
              className={`rs-pick-card${item.team.confirmed ? ' confirmed' : ''}`}
              onClick={() => setSelectedId(item.team.id)}
            >
              <span className="rs-pick-mark">{item.team.id}</span>
              <b className="rs-pick-name">{item.team.name}</b>
              <small className="rs-pick-members">{item.team.members.join('、')}</small>
              <span className="rs-pick-total">{item.scores.total.toFixed(1)}<small> 分</small></span>
              <span className={`rs-pick-status${item.team.confirmed ? ' done' : pending > 0 ? ' warn' : ''}`}>{item.team.confirmed ? '✓ ' : ''}{status}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
