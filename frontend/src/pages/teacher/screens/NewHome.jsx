import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { averageScore, formatTime, sortByAverage } from '../library.js'

/*
  新版教師首頁（docs/system-flow.md 八）：
  1. 「進行中的競賽」：已建立、還沒結束，點了進監控台。標題旁邊「查看歷史競賽紀錄」開另一個畫面（screens/History.jsx）。
  2. 「題庫」：工具列左邊切「我的題庫」／「共享題庫」，右邊是標籤篩選器（不做搜尋）。
     題庫一律依平均分數由高到低排，還沒有分數的排最後。
  3. 畫面最下面正中間固定一顆「＋」：選「新增題庫」或「發起競賽」，捲到哪裡都按得到。
*/
export default function NewHome({ user, competitions, historyCount, mine, shared, onOpenCompetition, onOpenHistory, onOpenBank, onCreateBank, onLaunch }) {
  const [tab, setTab] = useState('mine')
  const [tags, setTags] = useState([])
  const list = tab === 'mine' ? mine : shared
  const allTags = [...new Set(list.flatMap((b) => b.tags))].sort((a, b) => a.localeCompare(b, 'zh-Hant'))
  // 切換我的／共享時，另一邊沒有的標籤自動不算
  const activeTags = tags.filter((t) => allTags.includes(t))
  const shown = sortByAverage(activeTags.length ? list.filter((b) => activeTags.some((t) => b.tags.includes(t))) : list)

  return (
    <>
      <section className="home-section" aria-labelledby="nhCompTitle">
        <div className="home-section-heading">
          <div>
            <p className="home-section-kicker">LIVE</p>
            <div className="nh-title-row">
              <h2 id="nhCompTitle">進行中的競賽</h2>
              <button type="button" className="hint-btn ghost sm" onClick={onOpenHistory}>查看歷史競賽紀錄{historyCount > 0 && <small className="nh-count">{historyCount}</small>}</button>
            </div>
            <p>{user.name}老師，這些是你已經建立、還沒結束的競賽。</p>
          </div>
        </div>
        <ActiveCompetitions competitions={competitions} onOpen={onOpenCompetition} />
      </section>

      <section className="home-section" aria-labelledby="nhBankTitle">
        <div className="home-section-heading">
          <div>
            <p className="home-section-kicker">QUESTION BANKS</p>
            <h2 id="nhBankTitle">題庫</h2>
            <p>依平均分數由高到低排列；用右邊的篩選器只看某幾類。</p>
          </div>
        </div>

        <div className="nh-toolbar">
          <div className="nh-tabs" role="tablist" aria-label="我的題庫或共享題庫">
            <button type="button" role="tab" aria-selected={tab === 'mine'} className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>我的題庫 <small>{mine.length}</small></button>
            <button type="button" role="tab" aria-selected={tab === 'shared'} className={tab === 'shared' ? 'on' : ''} onClick={() => setTab('shared')}>共享題庫 <small>{shared.length}</small></button>
          </div>
          <TagFilter allTags={allTags} list={list} selected={activeTags} onChange={setTags} />
        </div>

        {shown.length === 0 ? (
          <div className="nh-empty">{tab === 'mine' ? '你還沒有題庫，按畫面下方的「＋」新增一份。' : '目前沒有其他老師公開的題庫。'}</div>
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
                  <div className="lib-tags">{b.tags.map((t) => <span key={t} className={`lib-tag${activeTags.includes(t) ? ' on' : ''}`}>#{t}</span>)}</div>
                  <div className="nh-bank-foot">版本紀錄 {b.versions.length} 筆</div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* 留一塊空白，最下面的題庫才不會被固定的「＋」擋住 */}
      <div className="nh-fab-spacer" aria-hidden="true" />
      <AddMenu onCreateBank={onCreateBank} onLaunch={onLaunch} />
    </>
  )
}

function ActiveCompetitions({ competitions, onOpen }) {
  if (competitions.length === 0) return <div className="nh-empty">目前沒有進行中的競賽，按畫面下方的「＋」發起一場。</div>
  return (
    <div className="nh-comp-grid">
      {competitions.map((c) => (
        <button key={c.id} type="button" className="nh-comp-card pop-in" onClick={() => onOpen(c)} aria-label={`進入競賽：${c.title}`}>
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
  )
}

/*
  標籤篩選器：按鈕上顯示目前選了哪些標籤，點開是一個勾選清單。
  可以勾好幾個，題庫只要有其中「任一個」標籤就會顯示；都不勾＝全部。
*/
function TagFilter({ allTags, list, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutsideClose(open, ref, () => setOpen(false))

  function toggle(t) {
    onChange(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t])
  }

  const label = selected.length === 0 ? '全部標籤' : selected.length <= 2 ? selected.map((t) => `#${t}`).join('、') : `已選 ${selected.length} 個標籤`

  return (
    <div className="nh-filter" ref={ref}>
      <button type="button" className={`nh-filter-btn${selected.length ? ' active' : ''}`} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((v) => !v)} disabled={allTags.length === 0}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16l-6 7.5V19l-4 1.5v-8z" /></svg>
        <span>篩選：{label}</span>
        <span className="nh-filter-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="nh-filter-pop" role="group" aria-label="依標籤篩選">
          <div className="nh-filter-head">
            <span>勾選標籤（符合任一個就顯示）</span>
            <button type="button" className="lib-link" onClick={() => onChange([])} disabled={selected.length === 0}>清除</button>
          </div>
          <div className="nh-filter-list">
            {allTags.map((t) => (
              <label key={t} className={selected.includes(t) ? 'on' : ''}>
                <input type="checkbox" checked={selected.includes(t)} onChange={() => toggle(t)} />
                <span>#{t}</span>
                <small>{list.filter((b) => b.tags.includes(t)).length}</small>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function useOutsideClose(open, ref, close) {
  useEffect(() => {
    if (!open) return undefined
    function onDown(e) { if (!ref.current?.contains(e.target)) close() }
    function onKey(e) { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open, ref, close])
}

/*
  畫面最下面正中間的「＋」，點開兩個選項。
  用 createPortal 掛到 body：首頁內容外面有一層切換畫面的動畫（.screen-pop 有 transform），
  放在裡面的話 position:fixed 會變成跟著那一層走、捲動時被捲走，掛到 body 才會真的固定在視窗上。
*/
function AddMenu({ onCreateBank, onLaunch }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutsideClose(open, ref, () => setOpen(false))

  function pick(fn) {
    setOpen(false)
    fn()
  }

  return createPortal(
    <div className={`nh-fab${open ? ' open' : ''}`} ref={ref}>
      {open && (
        <div className="nh-fab-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => pick(onCreateBank)}><span aria-hidden="true">📚</span>新增題庫</button>
          <button type="button" role="menuitem" onClick={() => pick(onLaunch)}><span aria-hidden="true">🏁</span>發起競賽</button>
        </div>
      )}
      <button type="button" className="nh-fab-btn" aria-label={open ? '收起選單' : '新增題庫或發起競賽'} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)}>＋</button>
    </div>,
    document.body,
  )
}
