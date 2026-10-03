import { useEffect, useRef, useState } from 'react'
import { IconPause, IconPlay, IconCrown } from '../icons.jsx'
import { TEAMS, KMAP_INITIAL, CLASS_4D, CLASS_4D_WEAK_THRESHOLD, INITIAL_LIVE_EVENTS, LIVE_EVENT_POOL, PUSH_SUGGESTIONS, copyText } from '../data.js'
import Modal from '../components/Modal.jsx'
import KnowledgeMap from '../components/KnowledgeMap.jsx'
import { playToggle, playSuccess } from '../sound.js'

function pad(n) { return String(n).padStart(2, '0') }

const EVENT_ICON = { point: '+1', halluc: '!', hint: '✉', redundant: '=' }
const BROADCAST_CARDS = PUSH_SUGGESTIONS.filter((card) => card.key !== 'time').map((card) => {
  const [title, desc] = card.label.split('：')
  return { ...card, title, desc }
})
const CARD_BY_KEY = Object.fromEntries(BROADCAST_CARDS.map((card) => [card.key, card]))

function relativeTime(at, now) {
  const sec = Math.max(0, Math.round((now - at) / 1000))
  if (sec < 5) return '剛剛'
  if (sec < 60) return `${sec} 秒前`
  return `${Math.floor(sec / 60)} 分前`
}

