import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconPause, IconPlay, IconCrown, IconScoring, IconCheckCircle, IconFlag } from '../icons.jsx'
import { TEAMS, KMAP_INITIAL, teamCoverage, INITIAL_LIVE_EVENTS, LIVE_EVENT_POOL, PUSH_SUGGESTIONS, copyText, roundSuggestion } from '../data.js'
import Modal from '../components/Modal.jsx'
import RoundSuggestion from '../components/RoundSuggestion.jsx'
import KnowledgeMap from '../components/KnowledgeMap.jsx'
import { playToggle, playSuccess } from '../sound.js'

function pad(n) { return String(n).padStart(2, '0') }

const EVENT_ICON = { newDim: '+', submitted: '✓', hint: '✉', redundant: '=' }
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

/*
  回合制（docs/system-flow.md）：一場競賽有 N 回合，每回合依序是
    ready 等老師按「開始競賽」（只有第 1 回合；學生看得到題目但還不能作答）→
    playing 作答中（老師按「開始競賽」／「開始第 N 回合」時，學生開始作答、同時開始倒數；
            學生在時間內可以一直上傳答案，有新面向或新答案、評分 AI 覺得合理就加分）→
    scoring 時間到，評分 AI 評分 → between 這回合結束、等老師開始下一回合 → …最後一回合評分完 → finished 所有回合結束，前往評分。
  競賽中不做即時評分（docs/scoring-design.md 十一）：監控台沒有 AI 分數、即時 4D 與即時幻覺，
  只有面向偵測 AI 產生的即時知識地圖、覆蓋率與各隊繳交情況。
  不再有組內投票（2026-10-24 決定）；評分的時間是示意（4 秒），接後端後由後端決定。
  老師從監控台跳去看隊伍詳情再回來，畫面會重新掛載，所以把回合進度存在這個模組層級的暫存裡，回來時接著看。
*/
const SCORING_SECONDS = 4
// 改善建議：全班評分完成後，評分 AI 另外呼叫一次產生（docs/scoring-design.md 十二）；產生中不擋住老師開始下一回合。示意 5 秒。
const SUGGEST_MS = 5000
const ARENA_CACHE = new Map()

const CLOCK_LABEL = { ready: '等待開始競賽', playing: '本回合剩餘', scoring: 'AI 評分中', between: '回合結束', finished: '競賽結束' }
const PHASE_LABEL = { ready: '等待開始', playing: '進行中', scoring: '評分中', between: '已結束', finished: '已結束' }

