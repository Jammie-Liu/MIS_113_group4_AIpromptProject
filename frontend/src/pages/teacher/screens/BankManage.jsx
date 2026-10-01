import { useState } from 'react'
import Modal from '../components/Modal.jsx'
import { IconGlobe, IconLock, IconExpand, IconTrash } from '../icons.jsx'
import { FIXED_ROUNDS } from '../data.js'

const EMPTY_FORM = {
  name: '', diff: '黃金', industry: '', bg: '', roles: '', gap: '', tension: '', checklist: '', trap: '', publish: 'public',
}

function BankBadges({ b }) {
  return (
    <>
      {b.source === 'sys'
        ? <span className="bic-badge sys">系統內建</span>
        : <span className="bic-badge sys" style={{ background: 'var(--paper)', color: 'var(--ink-soft)' }}>教師建立</span>}
      {b.publish === 'public'
        ? <span className="bic-badge pub"><IconGlobe size={12} /> 公開（所有教師可用）</span>
        : <span className="bic-badge priv"><IconLock size={12} /> 僅本人可用</span>}
    </>
  )
}

export default function BankManage({ bank, onAddCase, onDeleteCase }) {
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [newCaseOpen, setNewCaseOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const selected = selectedIdx !== null ? bank[selectedIdx] : null

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handleDelete() {
    if (!selected) return
    if (window.confirm(`確定要刪除「${selected.name}」這個題庫嗎？此動作無法復原。`)) {
      onDeleteCase(selectedIdx)
      setSelectedIdx(null)
    }
  }

  function handleCreate() {
    const name = form.name.trim()
    if (!name) return
    const checklistArr = form.checklist.trim()
      ? form.checklist.trim().split('\n').map((s) => s.trim()).filter(Boolean)
      : ['（尚未填寫檢查清單）']
    onAddCase({
      name,
      diff: form.diff,
      industry: form.industry || '未分類',
      source: 'own',
      publish: form.publish,
      rounds: FIXED_ROUNDS,
      owner: form.publish === 'public' ? '張欣綠（公開）' : '張欣綠（僅本人）',
      bg: form.bg || '（尚未填寫情境背景）',
      roles: form.roles || '（尚未填寫角色與立場）',
      gap: form.gap || '（尚未填寫資訊落差／限制）',
      tension: form.tension || '（尚未填寫兩難張力）',
      checklist: checklistArr,
      trap: form.trap || '（尚未標記已知幻覺陷阱）',
    })
    setForm(EMPTY_FORM)
    setNewCaseOpen(false)
  }

  return (
    <>
      <div className="course-head">
        <div><h2>題庫管理</h2><div className="meta">系統提供給競賽使用的商業兩難案例題庫</div></div>
        <button className="hint-btn" onClick={() => setNewCaseOpen(true)}>＋ 新增題庫</button>
      </div>

      <div className="bank-list" style={{ marginTop: 18 }}>
        {bank.map((b, idx) => (
          <div className="bank-item-card" key={b.name + idx}>
            <button className="bank-card-toggle" onClick={() => setSelectedIdx(idx)}>
              <div className="top"><div className="name">{b.name}</div><span className="bic-badge diff">{b.diff}難度</span></div>
              <div className="badges"><BankBadges b={b} /></div>
              <div className="desc">{b.bg.slice(0, 60)}……</div>
              <div className="meta2">
                回合數：{b.rounds} · 產業：{b.industry} · 建立者：{b.owner}
                <span className="expand-arrow"><IconExpand size={12} /> 查看完整內容</span>
              </div>
            </button>
          </div>
        ))}
      </div>

      <Modal show={selected !== null} onClose={() => setSelectedIdx(null)} labelledBy="bankModalTitle">
        {selected && (
          <>
            <div className="modal-head" id="bankModalTitle">
              <div className="name">{selected.name} <span className="bic-badge diff">{selected.diff}難度</span></div>
              <div className="badges"><BankBadges b={selected} /></div>
            </div>
            <div className="bank-detail-row"><div className="bdl">情境背景</div><div className="bdv">{selected.bg}</div></div>
            <div className="bank-detail-row"><div className="bdl">角色與立場</div><div className="bdv" style={{ whiteSpace: 'pre-line' }}>{selected.roles}</div></div>
            <div className="bank-detail-row"><div className="bdl">資訊落差／限制</div><div className="bdv">{selected.gap}</div></div>
            <div className="bank-detail-row"><div className="bdl">兩難張力</div><div className="bdv">{selected.tension}</div></div>
            <div className="bank-detail-row">
              <div className="bdl">完整解方檢查清單</div>
              <div className="bdv"><div className="bank-detail-chips">{selected.checklist.map((c, i) => <span className="bank-detail-chip" key={i}>{c}</span>)}</div></div>
            </div>
            <div className="bank-detail-row"><div className="bdl">已知幻覺陷阱</div><div className="bdv">{selected.trap}</div></div>
            <div className="bank-detail-row"><div className="bdl">回合數</div><div className="bdv">{selected.rounds} 回合</div></div>
            <div className="bank-detail-row"><div className="bdl">產業／情境類別</div><div className="bdv">{selected.industry}</div></div>
            <div className="bank-detail-row">
              <div className="bdl">公開狀態</div>
              <div className="bdv">{selected.publish === 'public' ? <><IconGlobe size={12} /> 公開（所有教師可用）</> : <><IconLock size={12} /> 僅本人可用</>}</div>
            </div>
            <div className="modal-danger-row">
              {selected.source === 'sys'
                ? <span className="locked-note"><IconLock size={12} /> 系統內建題庫，無法自行刪除</span>
                : <button className="hint-btn sm danger-btn" onClick={handleDelete}><IconTrash size={14} /> 刪除這個題庫</button>}
            </div>
          </>
        )}
      </Modal>

      <Modal show={newCaseOpen} onClose={() => setNewCaseOpen(false)} labelledBy="newCaseModalTitle">
        <div className="modal-head" id="newCaseModalTitle">
          <div className="name">新增題庫</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>依欄位模板填寫，建立後可選擇是否提供給系統・<span className="required-mark">＊</span> 為必填欄位</div>
        </div>
        <div className="case-form" style={{ marginTop: 16 }}>
          <label>案例名稱<span className="required-mark">＊</span></label>
          <input type="text" placeholder="例：新品定價兩難" value={form.name} onChange={updateField('name')} />
          <label>難度<span className="required-mark">＊</span></label>
          <select value={form.diff} onChange={updateField('diff')}>
            <option>青銅</option><option>白銀</option><option>黃金</option><option>鑽石</option>
          </select>
          <label>產業／情境類別<span className="required-mark">＊</span></label>
          <input type="text" placeholder="例：零售、製造、新創……" value={form.industry} onChange={updateField('industry')} />
          <label>情境背景<span className="required-mark">＊</span></label>
          <textarea placeholder="描述具體情境：公司規模、現況數字、事件起因……" value={form.bg} onChange={updateField('bg')} />
          <label>角色與立場<span className="required-mark">＊</span></label>
          <textarea placeholder="至少 2-3 個利害關係人，立場互相衝突，一行一位" value={form.roles} onChange={updateField('roles')} />
          <label>資訊落差／限制</label>
          <textarea placeholder="故意留白或矛盾的資訊，逼玩家用提示去問出而非假設" value={form.gap} onChange={updateField('gap')} />
          <label>兩難張力（一句話）<span className="required-mark">＊</span></label>
          <input type="text" placeholder="例：省成本 vs 品牌信任" value={form.tension} onChange={updateField('tension')} />
          <label>完整解方檢查清單<span className="required-mark">＊</span></label>
          <textarea placeholder={'每行一項，例：\n財務影響量化\n替代方案比較\n執行時程與風險'} value={form.checklist} onChange={updateField('checklist')} />
          <label>已知幻覺陷阱<span className="required-mark">＊</span></label>
          <textarea placeholder="預先標記 AI 很可能編造的數字或事實，供評審引擎比對" value={form.trap} onChange={updateField('trap')} />
        </div>
        <div className="publish-row">
          <div className="eyebrow" style={{ marginBottom: 8 }}>是否提供給系統？</div>
          <label className="radio-line"><input type="radio" name="cfPublish" checked={form.publish === 'public'} onChange={() => setForm((f) => ({ ...f, publish: 'public' }))} /> 願意提供給系統 — 其他教師也能在自己的課程使用這份題庫</label>
          <label className="radio-line"><input type="radio" name="cfPublish" checked={form.publish === 'private'} onChange={() => setForm((f) => ({ ...f, publish: 'private' }))} /> 不提供 — 僅本人課程可見與使用</label>
        </div>
        <button className="hint-btn sm" style={{ marginTop: 14 }} onClick={handleCreate}>建立題庫</button>
      </Modal>
    </>
  )
}