export default function Arena({ config, onBack, onOpenTeam, onEnd, onToast }) {
  const [isPaused, setIsPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(() => config.timeLimit * 60)
  const [popover, setPopover] = useState(null)
  const [tab, setTab] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [dismissed, setDismissed] = useState(() => new Set())
  const [hintedTeams, setHintedTeams] = useState(() => new Set(TEAMS.filter((team) => team.hinted).map((team) => team.name)))
  const [events, setEvents] = useState(() => {
    const now = Date.now()
    return INITIAL_LIVE_EVENTS.map((event, idx) => ({ ...event, id: idx, at: now - event.ago * 1000 }))
  })
  const [feedSeen, setFeedSeen] = useState(() => Date.now())
  const [kmap, setKmap] = useState(() => KMAP_INITIAL.map((node) => ({ ...node, teams: [...node.teams] })))
  const [kmapFlash, setKmapFlash] = useState(null)
  const kmapRef = useRef(kmap)
  kmapRef.current = kmap
  const barRef = useRef(null)

  const statTime = `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
  const lowTime = totalSeconds > 0 && totalSeconds <= 120
  const criticalTime = totalSeconds > 0 && totalSeconds <= 10
  const ended = totalSeconds === 0
  const submittedCount = 3
  const now = Date.now()
  const leadingCov = Math.max(...TEAMS.map((team) => team.cov))
  const weakDims = CLASS_4D.filter((d) => d.pct < CLASS_4D_WEAK_THRESHOLD)
  const emptyDims = kmap.filter((node) => node.teams.length === 0)
  const weakest = CLASS_4D.reduce((min, d) => (d.pct < min.pct ? d : min), CLASS_4D[0])
  const unseenFeed = tab === 'feed' ? 0 : events.filter((event) => event.live && event.at > feedSeen).length

  useEffect(() => {
    if (isPaused || ended) return undefined
    const timer = window.setInterval(() => {
      setTotalSeconds((remaining) => Math.max(0, remaining - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isPaused, ended, totalSeconds])

  useEffect(() => {
    if (isPaused || ended) return undefined
    const timer = window.setInterval(() => {
      const pick = LIVE_EVENT_POOL[Math.floor(Math.random() * LIVE_EVENT_POOL.length)]
      applyLiveEvent(pick)
    }, 9000)
    return () => window.clearInterval(timer)
  }, [isPaused, ended])

  useEffect(() => {
    if (tab === 'feed') setFeedSeen(Date.now())
  }, [tab, events])

  useEffect(() => {
    if (!popover) return undefined
    function onDown(e) {
      if (barRef.current && !barRef.current.contains(e.target)) setPopover(null)
    }
    function onKey(e) {
      if (e.key === 'Escape') setPopover(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [popover])

  function applyLiveEvent(pick) {
    if (!pick.dim) {
      pushEvent({ ...pick, live: true })
      return
    }
    const letter = pick.team.slice(0, 1)
    const node = kmapRef.current.find((item) => item.dim === pick.dim)
    if (node && node.teams.includes(letter)) {
      pushEvent({ team: pick.team, kind: 'redundant', text: `「${pick.dim}」已涵蓋過，重複 0 分`, live: true })
      return
    }
    setKmap((list) => (node
      ? list.map((item) => (item.dim === pick.dim ? { ...item, teams: [...item.teams, letter] } : item))
      : [...list, { dim: pick.dim, teams: [letter], origin: 'team' }]))
    setKmapFlash({ dim: pick.dim, at: Date.now() })
    pushEvent({ team: pick.team, kind: 'point', text: node ? `「${pick.dim}」新面向 +1` : `「${pick.dim}」隊伍自創面向 +1`, live: true })
  }

  function pushEvent(event) {
    setEvents((list) => [{ ...event, id: Date.now() + Math.random(), at: Date.now() }, ...list].slice(0, 40))
  }

  function broadcastCard(card) {
    setHintedTeams(new Set(TEAMS.map((team) => team.name)))
    pushEvent({ team: '全班', kind: 'hint', text: `已推送「${card.title}」給全部隊伍` })
    onToast(card.text)
    playSuccess()
    setPopover(null)
  }

  function togglePause() {
    setIsPaused((value) => !value)
    setPopover(null)
    playToggle()
  }

  function addTime(mins) {
    setTotalSeconds((remaining) => remaining + mins * 60)
    onToast(`教師已為全班加時 ${mins} 分鐘，把握機會補齊還沒探索的面向。`)
    playSuccess()
  }

  function copyCode() {
    copyText(config.code)
    setCodeCopied(true)
    window.setTimeout(() => setCodeCopied(false), 1600)
  }

  function togglePopover(name) {
    setPopover((current) => (current === name ? null : name))
  }

  function dismiss(key) {
    setDismissed((set) => new Set(set).add(key))
  }

  const alerts = []
  events.filter((event) => event.live && event.kind === 'halluc').forEach((event) => {
    alerts.push({ key: `live-${event.id}`, tone: 'red', title: `${event.team} 命中幻覺`, desc: event.text.replace('幻覺偵測：', ''), action: { label: '查看隊伍', run: () => onOpenTeam(event.team) } })
  })
  TEAMS.forEach((team) => {
    if (team.stalled) alerts.push({ key: `stall-${team.name}`, tone: 'amber', title: `${team.name} 停滯中`, desc: team.flags[0]?.t, action: { label: '發提示', run: () => onOpenTeam(team.name) } })
    if (team.flagged) alerts.push({ key: `hallu-${team.name}`, tone: 'red', title: `${team.name} 命中幻覺陷阱`, desc: '建議查看並提醒查證來源', action: { label: '查看隊伍', run: () => onOpenTeam(team.name) } })
  })
  emptyDims.forEach((dim) => {
    alerts.push({ key: `gap-${dim.dim}`, tone: 'blue', title: `「${dim.dim}」尚無隊伍涵蓋`, desc: '全班目前的空白面向', action: { label: '推送空白區域卡', resolve: true, run: () => broadcastCard(CARD_BY_KEY.blank) } })
  })
  weakDims.forEach((dim) => {
    const canPush = dim.key === 'D3'
    alerts.push({
      key: `weak-${dim.key}`,
      tone: 'amber',
      title: `${dim.key} ${dim.label} 偏低（${dim.pct}%）`,
      desc: canPush ? '建議推送幻覺警示卡' : '全班整體偏弱，可口頭提醒',
      action: canPush ? { label: '推送幻覺警示卡', resolve: true, run: () => broadcastCard(CARD_BY_KEY.hallu) } : null,
    })
  })
  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.key))

  function runAlert(alert) {
    alert.action.run()
    if (alert.action.resolve) dismiss(alert.key)
  }

  return (
    <div className="arena-screen">
      <button className="hint-btn ghost sm arena-back" onClick={onBack}>← 返回課程</button>
      <section className="arena-console" aria-label="教師即時競賽監控台">
        <div className="arena-bar" ref={barRef}>
          <div className="arena-bar-title">
            <div className="arena-eyebrow"><span className="arena-live-dot" /> LIVE</div>
            <h2>{config.caseName}</h2>
            <div className="arena-context-line">每題 {config.timeLimit} 分鐘</div>
          </div>

          <div className={`arena-clock${lowTime ? ' low-time' : ''}${criticalTime ? ' critical-time' : ''}`}>
            <div className="arena-clock-copy">
              <span className="arena-clock-label">{ended ? '時間到' : isPaused ? '競賽暫停' : '剩餘時間'}</span>
              <strong className="arena-clock-value">{statTime}</strong>
            </div>
            <div className="arena-time-add">
              <button className="time-add-btn" title="全班加時 1 分鐘" onClick={() => addTime(1)}>+1</button>
              <button className="time-add-btn" title="全班加時 5 分鐘" onClick={() => addTime(5)}>+5</button>
            </div>
          </div>

          <div className="arena-bar-actions">
            <div className="arena-popover-wrap">
              <button type="button" className="arena-tool-btn" onClick={() => togglePopover('code')} aria-expanded={popover === 'code'}>分享代碼 ▾</button>
              {popover === 'code' && (
                <div className="arena-popover code-popover" role="dialog" aria-label="學生加入代碼">
                  <span>學生加入代碼</span>
                  <strong className="mono">{config.code}</strong>
                  <button type="button" className="arena-popover-copy" onClick={copyCode}>{codeCopied ? '✓ 已複製' : '複製代碼'}</button>
                </div>
              )}
            </div>
            <div className="arena-popover-wrap">
              <button type="button" className="arena-tool-btn" onClick={() => togglePopover('hints')} aria-expanded={popover === 'hints'} disabled={isPaused}>推送引導卡 ▾</button>
              {popover === 'hints' && (
                <div className="arena-popover hints-popover" role="dialog" aria-label="推送引導卡給全班">
                  <p>推送後學生會在右下角看到提示條，不會打斷輸入。</p>
                  {BROADCAST_CARDS.map((card) => (
                    <div className={`arena-broadcast-card tone-${card.key}`} key={card.key}>
                      <div className="arena-broadcast-title">{card.title}</div>
                      <p>{card.desc}</p>
                      <button type="button" className="arena-broadcast-btn" onClick={() => broadcastCard(card)}>推送全班</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className={`hint-btn arena-pause${isPaused ? ' resumed' : ''}`} id="pauseBtn" onClick={togglePause}>
              <span className="btn-ic">{isPaused ? <IconPlay size={14} /> : <IconPause size={14} />}</span>{isPaused ? '恢復' : '暫停'}
            </button>
            <button className="hint-btn end-comp-btn" onClick={onEnd}>結束並評分 <span aria-hidden="true">→</span></button>
          </div>
        </div>

        {isPaused && (
          <div className="arena-alert paused-alert" role="status"><IconPause size={14} /> 競賽已暫停，學生端目前無法送出提示。</div>
        )}
        {ended && (
          <div className="arena-alert ended-alert" role="status">⏱ 時間到！可以結束競賽並前往評分，或替全班加時繼續討論。</div>
        )}

        <div className="arena-dashboard">
          <section className="arena-panel arena-teams-panel" aria-labelledby="teams-heading">
            <div className="arena-section-heading">
              <div>
                <h3 id="teams-heading">隊伍戰況</h3>
                <p>{submittedCount} / {TEAMS.length} 隊已送出・點任一隊查看細節</p>
              </div>
            </div>

            <div className="arena-team-grid">
              {TEAMS.map((team, idx) => {
                const isLeading = team.cov === leadingCov
                return (
                  <button
                    key={team.name}
                    className={`arena-team-card pop-in${team.stalled ? ' stalled' : ''}${team.flagged ? ' flagged' : ''}${isLeading ? ' leading' : ''}`}
                    style={{ animationDelay: `${idx * 0.05}s`, '--team-color': team.dot, '--team-progress': `${team.cov}%` }}
                    onClick={() => onOpenTeam(team.name)}
                    type="button"
                    aria-label={`查看${team.name}，目前${team.status}，解方覆蓋率 ${team.cov}%`}
                  >
                    <div className="arena-team-top">
                      <div className="arena-team-identity">
                        <span className="arena-team-mark">{team.name.slice(0, 1)}</span>
                        <span className="arena-team-name">{team.name}</span>
                        {isLeading && <span className="arena-leading-tag"><IconCrown size={12} /> 領先</span>}
                      </div>
                      <span className="arena-team-status"><i />{team.status}</span>
                    </div>
                    <div className="arena-coverage-row"><span>解方覆蓋率</span><strong>{team.cov}<small>%</small></strong></div>
                    <div className="arena-coverage-track"><span /></div>
                    {(team.flags.length > 0 || hintedTeams.has(team.name)) && (
                      <div className="arena-team-flags">
                        {hintedTeams.has(team.name) && <span className="arena-flag hinted">✉ 已發提示</span>}
                        {team.flags.map((flag, flagIdx) => <span className={`arena-flag ${flag.c}`} key={flagIdx}>{flag.t}</span>)}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          <aside className="arena-panel arena-attention-panel" aria-labelledby="attention-heading">
            <div className="arena-attention-inner">
            <div className="arena-section-heading compact-heading">
              <div>
                <h3 id="attention-heading">需要你注意</h3>
                <p>只列出需要老師介入的狀況</p>
              </div>
              <span className={`arena-attention-count${visibleAlerts.length === 0 ? ' calm' : ''}`}>{visibleAlerts.length}</span>
            </div>
            {visibleAlerts.length === 0 ? (
              <div className="arena-attention-empty">✓ 目前一切順利</div>
            ) : (
              <ul className="arena-attention-list">
                {visibleAlerts.map((alert) => (
                  <li className={`arena-attention-item ${alert.tone}`} key={alert.key}>
                    <div className="arena-attention-body">
                      <b>{alert.title}</b>
                      {alert.desc && <span>{alert.desc}</span>}
                      {alert.action && (
                        <button type="button" className="arena-attention-action" onClick={() => runAlert(alert)} disabled={isPaused && alert.action.resolve}>{alert.action.label} →</button>
                      )}
                    </div>
                    <button type="button" className="arena-attention-dismiss" aria-label="先不處理" onClick={() => dismiss(alert.key)}>×</button>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </aside>
        </div>

        <section className="arena-more" aria-label="更多資訊">
          <div className="arena-more-title">更多即時資訊 <span>點選卡片開啟詳細內容</span></div>
          <div className="arena-more-grid">
            <button type="button" className={`arena-more-card tone-d4${weakDims.length > 0 ? ' alert' : ''}`} onClick={() => setTab('d4')}>
              <span className="arena-more-icon" aria-hidden="true">4D</span>
              <span className="arena-more-main">
                <b>班級 4D 與幻覺</b>
                <small>最弱：{weakest.key} {weakest.label} {weakest.pct}%　幻覺命中 22%</small>
              </span>
              {weakDims.length > 0 && <i className="tab-dot warn">{weakDims.length}</i>}
              <span className="arena-more-go" aria-hidden="true">查看 ↗</span>
            </button>
            <button type="button" className={`arena-more-card tone-feed${unseenFeed > 0 ? ' alert' : ''}`} onClick={() => setTab('feed')}>
              <span className="arena-more-icon" aria-hidden="true">LIVE</span>
              <span className="arena-more-main">
                <b>即時動態</b>
                <small>{events[0] ? `${events[0].team}：${events[0].text}` : '目前沒有動態'}</small>
              </span>
              {unseenFeed > 0 && <i className="tab-dot new">{unseenFeed}</i>}
              <span className="arena-more-go" aria-hidden="true">查看 ↗</span>
            </button>
            <button type="button" className={`arena-more-card tone-map${emptyDims.length > 0 ? ' alert' : ''}`} onClick={() => setTab('map')}>
              <span className="arena-more-icon" aria-hidden="true">MAP</span>
              <span className="arena-more-main">
                <b>集體知識地圖</b>
                <small>{kmap.length} 個面向，{emptyDims.length} 個尚無隊伍涵蓋</small>
              </span>
              {emptyDims.length > 0 && <i className="tab-dot warn">{emptyDims.length}</i>}
              <span className="arena-more-go" aria-hidden="true">查看 ↗</span>
            </button>
          </div>
        </section>

        <Modal show={tab === 'd4'} onClose={() => setTab(null)} boxClassName="arena-modal" boxStyle={{ maxWidth: 520 }} labelledBy="d4-modal-title">
          <div className="modal-head" id="d4-modal-title">
            <div className="name">班級 4D 與幻覺</div>
            <div className="arena-modal-sub">低於 {CLASS_4D_WEAK_THRESHOLD}% 的向度會標示為偏弱</div>
          </div>
          <div className="arena-insight-card hallucination-insight">
            <div className="insight-icon" aria-hidden="true">!</div>
            <div><span>全班幻覺命中率</span><strong>22<small>%</small></strong></div>
            <span className="insight-caption">需留意</span>
          </div>
          <div className="arena-4d-list">
            {CLASS_4D.map((d) => (
              <div className={`arena-4d-row${d.pct < CLASS_4D_WEAK_THRESHOLD ? ' weak' : ''}`} key={d.key} style={{ '--d4-color': d.color }}>
                <span className="arena-4d-name">{d.key} {d.label}</span>
                <span className="arena-4d-track"><i style={{ width: `${d.pct}%` }} /></span>
                <span className="arena-4d-pct">{d.pct}%</span>
              </div>
            ))}
          </div>
          {weakDims.length > 0 && (
            <div className="arena-4d-tip">{weakDims.map((d) => `${d.key} ${d.label}（${d.pct}%）`).join('、')}偏低，建議推送對應的引導卡。</div>
          )}
        </Modal>

        <Modal show={tab === 'feed'} onClose={() => setTab(null)} boxClassName="arena-modal" boxStyle={{ maxWidth: 560 }} labelledBy="feed-modal-title">
          <div className="modal-head" id="feed-modal-title">
            <div className="name">即時動態</div>
            <div className="arena-modal-sub">各隊得分、幻覺偵測與教師推送的紀錄</div>
          </div>
          <ul className="arena-feed-list">
            {events.map((event) => (
              <li className={`arena-feed-item ${event.kind}`} key={event.id}>
                <span className="arena-feed-icon" aria-hidden="true">{EVENT_ICON[event.kind]}</span>
                <div><b>{event.team}</b><span>{event.text}</span></div>
                <time>{relativeTime(event.at, now)}</time>
              </li>
            ))}
          </ul>
        </Modal>

        <Modal show={tab === 'map'} onClose={() => setTab(null)} boxClassName="arena-modal" boxStyle={{ maxWidth: 780 }} labelledBy="map-modal-title">
          <div className="modal-head" id="map-modal-title">
            <div className="name">集體知識地圖</div>
            <div className="arena-modal-sub">各隊已涵蓋的解方面向，找出適合推送引導卡的時機</div>
          </div>
          <KnowledgeMap topic={config.caseName} nodes={kmap} flash={kmapFlash} />
        </Modal>
      </section>
    </div>
  )
}
