import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { DEFAULT_ROUNDS, DEFAULT_TIME_LIMIT, ROUND_LIMITS, TIME_LIMITS } from '../data.js'
import { GROUP_CAP, GROUP_COUNT, VERSION_LABELS, averageScore, formatTime, parseTags } from '../library.js'

function VisibilityChips({ value, onChange }) {
  return (
    <div className="cf-chips" role="radiogroup" aria-label="是否公開">
      <button type="button" role="radio" aria-checked={value === 'public'} className={value === 'public' ? 'on' : ''} onClick={() => onChange('public')}>公開</button>
      <button type="button" role="radio" aria-checked={value === 'private'} className={value === 'private' ? 'on' : ''} onClick={() => onChange('private')}>私人</button>
    </div>
  )
}

/*
  建立／編輯題庫：標題（topic）、內容描述（content）、標籤、是否公開。
  editing 是別人的題庫時，存檔會另存成「我的改編版本」，不會改到原本那份（規則見 library.js saveBank）。
*/
export function BankFormModal({ show, editing, user, onClose, onSave }) {
  const [form, setForm] = useState({ topic: '', content: '', tags: '', visibility: 'public' })
  const [tried, setTried] = useState(false)
  const isFork = Boolean(editing && editing.ownerId !== user.id)

  useEffect(() => {
    if (!show) return
    setTried(false)
    setForm(editing
      ? { topic: isFork ? `${editing.topic}（改編）` : editing.topic, content: editing.content, tags: editing.tags.join('、'), visibility: isFork ? 'public' : editing.visibility }
      : { topic: '', content: '', tags: '', visibility: 'public' })
  }, [show, editing, isFork])

  const errors = {
    topic: !form.topic.trim() ? '請填標題' : '',
    content: !form.content.trim() ? '請填內容描述' : '',
  }

  function submit(e) {
    e.preventDefault()
    setTried(true)
    if (errors.topic || errors.content) return
    onSave({ topic: form.topic.trim(), content: form.content.trim(), tags: parseTags(form.tags), visibility: form.visibility })
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const showErr = (field) => (tried && errors[field] ? <small className="field-error">{errors[field]}</small> : null)
  const title = !editing ? '新增題庫' : isFork ? '改編這份題庫' : '編輯題庫'

  return (
    <Modal show={show} onClose={onClose} labelledBy="bankFormTitle">
      <div className="modal-head" id="bankFormTitle">
        <div className="name">{title}</div>
        {/* 改編別人的題庫時留這段提醒：存檔不會改到原本那份，是規則不是說明文字 */}
        {isFork && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>
            這份是 {editing.ownerName} 的題庫。存檔後會變成你自己的一份改編版本，原本那份不會被改到；設為公開的話，你的改編會出現在原題庫的版本紀錄。
          </div>
        )}
      </div>
      <form className="case-form course-form lib-bank-form" onSubmit={submit} style={{ marginTop: 16 }}>
        <label htmlFor="bfTopic">標題<span className="required-mark">＊</span></label>
        <div className="cf-field">
          <input id="bfTopic" type="text" maxLength={40} placeholder="例：外送平台派單爭議兩難" value={form.topic} onChange={set('topic')} />
          {showErr('topic')}
        </div>
        <label htmlFor="bfContent">內容描述<span className="required-mark">＊</span></label>
        <div className="cf-field">
          <textarea id="bfContent" maxLength={800} rows={6} placeholder="議題背景、利害關係人、要學生處理的兩難" value={form.content} onChange={set('content')} />
          {showErr('content')}
        </div>
        <label htmlFor="bfTags">標籤</label>
        <div className="cf-field">
          <input id="bfTags" type="text" maxLength={80} placeholder="用逗號或空白隔開，例：行銷、定價、困難" value={form.tags} onChange={set('tags')} />
          {parseTags(form.tags).length > 0 && (
            <div className="lib-tags" aria-label="標籤預覽">{parseTags(form.tags).map((t) => <span key={t} className="lib-tag">#{t}</span>)}</div>
          )}
        </div>
        <label>是否公開<span className="required-mark">＊</span></label>
        <VisibilityChips value={form.visibility} onChange={(v) => setForm((f) => ({ ...f, visibility: v }))} />
        <div className="lib-form-actions">
          <button type="button" className="hint-btn ghost sm" onClick={onClose}>取消</button>
          <button type="submit" className="hint-btn sm">{isFork ? '另存為我的改編版本' : editing ? '儲存修改' : '建立題庫'}</button>
        </div>
      </form>
    </Modal>
  )
}

/*
  題庫詳細：內容、標籤、平均分數、版本紀錄。
  自己的題庫可以「編輯」；別人的公開題庫按「改編」會另存一份。兩種都能直接「用這份發起競賽」。
*/
export function BankDetailModal({ bank, banks, user, onClose, onEdit, onLaunch, onOpenBank }) {
  const [openVersion, setOpenVersion] = useState(null)
  useEffect(() => { setOpenVersion(null) }, [bank?.id])
  const mine = bank?.ownerId === user.id
  const avg = bank ? averageScore(bank) : null
  const origin = bank?.forkOf ? banks.find((b) => b.id === bank.forkOf.bankId) : null
  const originVisible = origin && (origin.visibility === 'public' || origin.ownerId === user.id)

  return (
    <Modal show={Boolean(bank)} onClose={onClose} labelledBy="bankDetailTitle">
      {bank && (
        <>
          <div className="modal-head" id="bankDetailTitle">
            <div className="name">{bank.topic}</div>
            <div className="lib-detail-meta">
              <span className={`lib-vis ${bank.visibility}`}>{bank.visibility === 'public' ? '公開' : '私人'}</span>
              <span>{mine ? '我建立的' : `建立者：${bank.ownerName}`}</span>
              <span>平均分數：{avg === null ? '還沒有競賽紀錄' : `${avg}（${bank.scores.length} 場）`}</span>
            </div>
            {bank.forkOf && (
              <div className="lib-fork-note">
                改編自 {bank.forkOf.ownerName} 的「{bank.forkOf.topic}」
                {originVisible && <button type="button" className="lib-link" onClick={() => onOpenBank(origin)}>看原題庫</button>}
              </div>
            )}
          </div>

          <p className="lib-detail-content">{bank.content}</p>
          {bank.tags.length > 0 && <div className="lib-tags">{bank.tags.map((t) => <span key={t} className="lib-tag">#{t}</span>)}</div>}

          <div className="lib-detail-actions">
            <button type="button" className="hint-btn ghost sm" onClick={() => onEdit(bank)}>{mine ? '編輯' : '改編成我的版本'}</button>
            <button type="button" className="hint-btn sm" onClick={() => onLaunch(bank)}>用這份發起競賽</button>
          </div>

          <section className="lib-versions" aria-label="版本紀錄">
            <h3>版本紀錄 <small>{bank.versions.length} 筆</small></h3>
            <ol>
              {[...bank.versions].reverse().map((v) => {
                const source = v.sourceBankId ? banks.find((b) => b.id === v.sourceBankId) : null
                const open = openVersion === v.id
                return (
                  <li key={v.id} className={`lib-version ${v.kind}`}>
                    <div className="lib-version-row">
                      <span className="lib-version-kind">{VERSION_LABELS[v.kind]}</span>
                      <span className="lib-version-who">{v.editorName}{v.editorId === user.id ? '（我）' : ''}</span>
                      <span className="lib-version-at mono">{formatTime(v.at)}</span>
                      <button type="button" className="lib-link" aria-expanded={open} onClick={() => setOpenVersion(open ? null : v.id)}>{open ? '收合' : '看這版內容'}</button>
                    </div>
                    {open && (
                      <div className="lib-version-body">
                        <b>{v.topic}</b>
                        <p>{v.content}</p>
                        {v.tags.length > 0 && <div className="lib-tags">{v.tags.map((t) => <span key={t} className="lib-tag">#{t}</span>)}</div>}
                        {source && source.id !== bank.id && (source.visibility === 'public' || source.ownerId === user.id) && (
                          <button type="button" className="lib-link" onClick={() => onOpenBank(source)}>打開 {v.editorName} 的改編版本 →</button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        </>
      )}
    </Modal>
  )
}

function NumberField({ id, label, value, onChange, limits, unit, hint }) {
  return (
    <>
      <label htmlFor={id}>{label}<span className="required-mark">＊</span></label>
      <div className="cf-field">
        <div className="lib-number">
          <input id={id} type="number" min={limits.min} max={limits.max} step={limits.step ?? 1} value={value} onChange={(e) => onChange(e.target.value)} />
          <span>{unit}</span>
        </div>
        {hint}
      </div>
    </>
  )
}

/*
  發起競賽：選題庫（我的題庫＋共享題庫）、組別數、每組上限人數、回合數、每回合時間。
  選到別人的公開題庫時可以先「改編後再用」，會打開改編視窗，存好後自動選到我的改編版本。
*/
export function LaunchModal({ show, initialBankId, mine, shared, onClose, onLaunch, onForkFirst }) {
  const [form, setForm] = useState({ bankId: '', groupCount: '5', groupCap: '4', rounds: String(DEFAULT_ROUNDS), timeLimit: String(DEFAULT_TIME_LIMIT) })
  const [tried, setTried] = useState(false)

  useEffect(() => {
    if (!show) return
    setTried(false)
    setForm((f) => ({ ...f, bankId: initialBankId ?? '' }))
  }, [show, initialBankId])

  const all = [...mine, ...shared]
  const bank = all.find((b) => b.id === form.bankId) ?? null
  const isShared = Boolean(bank && shared.some((b) => b.id === bank.id))
  const n = (key) => Number(form[key])
  const inRange = (key, limits) => Number.isInteger(n(key)) && n(key) >= limits.min && n(key) <= limits.max
  const errors = {
    bankId: !bank ? '請選一份題庫' : '',
    groupCount: !inRange('groupCount', GROUP_COUNT) ? `組別數要是 ${GROUP_COUNT.min}～${GROUP_COUNT.max} 的整數` : '',
    groupCap: !inRange('groupCap', GROUP_CAP) ? `每組上限要是 ${GROUP_CAP.min}～${GROUP_CAP.max} 人` : '',
    rounds: !inRange('rounds', ROUND_LIMITS) ? `回合數要是 ${ROUND_LIMITS.min}～${ROUND_LIMITS.max}` : '',
    timeLimit: !inRange('timeLimit', TIME_LIMITS) ? `每回合時間要是 ${TIME_LIMITS.min}～${TIME_LIMITS.max} 分鐘` : '',
  }
  const showErr = (field) => (tried && errors[field] ? <small className="field-error">{errors[field]}</small> : null)
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  function submit(e) {
    e.preventDefault()
    setTried(true)
    if (Object.values(errors).some(Boolean)) return
    onLaunch({ bank, groupCount: n('groupCount'), groupCap: n('groupCap'), rounds: n('rounds'), timeLimit: n('timeLimit') })
  }

  return (
    <Modal show={show} onClose={onClose} labelledBy="launchTitle">
      <div className="modal-head" id="launchTitle">
        <div className="name">發起競賽</div>
      </div>
      <form className="case-form course-form" onSubmit={submit} style={{ marginTop: 16 }}>
        <label htmlFor="lmBank">題庫<span className="required-mark">＊</span></label>
        <div className="cf-field">
          <select id="lmBank" value={form.bankId} onChange={(e) => set('bankId')(e.target.value)}>
            <option value="">請選擇題庫</option>
            {mine.length > 0 && <optgroup label="我的題庫">{mine.map((b) => <option key={b.id} value={b.id}>{b.topic}</option>)}</optgroup>}
            {shared.length > 0 && <optgroup label="共享題庫">{shared.map((b) => <option key={b.id} value={b.id}>{b.topic}（{b.ownerName}）</option>)}</optgroup>}
          </select>
          {showErr('bankId')}
          {bank && <p className="lib-launch-preview">{bank.content}</p>}
          {isShared && (
            <div className="lib-launch-fork">
              這是 {bank.ownerName} 的公開題庫，可以直接用，也可以
              <button type="button" className="lib-link" onClick={() => onForkFirst(bank)}>先改編成我的版本再用</button>
            </div>
          )}
        </div>
        <NumberField id="lmGroups" label="組別數" value={form.groupCount} onChange={set('groupCount')} limits={GROUP_COUNT} unit="組" hint={showErr('groupCount')} />
        <NumberField id="lmCap" label="每組上限人數" value={form.groupCap} onChange={set('groupCap')} limits={GROUP_CAP} unit="人"
          hint={showErr('groupCap') ?? (!errors.groupCount && !errors.groupCap ? <small className="lib-hint">最多 {n('groupCount') * n('groupCap')} 人參賽</small> : null)} />
        <NumberField id="lmRounds" label="回合數" value={form.rounds} onChange={set('rounds')} limits={ROUND_LIMITS} unit="回合" hint={showErr('rounds')} />
        <NumberField id="lmTime" label="每回合時間" value={form.timeLimit} onChange={set('timeLimit')} limits={TIME_LIMITS} unit="分鐘" hint={showErr('timeLimit')} />
        <div className="lib-form-actions">
          <button type="button" className="hint-btn ghost sm" onClick={onClose}>取消</button>
          <button type="submit" className="hint-btn sm">建立競賽</button>
        </div>
      </form>
    </Modal>
  )
}
