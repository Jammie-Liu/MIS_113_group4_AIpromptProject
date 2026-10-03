const PLACES = [
  { place: 2, order: 0 },
  { place: 1, order: 1 },
  { place: 3, order: 2 },
]
const MEDAL = { 1: '1', 2: '2', 3: '3' }

// 依 place 決定要揭曉到第幾步：第 3 名 → 第 2 名 → 第 1 名
function isRevealed(place, revealed) {
  return revealed >= 4 - place
}

const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 7) * 0.12}s`,
  duration: `${2.4 + (i % 5) * 0.35}s`,
  color: ['#C5F36B', '#FFC66D', '#8C9BFF', '#F07B86', '#5FD0A0'][i % 5],
  drift: `${((i % 9) - 4) * 14}px`,
}))

export default function Podium({ ranked, revealed, onReveal }) {
  const done = revealed >= 3
  return (
    <div className={`rs-podium${done ? ' done' : ''}`}>
      {done && (
        <div className="rs-confetti" aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <i key={i} style={{ left: c.left, animationDelay: c.delay, animationDuration: c.duration, background: c.color, '--drift': c.drift }} />
          ))}
        </div>
      )}
      <div className="rs-podium-stage">
        {PLACES.map(({ place }) => {
          const item = ranked[place - 1]
          const shown = isRevealed(place, revealed)
          return (
            <div className={`rs-pod place-${place}${shown ? ' shown' : ''}`} key={place}>
              <div className="rs-pod-card">
                {shown && item ? (
                  <>
                    <span className="rs-medal">{MEDAL[place]}</span>
                    <b className="rs-pod-name">{item.team.name}</b>
                    <span className="rs-pod-score">{item.scores.total.toFixed(1)}</span>
                    <small>{item.team.members.join('、')}</small>
                  </>
                ) : (
                  <>
                    <span className="rs-medal locked">?</span>
                    <b className="rs-pod-name">第 {place} 名</b>
                    <small>尚未揭曉</small>
                  </>
                )}
              </div>
              <div className="rs-pod-base"><span>{place}</span></div>
            </div>
          )
        })}
      </div>
      {revealed === 0 && (
        <button type="button" className="rs-reveal-btn" onClick={onReveal}>揭曉名次 →</button>
      )}
    </div>
  )
}