export default function Arena({ config, onBack, onOpenTeam, onEnd, onToast }) {
  const rounds = config.rounds ?? 2
  const saved = ARENA_CACHE.get(config.code)
  const [round, setRound] = useState(saved?.round ?? 1)
  const [phase, setPhase] = useState(saved?.phase ?? 'ready')
  const [completedRounds, setCompletedRounds] = useState(saved?.completedRounds ?? [])
  // 每回合改善建議的狀態：{ [回合]: 'generating' | 'ready' }；suggestRound 是建議視窗正在看第幾回合
  const [suggestStatus, setSuggestStatus] = useState(saved?.suggestStatus ?? {})
  const [suggestRound, setSuggestRound] = useState(null)
  /*
    提示條待送清單：老師可以從建議帶入多則（或自己新增），每一則各自修改文字、各自選要送給哪些隊伍，
    targets 是 ['all']（全班）或隊伍代號的陣列（可以多選，例如 ['B', 'D']）；送出後從清單移除，沒送的跨回合保留。
    只有作答中才能送（回合之間學生沒在作答）；回合之間寫好的會留在清單，下一回合開始後再送。
  */
  const [hintDrafts, setHintDrafts] = useState([])
  const [isPaused, setIsPaused] = useState(saved?.isPaused ?? false)
  const [totalSeconds, setTotalSeconds] = useState(() => saved?.totalSeconds ?? config.timeLimit * 60)
  const [popover, setPopover] = useState(null)
  const [tab, setTab] = useState(null)
  const [alertsOpen, setAlertsOpen] = useState(false) // 右下角浮動按鈕展開的「需要你注意」小視窗
  const alertsRef = useRef(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [dismissed, setDismissed] = useState(() => new Set())
  const [hintedTeams, setHintedTeams] = useState(() => new Set(TEAMS.filter((team) => team.hinted).map((team) => team.name)))
  const [events, setEvents] = useState(() => {
    const now = Date.now()
    return INITIAL_LIVE_EVENTS.map((event, idx) => ({ ...event, id: idx, at: now - event.ago * 1000 }))
  })
  const [feedSeen, setFeedSeen] = useState(() => Date.now())
  const [kmap, setKmap] = useState(() => KMAP_INITIAL.map((node) => ({ ...node, teams: [...node.teams], answers: { ...node.answers } })))
  const [kmapFlash, setKmapFlash] = useState(null)
  const [questionMore, setQuestionMore] = useState(false) // 題目面板是否展開「角色與立場」等完整內容
  const kmapRef = useRef(kmap)
  kmapRef.current = kmap
  const barRef = useRef(null)

  const statTime = `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
  const playing = phase === 'playing'
  const countingDown = phase === 'playing' || phase === 'scoring'
  const ticking = !isPaused && countingDown
  const lowTime = playing && totalSeconds > 0 && totalSeconds <= 120
  const criticalTime = playing && totalSeconds > 0 && totalSeconds <= 10
  const ended = !playing // 不在「進行中」就不再產生即時動態、不能加時或推送提示
  const submittedPeople = TEAMS.reduce((sum, team) => sum + team.submitted, 0)
  const totalPeople = TEAMS.reduce((sum, team) => sum + team.members, 0)
  const submittedTeams = TEAMS.filter((team) => team.submitted === team.members).length
  const now = Date.now()
  const covByTeam = Object.fromEntries(TEAMS.map((team) => [team.name, teamCoverage(kmap, team.name.slice(0, 1))]))
  const leadingCov = Math.max(...Object.values(covByTeam))
  const emptyDims = kmap.filter((node) => node.teams.length === 0)
  const unseenFeed = tab === 'feed' ? 0 : events.filter((event) => event.live && event.at > feedSeen).length

  useEffect(() => {
    if (!ticking) return undefined
    const timer = window.setInterval(() => {
      setTotalSeconds((remaining) => Math.max(0, remaining - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [ticking, totalSeconds])

  // 倒數到 0 時進入下一個階段：進行中 → 評分 → 這回合結束（或全部結束）
  useEffect(() => {
    if (isPaused || totalSeconds > 0) return
    if (phase === 'playing') {
      setPhase('scoring')
      setTotalSeconds(SCORING_SECONDS)
      pushEvent({ team: '全班', kind: 'hint', text: `第 ${round} 回合時間到，評分 AI 開始評分` })
    } else if (phase === 'scoring') {
      setCompletedRounds((list) => (list.includes(round) ? list : [...list, round]))
      setPhase(round < rounds ? 'between' : 'finished')
      setSuggestStatus((map) => ({ ...map, [round]: 'generating' }))
      // 評分一結束就打開建議視窗，先顯示「產生中」，產生好之後內容直接出現在同一個視窗
      setSuggestRound(round)
      setTab('suggest')
      pushEvent({ team: '全班', kind: 'hint', text: `第 ${round} 回合 AI 評分完成，正在產生改善建議` })
      playSuccess()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds, phase, isPaused])

  // 改善建議產生完成（示意：產生中幾秒後完成），完成就自動跳出建議視窗；老師已經開始下一回合也照樣可以看
  useEffect(() => {
    const generating = Object.keys(suggestStatus).filter((r) => suggestStatus[r] === 'generating').map(Number)
    if (generating.length === 0) return undefined
    const timers = generating.map((r) => window.setTimeout(() => {
      setSuggestStatus((map) => ({ ...map, [r]: 'ready' }))
      pushEvent({ team: '全班', kind: 'hint', text: `第 ${r} 回合改善建議已產生` })
      setSuggestRound(r)
      setTab('suggest')
      playSuccess()
    }, SUGGEST_MS))
    return () => timers.forEach((t) => window.clearTimeout(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestStatus])

  // 進度存起來，從隊伍詳情回來時接著看
  useEffect(() => {
    ARENA_CACHE.set(config.code, { round, phase, completedRounds, isPaused, totalSeconds, suggestStatus })
  }, [config.code, round, phase, completedRounds, isPaused, totalSeconds, suggestStatus])

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

  // 「需要你注意」小視窗：點視窗外面或按 Esc 關閉
  useEffect(() => {
    if (!alertsOpen) return undefined
    function onDown(e) {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) setAlertsOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setAlertsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [alertsOpen])

  // 老師按「開始競賽」（第 1 回合）：學生從這時候起才能作答，同時開始倒數
  function startCompetition() {
    setPhase('playing')
    pushEvent({ team: '全班', kind: 'hint', text: `競賽開始：學生開始作答，第 1 回合開始倒數（${statTime}）` })
    playSuccess()
  }

  // 老師按「開始第 N 回合」：學生開始作答、同時開始倒數；每回合開始時學生的對話記憶清空，所以知識地圖、提醒也一起重來
  function startNextRound() {
    const next = round + 1
    setRound(next)
    setPhase('playing')
    setTotalSeconds(config.timeLimit * 60)
    setIsPaused(false)
    setKmap(KMAP_INITIAL.map((node) => ({ ...node, teams: [...node.teams], answers: { ...node.answers } })))
    setKmapFlash(null)
    setDismissed(new Set())
    pushEvent({ team: '全班', kind: 'hint', text: `第 ${next} 回合開始：學生開始作答、開始倒數，對話記憶已清空` })
    playSuccess()
  }

  // 提前結束「這一回合」（不是整場）：例如時間還沒到、但學生都已提交；直接進入評分
  function endRoundEarly() {
    if (!window.confirm(`確定要提前結束第 ${round} 回合嗎？會直接進入評分。`)) return
    setIsPaused(false)
    setTotalSeconds(0)
    pushEvent({ team: '全班', kind: 'hint', text: `老師提前結束第 ${round} 回合` })
  }

  // 結束整場：提早結束時，排名只計已完成評分的回合（docs/scoring-design.md 七），把這個數字交給結果頁
  function endCompetition() {
    if (phase !== 'finished') {
      const done = completedRounds.length
      const message = done === 0
        ? '目前還沒有完成評分的回合，提早結束後沒有分數可以排名。確定要結束整場嗎？'
        : `提早結束整場：排名只計已完成評分的 ${done} 個回合（第 ${completedRounds.join('、')} 回合），進行中、還沒評分的回合不計入。確定要結束嗎？`
      if (!window.confirm(message)) return
    }
    ARENA_CACHE.delete(config.code)
    onEnd({ scoredRounds: completedRounds.length })
  }

  // 把建議的提示條加進待送清單（預設送全班，老師可以改成多個隊伍）；text 空白就是新增一則空的
  function addHintDraft(text = '') {
    setHintDrafts((list) => [...list, { id: Date.now() + Math.random(), text, targets: ['all'] }])
    playToggle()
  }

  function updateHintDraft(id, patch) {
    setHintDrafts((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  // 選「全班」會清掉個別隊伍；選隊伍會取消「全班」；隊伍可以多選
  function toggleHintTarget(id, key) {
    setHintDrafts((list) => list.map((d) => {
      if (d.id !== id) return d
      if (key === 'all') return { ...d, targets: d.targets.includes('all') ? [] : ['all'] }
      const teams = d.targets.filter((t) => t !== 'all')
      return { ...d, targets: teams.includes(key) ? teams.filter((t) => t !== key) : [...teams, key] }
    }))
  }

  const draftReady = (d) => d.text.trim() !== '' && d.targets.length > 0
  const targetLabel = (targets) => (targets.includes('all') ? '全班' : targets.map((t) => `${t} 隊`).join('、'))

  // 送出一則或多則：每一則各自送給它選的隊伍
  function sendHintDrafts(ids) {
    const sending = hintDrafts.filter((d) => ids.includes(d.id) && draftReady(d))
    if (sending.length === 0) return
    sending.forEach((d) => {
      const names = d.targets.includes('all') ? TEAMS.map((team) => team.name) : d.targets.map((t) => `${t} 隊`)
      setHintedTeams((set) => new Set([...set, ...names]))
      pushEvent({ team: targetLabel(d.targets), kind: 'hint', text: `已推送提示條：${d.text.trim()}` })
    })
    onToast(sending.length === 1 ? sending[0].text.trim() : `已送出 ${sending.length} 則提示條`)
    playSuccess()
    setHintDrafts((list) => list.filter((d) => !sending.some((x) => x.id === d.id)))
  }

  const readyRounds = Object.keys(suggestStatus).filter((r) => suggestStatus[r] === 'ready').map(Number).sort((a, b) => a - b)
  const latestReady = readyRounds[readyRounds.length - 1]
  const generatingNow = Object.values(suggestStatus).includes('generating')
  const canSendHint = playing && !isPaused
  const sendBlockedReason = isPaused ? '暫停中不能送出提示條。' : phase === 'finished' ? '所有回合都結束了，提示條不會再送出。' : '學生作答中才能送出；寫好的會留在清單，下一回合開始後再送。'

  function openSuggestion(r) {
    setSuggestRound(r)
    setTab('suggest')
  }

  function applyLiveEvent(pick) {
    if (!pick.dim) {
      pushEvent({ ...pick, live: true })
      return
    }
    const letter = pick.team.slice(0, 1)
    const node = kmapRef.current.find((item) => item.dim === pick.dim)
    if (node && node.teams.includes(letter)) {
      pushEvent({ team: pick.team, kind: 'redundant', text: `「${pick.dim}」已談到過`, live: true })
      return
    }
    const answer = { who: pick.who, text: pick.answer }
    setKmap((list) => (node
      ? list.map((item) => (item.dim === pick.dim ? { ...item, teams: [...item.teams, letter], answers: { ...item.answers, [letter]: answer } } : item))
      : [...list, { dim: pick.dim, teams: [letter], origin: 'team', answers: { [letter]: answer } }]))
    setKmapFlash({ dim: pick.dim, team: letter, at: Date.now() })
    // 只是知識地圖長出新分支，不代表加分；加分要等回合結束由評分 AI 確認
    pushEvent({ team: pick.team, kind: 'newDim', text: node ? `談到「${pick.dim}」` : `可能的新面向「${pick.dim}」`, live: true })
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
  TEAMS.forEach((team) => {
    if (team.stalled) alerts.push({ key: `stall-${team.name}`, tone: 'amber', title: `${team.name} 停滯中`, desc: team.flags[0]?.t, action: { label: '發提示', run: () => onOpenTeam(team.name) } })
  })
  emptyDims.forEach((dim) => {
    alerts.push({ key: `gap-${dim.dim}`, tone: 'blue', title: `「${dim.dim}」尚無隊伍涵蓋`, desc: '全班目前的空白面向', action: { label: '推送空白區域卡', resolve: true, run: () => broadcastCard(CARD_BY_KEY.blank) } })
  })
  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.key))

  function runAlert(alert) {
    alert.action.run()
    if (alert.action.resolve) dismiss(alert.key)
  }

  return (
    <div className="arena-screen has-fab">
      <button className="hint-btn ghost sm arena-back" onClick={onBack}>← 返回課程</button>
      <section className="arena-console" aria-label="教師即時競賽監控台">
        <div className="arena-bar" ref={barRef}>
          <div className="arena-bar-title">
            <div className="arena-eyebrow"><span className="arena-live-dot" /> LIVE</div>
            <h2>{config.caseName}</h2>
            <div className="arena-context-line">共 {rounds} 回合・每回合 {config.timeLimit} 分鐘</div>
            <ol className="arena-rounds" aria-label="回合進度">
              {Array.from({ length: rounds }, (_, i) => i + 1).map((n) => {
                const done = completedRounds.includes(n)
                const current = n === round && phase !== 'finished' && !done
                return (
                  <li key={n} className={done ? 'done' : current ? 'current' : ''}>
                    <b>回合 {n}</b>
                    <span>{done ? '✓ 已完成' : current ? PHASE_LABEL[phase] : '尚未開始'}</span>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className={`arena-clock${lowTime ? ' low-time' : ''}${criticalTime ? ' critical-time' : ''}`}>
            <div className="arena-clock-copy">
              <span className="arena-clock-label">
                {CLOCK_LABEL[phase]}
                {playing && isPaused ? '（暫停）' : ''}
              </span>
              <strong className="arena-clock-value">{countingDown || phase === 'ready' ? statTime : '— —'}</strong>
            </div>
            <div className="arena-time-add">
              <button className="time-add-btn" title="全班加時 1 分鐘" disabled={!playing} onClick={() => addTime(1)}>+1</button>
              <button className="time-add-btn" title="全班加時 5 分鐘" disabled={!playing} onClick={() => addTime(5)}>+5</button>
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
              <button type="button" className="arena-tool-btn" onClick={() => togglePopover('hints')} aria-expanded={popover === 'hints'} disabled={isPaused || !playing}>推送引導卡 ▾</button>
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
            <button className={`hint-btn arena-pause${isPaused ? ' resumed' : ''}`} id="pauseBtn" disabled={!playing} onClick={togglePause}>
              <span className="btn-ic">{isPaused ? <IconPlay size={14} /> : <IconPause size={14} />}</span>{isPaused ? '恢復' : '暫停'}
            </button>
            <button type="button" className="arena-tool-btn" disabled={!playing} onClick={endRoundEarly} title="只結束這一回合，直接進入評分">結束第 {round} 回合</button>
            <button className="hint-btn end-comp-btn" onClick={endCompetition} title="提前結束整場競賽，直接前往評分">結束整場並評分 <span aria-hidden="true">→</span></button>
          </div>
        </div>

        {isPaused && (
          <div className="arena-alert paused-alert" role="status"><IconPause size={14} /> 競賽已暫停，學生端目前無法送出提示。</div>
        )}
        {phase === 'ready' && (
          <div className="arena-alert phase-alert next" role="status">
            <span className="alert-text">學生已經看得到題目，但還不能作答。準備好就按「開始競賽」：學生開始作答，同時開始倒數（{statTime}）。</span>
            <button type="button" className="hint-btn sm" onClick={startCompetition}>開始競賽 →</button>
          </div>
        )}
        {phase === 'scoring' && (
          <div className="arena-alert phase-alert" role="status"><span className="alert-text"><IconScoring /> 時間到，評分 AI 正在為第 {round} 回合評分…</span></div>
        )}
        {phase === 'between' && (
          <div className="arena-alert phase-alert next" role="status">
            <span className="alert-text">
              {suggestStatus[round] === 'generating' ? <i className="sg-spinner" aria-hidden="true" /> : <IconCheckCircle />} 第 {round} 回合結束，AI 評分完成。
              {suggestStatus[round] === 'generating' ? 'AI 正在產生本回合改善建議（不影響開始下一回合）…' : '先看本回合改善建議，準備好再開始下一回合（學生的對話記憶會清空）。'}
            </span>
            {suggestStatus[round] === 'ready' && <button type="button" className="arena-tool-btn" onClick={() => openSuggestion(round)}>本回合改善建議</button>}
            <button type="button" className="hint-btn sm" onClick={startNextRound}>開始第 {round + 1} 回合 →</button>
          </div>
        )}
        {phase === 'finished' && (
          <div className="arena-alert phase-alert next" role="status">
            <span className="alert-text">
              {suggestStatus[round] === 'generating' ? <i className="sg-spinner" aria-hidden="true" /> : <IconFlag />} 所有 {rounds} 回合都結束了，AI 評分完成。
              {suggestStatus[round] === 'generating' ? '整場 4D 總結產生中…' : '可以看整場 4D 總結，或前往評分。'}
            </span>
            {suggestStatus[round] === 'ready' && <button type="button" className="arena-tool-btn" onClick={() => openSuggestion(round)}>整場 4D 總結</button>}
            <button type="button" className="hint-btn sm" onClick={endCompetition}>前往評分 →</button>
          </div>
        )}

        {config.caseData && (
          <section className="arena-question" aria-label="本題題目">
            <div className="arena-question-head">
              <span className="arena-question-kicker">本題題目</span>
              <button type="button" className="arena-question-toggle" aria-expanded={questionMore} onClick={() => setQuestionMore((v) => !v)}>
                {questionMore ? '收起 ▲' : '看完整題目 ▼'}
              </button>
            </div>
            <p className="arena-question-bg">{config.caseData.bg}</p>
            {config.caseData.task && <p className="arena-question-task"><span>目標</span>{config.caseData.task}</p>}
            <div className="arena-question-tension"><span>兩難</span>{config.caseData.tension}</div>
            {config.note && <p className="arena-question-note"><b>老師補充</b>{config.note}</p>}
            {questionMore && (
              <div className="arena-question-more">
                <div>
                  <h4>角色與立場</h4>
                  <ul>{config.caseData.roles.split('\n').map((line) => <li key={line}>{line}</li>)}</ul>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="arena-dashboard">
          <section className="arena-panel arena-teams-panel" aria-labelledby="teams-heading">
            <div className="arena-section-heading">
              <div>
                <h3 id="teams-heading">隊伍戰況</h3>
                <p>{submittedTeams} / {TEAMS.length} 隊全員已提交・點任一隊查看細節</p>
              </div>
            </div>

            <div className="arena-team-grid">
              {TEAMS.map((team, idx) => {
                const cov = covByTeam[team.name]
                const isLeading = cov === leadingCov && Object.values(covByTeam).filter((v) => v === leadingCov).length === 1
                return (
                  <button
                    key={team.name}
                    className={`arena-team-card pop-in${team.stalled ? ' stalled' : ''}${isLeading ? ' leading' : ''}`}
                    style={{ animationDelay: `${idx * 0.05}s`, '--team-color': team.dot, '--team-progress': `${cov}%` }}
                    onClick={() => onOpenTeam(team.name)}
                    type="button"
                    aria-label={`查看${team.name}，目前${team.status}，已提交 ${team.submitted} / ${team.members} 人，解方覆蓋率 ${cov}%`}
                  >
                    <div className="arena-team-top">
                      <div className="arena-team-identity">
                        <span className="arena-team-mark">{team.name.slice(0, 1)}</span>
                        <span className="arena-team-name">{team.name}</span>
                        {isLeading && <span className="arena-leading-tag"><IconCrown size={12} /> 領先</span>}
                      </div>
                      <span className="arena-team-status"><i />{team.status}</span>
                    </div>
                    <div className="arena-coverage-row"><span>已提交</span><strong>{team.submitted}<small> / {team.members} 人</small></strong></div>
                    <div className="arena-coverage-row"><span>解方覆蓋率（即時）</span><strong>{cov}<small>%</small></strong></div>
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

        </div>

        <section className="arena-more" aria-label="更多資訊">
          <div className="arena-more-title">更多即時資訊 <span>點選卡片開啟詳細內容</span></div>
          <div className="arena-more-grid">
            <button type="button" className="arena-more-card tone-submit" onClick={() => setTab('submit')}>
              <span className="arena-more-icon" aria-hidden="true">
                {/* 繳交：剪貼板＋打勾 */}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="4.5" width="14" height="16" rx="2.2" />
                  <path d="M9 4.5V3.6c0-.6.4-1.1 1-1.1h4c.6 0 1 .5 1 1.1v.9" />
                  <path d="M8.8 12.6l2.3 2.3 4.2-4.6" />
                </svg>
              </span>
              <span className="arena-more-main">
                <b>繳交情況</b>
                <small>{submittedPeople} / {totalPeople} 人已提交・{submittedTeams} 隊全員提交</small>
              </span>
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
            <button type="button" className={`arena-more-card tone-suggest${latestReady ? '' : ' empty'}`} onClick={() => latestReady && openSuggestion(latestReady)} disabled={!latestReady}>
              <span className="arena-more-icon" aria-hidden="true">
                {generatingNow ? <i className="sg-spinner" /> : (<>
                {/* 改善建議：燈泡 */}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6" /><path d="M10 21h4" />
                  <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z" />
                </svg>
                </>)}
              </span>
              <span className="arena-more-main">
                <b>改善建議</b>
                <small>{generatingNow ? '建議產生中…' : latestReady ? `第 ${latestReady} 回合的 4D 建議（只有你看得到）` : '每回合評分完成後產生'}</small>
              </span>
              {latestReady && <span className="arena-more-go" aria-hidden="true">查看 ↗</span>}
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

        <Modal show={tab === 'submit'} onClose={() => setTab(null)} boxClassName="arena-modal" boxStyle={{ maxWidth: 520 }} labelledBy="submit-modal-title">
          <div className="modal-head" id="submit-modal-title">
            <div className="name">繳交情況</div>
            <div className="arena-modal-sub">學生完成後按「提交」送出個人結果；時間還沒到但都提交了，可以按「結束第 {round} 回合」提早進入評分</div>
          </div>
          <div className="arena-4d-list">
            {TEAMS.map((team) => (
              <div className={`arena-4d-row${team.submitted === team.members ? ' done' : ''}`} key={team.name} style={{ '--d4-color': team.dot }}>
                <span className="arena-4d-name">{team.name}</span>
                <span className="arena-4d-track"><i style={{ width: `${(team.submitted / team.members) * 100}%` }} /></span>
                <span className="arena-4d-pct">{team.submitted}/{team.members}</span>
              </div>
            ))}
          </div>
          <div className="arena-4d-tip">時間到還沒提交的同學，以聊天室中的最終結果作為個人結果。</div>
        </Modal>

        <Modal show={tab === 'feed'} onClose={() => setTab(null)} boxClassName="arena-modal" boxStyle={{ maxWidth: 560 }} labelledBy="feed-modal-title">
          <div className="modal-head" id="feed-modal-title">
            <div className="name">即時動態</div>
            <div className="arena-modal-sub">知識地圖的新面向、繳交與教師推送的紀錄（即時，不是正式評分）</div>
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

        <Modal show={tab === 'suggest' && suggestRound !== null} onClose={() => setTab(null)} boxClassName="arena-modal" boxStyle={{ maxWidth: 820 }} labelledBy="suggest-modal-title">
          {suggestRound !== null && (
            <>
              <div className="modal-head" id="suggest-modal-title">
                <div className="name">{suggestRound >= rounds ? '整場 4D 總結' : `第 ${suggestRound} 回合改善建議`}</div>
                <div className="arena-modal-sub">評分 AI 依這回合全班的評分結果整理，以學生使用 4D 的狀況為主</div>
              </div>
              {readyRounds.length > 1 && (
                <div className="rs-round-switch" role="tablist" aria-label="選擇回合">
                  {readyRounds.map((r) => (
                    <button type="button" role="tab" aria-selected={suggestRound === r} className={suggestRound === r ? 'on' : ''} key={r} onClick={() => setSuggestRound(r)}>第 {r} 回合</button>
                  ))}
                </div>
              )}
              {suggestStatus[suggestRound] !== 'ready' ? (
                <div className="sg-loading" role="status">
                  <i className="sg-spinner lg" aria-hidden="true" />
                  <b>AI 正在產生{suggestRound >= rounds ? '整場 4D 總結' : `第 ${suggestRound} 回合改善建議`}…</b>
                  <span>評分 AI 正在整理全班這回合的 4D 狀況，產生好之後會直接顯示在這裡。{suggestRound < rounds ? '產生中也可以先關掉視窗、開始下一回合，之後再到「改善建議」卡片看。' : ''}</span>
                </div>
              ) : (<>
              <RoundSuggestion suggestion={roundSuggestion(suggestRound, rounds)} onUseHint={addHintDraft} addedHints={hintDrafts.map((d) => d.text)} />
              {suggestRound < rounds && (
                <div className="sg-compose">
                  <div className="sg-compose-head">
                    <b>提示條待送清單<small>可以放很多則，每一則各自選要送給全班或哪幾隊</small></b>
                    <button type="button" className="sg-add-btn" onClick={() => addHintDraft()}>＋ 新增一則</button>
                  </div>
                  {hintDrafts.length === 0 ? (
                    <p className="sg-empty">按上面的「帶入提示條」，或「＋ 新增一則」自己寫。</p>
                  ) : (
                    <ol className="sg-drafts">
                      {hintDrafts.map((d, idx) => (
                        <li key={d.id}>
                          <div className="sg-draft-top">
                            <span className="sg-draft-no">{idx + 1}</span>
                            <textarea value={d.text} aria-label={`第 ${idx + 1} 則提示條`} placeholder="輸入提示條文字……" onChange={(e) => updateHintDraft(d.id, { text: e.target.value })} />
                            <button type="button" className="sg-draft-remove" aria-label={`刪掉第 ${idx + 1} 則`} onClick={() => setHintDrafts((list) => list.filter((x) => x.id !== d.id))}>×</button>
                          </div>
                          <div className="sg-draft-bottom">
                            <div className="sg-targets" role="group" aria-label="送給誰（可以多選）">
                              <button type="button" className={d.targets.includes('all') ? 'on' : ''} aria-pressed={d.targets.includes('all')} onClick={() => toggleHintTarget(d.id, 'all')}>全班</button>
                              {TEAMS.map((team) => {
                                const key = team.name.slice(0, 1)
                                return <button type="button" key={key} className={d.targets.includes(key) ? 'on' : ''} aria-pressed={d.targets.includes(key)} style={{ '--team-color': team.dot }} onClick={() => toggleHintTarget(d.id, key)}>{team.name}</button>
                              })}
                            </div>
                            <button type="button" className="sg-send-one" disabled={!canSendHint || !draftReady(d)} title={canSendHint ? '' : sendBlockedReason} onClick={() => sendHintDrafts([d.id])}>{canSendHint ? '送出這則' : '作答中才能送出'}</button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="sg-compose-row">
                    <span>
                      {hintDrafts.some((d) => !draftReady(d)) ? '有提示條還沒寫文字或還沒選隊伍，那幾則不會送出。' : ''}
                      {canSendHint ? '' : sendBlockedReason}
                    </span>
                    <button type="button" className="hint-btn sm" disabled={!canSendHint || !hintDrafts.some(draftReady)} onClick={() => sendHintDrafts(hintDrafts.map((d) => d.id))}>
                      全部送出（{hintDrafts.filter(draftReady).length} 則）
                    </button>
                  </div>
                </div>
              )}
              </>)}
            </>
          )}
        </Modal>

        <Modal show={tab === 'map'} onClose={() => setTab(null)} boxClassName="arena-modal" boxStyle={{ maxWidth: 1120 }} labelledBy="map-modal-title">
          <div className="modal-head" id="map-modal-title">
            <div className="name">集體知識地圖</div>
            <div className="arena-modal-sub">面向偵測 AI 每隊每 1～2 分鐘更新一次，只看「有沒有談到」，不是正式評分；學生端也看得到這張地圖</div>
          </div>
          <KnowledgeMap topic={config.caseName} nodes={kmap} flash={kmapFlash} />
        </Modal>
      </section>

      {createPortal(
        <div className="arena-fab-wrap" ref={alertsRef}>
          {alertsOpen && (
            <div className="arena-fab-panel" role="dialog" aria-label="需要你注意">
              <div className="arena-fab-head">
                <div>
                  <h3>需要你注意</h3>
                  <p>只列出需要老師介入的狀況</p>
                </div>
                <button type="button" className="arena-fab-close" aria-label="關閉" onClick={() => setAlertsOpen(false)}>×</button>
              </div>
              {visibleAlerts.length === 0 ? (
                <div className="arena-fab-empty">✓ 目前一切順利</div>
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
          )}
          <button
            type="button"
            className={`arena-fab${visibleAlerts.length === 0 ? ' calm' : ''}${alertsOpen ? ' open' : ''}`}
            aria-expanded={alertsOpen}
            aria-label={visibleAlerts.length === 0 ? '需要你注意：目前一切順利' : `需要你注意：${visibleAlerts.length} 件`}
            onClick={() => setAlertsOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {visibleAlerts.length === 0
                ? <path d="M5 12.5l4.5 4.5L19 7.5" />
                : (<><path d="M6 10.5a6 6 0 0 1 12 0v3.3l1.6 2.7H4.4L6 13.8z" /><path d="M9.5 19a2.5 2.5 0 0 0 5 0" /></>)}
            </svg>
            {visibleAlerts.length > 0 && <span className="arena-fab-count">{visibleAlerts.length}</span>}
          </button>
        </div>,
        document.body,
      )}
    </div>
  )
}
