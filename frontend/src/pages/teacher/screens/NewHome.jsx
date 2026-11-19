import { useEffect, useRef, useState } from 'react'
import { averageScore, formatTime, sortByAverage } from '../library.js'

/*
  新版教師首頁（docs/system-flow.md 八）：
  1. 最上面：已建立、還沒結束的競賽，點了進監控台。
  2. 下面：「我的題庫」／「共享題庫」切換。不做搜尋，用標籤分類：點標籤只看有這個標籤的題庫。
     題庫一律依平均分數由高到低排，還沒有分數的排最後。
  3. 右下角「＋」：選「新增題庫」或「發起競賽」。
*/
export default function NewHome({ user, competitions, mine, shared, onOpenCompetition, onOpenBank, onCreateBank, onLaunch }) {
  const [tab, setTab] = useState('mine')
  const [tag, setTag] = useState(null)
  const list = tab === 'mine' ? mine : shared
  const tags = [...new Set(list.flatMap((b) => b.tags))].sort((a, b) => a.localeCompare(b, 'zh-Hant'))
  const activeTag = tag && tags.includes(tag) ? tag : null
  const shown = sortByAverage(activeTag ? list.filter((b) => b.tags.includes(activeTag)) : list)

  return (
    <>
      <section className="home-section" aria-labelledby="nhActiveTitle">
        <div className="home-section-heading">
          <div>
            <p className="home-section-kicker">LIVE</p>
            <h2 id="nhActiveTitle">進行中的競賽</h2>
            <p>{user.name} 老師，這些是你已經建立、還沒結束的競賽。</p>
          </div>
        </div>
        {competitions.length === 0 ? (
          <div className="nh-empty">目前沒有進行中的競賽，按右下角的「＋」發起一場。</div>
        ) : (
          <div className="nh-comp-grid">
            {competitions.map((c) => (
              <button key={c.id} type="button" className="nh-comp-card pop-in" onClick={() => onOpenCompetition(c)} aria-label={`進入競賽：${c.title}`}>
                <div className="nh-comp-top">
                  <span className="nh-live-dot" aria-hidden="true" />
                  <span>賽場代碼 <b className="mono">{c.code}</b></span>
                </div>
                <h3>{c.title}</h3>
                <ul>
                  <li>{c.groupCount} 組・每組上限 {c.groupCap} 人</li>
                  <li>{c.rounds} 回合・每回合 {c.timeLimit} 分鐘</li>
                  <li>建立於 {formatTime(c.createdAt)}</li>
                </ul>
                <div className="course-card-footer"><span>{c.stage === 'grading' ? '比賽結束，待確認評分' : '進入監控台'}</span><span className="course-arrow" aria-hidden="true">↗</span></div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="home-section" aria-labelledby="nhBankTitle">
        <div className="home-section-heading">
          <div>
            <p className="home-section-kicker">QUESTION BANKS</p>
            <h2 id="nhBankTitle">題庫</h2>
            <p>依平均分數由高到低排列；點標籤只看那一類。</p>
          </div>
          <div className="nh-tabs" role="tablist" aria-label="我的題庫或共享題庫">
            <button type="button" role="tab" aria-selected={tab === 'mine'} className={tab === 'mine' ? 'on' : ''} onClick={() => { setTab('mine'); setTag(null) }}>我的題庫 <small>{mine.length}</small></button>
            <button type="button" role="tab" aria-selected={tab === 'shared'} className={tab === 'shared' ? 'on' : ''} onClick={() => { setTab('shared'); setTag(null) }}>共享題庫 <small>{shared.length}</small></button>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="nh-tag-bar" role="group" aria-label="依標籤分類">
            <button type="button" className={!activeTag ? 'on' : ''} aria-pressed={!activeTag} onClick={() => setTag(null)}>全部</button>
            {tags.map((t) => (
              <button key={t} type="button" className={activeTag === t ? 'on' : ''} aria-pressed={activeTag === t} onClick={() => setTag(activeTag === t ? null : t)}>
                #{t} <small>{list.filter((b) => b.tags.includes(t)).length}</small>
              </button>
            ))}
          </div>
        )}

        {shown.length === 0 ? (
          <div className="nh-empty">{tab === 'mine' ? '你還沒有題庫，按右下角的「＋」新增一份。' : '目前沒有其他老師公開的題庫。'}</div>
        ) : (
          <div className="nh-bank-grid">
            {shown.map((b, idx) => {
              const avg = averageScore(b)
              return (
                <button key={b.id} type="button" className="nh-bank-card pop-in" style={{ animationDelay: `${idx * 0.03}s` }} onClick={() => onOpenBank(b)}>
                  <div className="nh-bank-top">
                    <span className="nh-rank">#{idx + 1}</span>
                    {tab === 'mine' && <span className={`lib-vis ${b.visibility}`}>{b.visibility === 'public' ? '公開' : '私人'}</span>}
                    {tab === 'shared' && <span className="nh-owner">{b.ownerName}</span>}
                    <span className={`nh-score${avg === null ? ' none' : ''}`} title={avg === null ? '還沒有用這份題庫比賽過' : `${b.scores.length} 場競賽的平均分數`}>
                      {avg === null ? '尚無分數' : <>平均 <b>{avg}</b></>}
                    </span>
                  </div>
                  <h3>{b.topic}</h3>
                  {b.forkOf && <div className="nh-fork">改編自 {b.forkOf.ownerName}</div>}
                  <p>{b.content}</p>
                  <div className="lib-tags">{b.tags.map((t) => <span key={t} className={`lib-tag${t === activeTag ? ' on' : ''}`}>#{t}</span>)}</div>
                  <div className="nh-bank-foot">版本紀錄 {b.versions.length} 筆</div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <AddMenu onCreateBank={onCreateBank} onLaunch={onLaunch} />
    </>
  )
}

// 右下角浮動「＋」：點開兩個選項，點外面或按 Escape 收起來
function AddMenu({ onCreateBank, onLaunch }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onDown(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  function pick(fn) {
    setOpen(false)
    fn()
  }

  return (
    <div className={`nh-fab${open ? ' open' : ''}`} ref={ref}>
      {open && (
        <div className="nh-fab-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => pick(onCreateBank)}><span aria-hidden="true">📚</span>新增題庫</button>
          <button type="button" role="menuitem" onClick={() => pick(onLaunch)}><span aria-hidden="true">🏁</span>發起競賽</button>
        </div>
      )}
      <button type="button" className="nh-fab-btn" aria-label={open ? '收起選單' : '新增題庫或發起競賽'} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)}>＋</button>
    </div>
  )
}
