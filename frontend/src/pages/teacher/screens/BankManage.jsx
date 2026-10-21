import { useState } from 'react'
import Modal from '../components/Modal.jsx'
import { IconGlobe, IconLock, IconExpand, IconTrash, IconEdit, CategoryBadge } from '../icons.jsx'
import { FIXED_QUESTION_COUNT, UNCATEGORIZED, BANK_LEVELS as LEVELS } from '../data.js'

const EMPTY_FORM = {
  name: '', diff: '困難', category: '', industry: '', bg: '', roles: '', gap: '', tension: '', checklist: '', trap: '', publish: 'public',
}

const LEVEL_ORDER = LEVELS.map((l) => l.name)

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

/*
  題庫管理：不再自己放大卡片，要看哪一類由側邊欄決定（題庫管理 > 依分類／依難度 > 項目）。
  filter = { type: 'all' | 'category' | 'level', value }，由 TeacherApp 保存。
*/
export default function BankManage({ bank, categories, onDeleteCategory, onAddCategory, filter, onFilterChange, onAddCase, onUpdateCase, onDeleteCase }) {
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [newCaseOpen, setNewCaseOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingIdx, setEditingIdx] = useState(null) // 不是 null 時，表單是在修改這個索引的題庫，而不是新增

  const selected = selectedIdx !== null ? bank[selectedIdx] : null
  const groupKey = filter.type === 'level' ? 'diff' : 'category'
  const currentGroup = filter.type === 'all' ? null : (filter.type === 'level' ? LEVELS : categories).find((g) => g.name === filter.value)
  const inGroup = (b) => filter.type === 'all' || b[groupKey] === filter.value
  const shown = bank.filter(inGroup)
  const groupWord = filter.type === 'level' ? '難度' : '分類'

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

  // 新增與修改共用同一份表單；修改時保留原本的來源（source），其他欄位用表單內容覆蓋
  function handleSubmit() {
    const name = form.name.trim()
    if (!name) return
    const checklistArr = form.checklist.trim()
      ? form.checklist.trim().split('\n').map((s) => s.trim()).filter(Boolean)
      : ['（尚未填寫檢查清單）']
    const built = {
      name,
      diff: form.diff,
      category: form.category,
      industry: form.industry || '未分類',
      source: 'own',
      publish: form.publish,
      questionCount: FIXED_QUESTION_COUNT,
      owner: form.publish === 'public' ? '張欣綠（公開）' : '張欣綠（僅本人）',
      bg: form.bg || '（尚未填寫情境背景）',
      roles: form.roles || '（尚未填寫角色與立場）',
      gap: form.gap || '（尚未填寫資訊落差／限制）',
      tension: form.tension || '（尚未填寫兩難張力）',
      checklist: checklistArr,
      trap: form.trap || '（尚未標記已知幻覺陷阱）',
    }
    if (editingIdx !== null) onUpdateCase(editingIdx, { ...bank[editingIdx], ...built })
    else onAddCase(built)
    // 題庫如果不在目前看的難度／分類裡，就跳到它所屬的那一個，才看得到剛建立／修改的題庫
    if (filter.type === 'level') onFilterChange('level', form.diff)
    if (filter.type === 'category') onFilterChange('category', form.category)
    closeCaseForm()
  }

  function closeCaseForm() {
    setNewCaseOpen(false)
    setEditingIdx(null)
    setForm(EMPTY_FORM)
  }

  // 修改：把原本的內容帶進表單；建立時自動補的「（尚未填寫…）」佔位文字還原成空白，免得被當成真的內容
  function startEdit() {
    if (!selected) return
    const blank = (v) => (v.startsWith('（尚未') ? '' : v)
    setForm({
      name: selected.name,
      diff: selected.diff,
      category: categories.some((c) => c.name === selected.category) ? selected.category : (categories[0]?.name ?? ''),
      industry: selected.industry === '未分類' ? '' : selected.industry,
      bg: blank(selected.bg),
      roles: blank(selected.roles),
      gap: blank(selected.gap),
      tension: blank(selected.tension),
      checklist: selected.checklist.filter((c) => !c.startsWith('（尚未')).join('\n'),
      trap: blank(selected.trap),
      publish: selected.publish,
    })
    setEditingIdx(selectedIdx)
    setSelectedIdx(null)
    setNewCaseOpen(true)
  }

  const canDeleteCategory = filter.type === 'category' && filter.value !== UNCATEGORIZED.name

  function handleDeleteCategory() {
    const n = bank.filter((b) => b.category === filter.value).length
    const note = n > 0 ? `裡面的 ${n} 個題庫不會被刪除，會移到「未分類」。` : '這個分類目前沒有題庫。'
    if (window.confirm(`確定要刪除「${filter.value}」這個分類嗎？${note}`)) onDeleteCategory(filter.value)
  }

  function openNewCase() {
    const base = { ...EMPTY_FORM }
    if (filter.type === 'level') base.diff = filter.value
    if (filter.type === 'category') base.category = filter.value
    // 分類是老師自己增減的，表單裡的分類如果還沒選或已經被刪掉，就預設選第一個
    if (!categories.some((c) => c.name === base.category)) base.category = categories[0]?.name ?? ''
    setEditingIdx(null)
    setForm(base)
    setNewCaseOpen(true)
  }

  // 列表上方的「全部／依分類／依難度」切換：跟側邊欄共用同一個 filter，兩邊選的永遠一樣
  const viewGroups = filter.type === 'level' ? LEVELS : categories
  function pickView(type) {
    if (type === 'all') onFilterChange('all', null)
    else if (type !== filter.type) {
      // 切過去時先選第一個有題目的分類／難度，避免一切換就看到空的
      const groups = type === 'level' ? LEVELS : categories
      const key = type === 'level' ? 'diff' : 'category'
      const first = groups.find((g) => bank.some((b) => b[key] === g.name)) ?? groups[0]
      onFilterChange(type, first?.name ?? null)
    }
  }

  return (
    <>
      <div className="bk-view-bar" role="group" aria-label="題庫查看方式">
        <div className="bk-view-tabs">
          {[['all', '全部'], ['category', '依分類'], ['level', '依難度']].map(([type, label]) => (
            <button type="button" key={type} className={filter.type === type ? 'on' : ''} aria-pressed={filter.type === type} onClick={() => pickView(type)}>{label}</button>
          ))}
        </div>
        {filter.type !== 'all' && (
          <div className="bk-view-chips">
            {viewGroups.map((g) => {
              const count = bank.filter((b) => b[groupKey] === g.name).length
              return (
                <button type="button" key={g.name} className={filter.value === g.name ? 'on' : ''} aria-pressed={filter.value === g.name} style={{ '--chip': g.tone }} onClick={() => onFilterChange(filter.type, g.name)}>
                  {g.name}<i>{count}</i>
                </button>
              )
            })}
            {/* 依分類時，最後一顆是「新增分類」，打開跟側邊欄同一個新增分類視窗；新增後會直接選到新的分類 */}
            {filter.type === 'category' && (
              <button type="button" className="bk-chip-add" onClick={onAddCategory}>＋ 新增分類</button>
            )}
          </div>
        )}
      </div>

      <div className="bk-level-bar" style={currentGroup ? { '--lv': currentGroup.tone } : undefined}>
        <h3>
          {currentGroup
            ? <>{filter.type === 'category' ? <CategoryBadge name={filter.value} tone={currentGroup?.tone} size={36} /> : <span aria-hidden="true">{currentGroup.mark}</span>} {filter.value}</>
            : '全部題庫'}
        </h3>
        <small>{currentGroup ? `${groupWord === '難度' ? '依難度' : '依分類'} · ` : ''}共 {shown.length} 個題庫{currentGroup ? '' : '，可以用上面的「依分類」「依難度」篩選'}</small>
        <div className="bk-head-actions">
          {canDeleteCategory && <button type="button" className="hint-btn ghost sm danger-btn" onClick={handleDeleteCategory}><IconTrash size={14} /> 刪除此分類</button>}
          {shown.length > 0 && <button type="button" className="hint-btn ghost sm" onClick={openNewCase}>＋ 新增題庫</button>}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="bk-empty">
          <p>{filter.type === 'all' ? '還沒有題庫。' : `這個${groupWord}還沒有題庫。`}</p>
          <button type="button" className="hint-btn sm" onClick={openNewCase}>＋ 新增{filter.value ?? ''}{filter.type === 'level' ? '難度的' : ''}題庫</button>
        </div>
      ) : (
        <div className="bank-list" style={{ marginTop: 18 }} key={`${filter.type}-${filter.value}`}>
          {bank.map((b, idx) => ({ b, idx })).filter(({ b }) => inGroup(b)).sort((x, y) => LEVEL_ORDER.indexOf(x.b.diff) - LEVEL_ORDER.indexOf(y.b.diff)).map(({ b, idx }, order) => (
            <div className="bank-item-card pop-in" style={{ animationDelay: `${Math.min(order, 8) * 0.04}s` }} key={b.name + idx}>
              <button className="bank-card-toggle" onClick={() => setSelectedIdx(idx)}>
                <div className="top"><div className="name">{b.name}</div><span className="bic-badge diff">{b.diff}</span></div>
                <div className="badges"><BankBadges b={b} /></div>
                <div className="desc">{b.bg.slice(0, 60)}……</div>
                <div className="meta2">
                  分類：{b.category} · 題目數：{b.questionCount} 題 · 產業：{b.industry} · 建立者：{b.owner}
                  <span className="expand-arrow"><IconExpand size={12} /> 查看完整內容</span>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal show={selected !== null} onClose={() => setSelectedIdx(null)} labelledBy="bankModalTitle">
        {selected && (
          <>
            <div className="modal-head" id="bankModalTitle">
              <div className="name">{selected.name} <span className="bic-badge diff">{selected.diff}</span></div>
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
            <div className="bank-detail-row"><div className="bdl">題目數</div><div className="bdv">{selected.questionCount} 題</div></div>
            <div className="bank-detail-row"><div className="bdl">分類</div><div className="bdv">{selected.category}</div></div>
            <div className="bank-detail-row"><div className="bdl">產業</div><div className="bdv">{selected.industry}</div></div>
            <div className="bank-detail-row">
              <div className="bdl">公開狀態</div>
              <div className="bdv">{selected.publish === 'public' ? <><IconGlobe size={12} /> 公開（所有教師可用）</> : <><IconLock size={12} /> 僅本人可用</>}</div>
            </div>
            <div className="modal-danger-row">
              {selected.source === 'sys'
                ? <span className="locked-note"><IconLock size={12} /> 系統內建題庫，無法自行修改或刪除</span>
                : (
                  <>
                    <button className="hint-btn ghost sm" onClick={startEdit}><IconEdit size={14} /> 修改這個題庫</button>
                    <button className="hint-btn sm danger-btn" onClick={handleDelete}><IconTrash size={14} /> 刪除這個題庫</button>
                  </>
                )}
            </div>
          </>
        )}
      </Modal>

      <Modal show={newCaseOpen} onClose={closeCaseForm} labelledBy="newCaseModalTitle">
        <div className="modal-head" id="newCaseModalTitle">
          <div className="name">{editingIdx !== null ? '修改題庫' : '新增題庫'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>依欄位模板填寫，{editingIdx !== null ? '儲存後會直接更新這個題庫' : '建立後可選擇是否公開給他人使用'}・<span className="required-mark">＊</span> 為必填欄位</div>
        </div>
        <div className="case-form" style={{ marginTop: 16 }}>
          <label>案例名稱<span className="required-mark">＊</span></label>
          <input type="text" placeholder="例：新品定價兩難" value={form.name} onChange={updateField('name')} />
          <label>難度<span className="required-mark">＊</span></label>
          <select value={form.diff} onChange={updateField('diff')}>
            {LEVELS.map((l) => <option key={l.name}>{l.name}</option>)}
          </select>
          <label>分類<span className="required-mark">＊</span></label>
          <select value={form.category} onChange={updateField('category')}>
            {categories.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
          <label>產業<span className="required-mark">＊</span></label>
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
          <div className="eyebrow" style={{ marginBottom: 8 }}>是否公開給他人使用？</div>
          {/* 二選一；選了哪一個，就在那個選項後面用小紅字說明誰可以用這份題庫 */}
          {[['public', '公開', '任何教師均可使用此題庫'], ['private', '不公開', '僅本人可使用']].map(([value, label, note]) => (
            <label className="radio-line" key={value}>
              <input type="radio" name="cfPublish" checked={form.publish === value} onChange={() => setForm((f) => ({ ...f, publish: value }))} /> {label}
              {form.publish === value && <span className="publish-note">{note}</span>}
            </label>
          ))}
        </div>
        <button className="hint-btn sm" style={{ marginTop: 14 }} onClick={handleSubmit}>{editingIdx !== null ? '儲存修改' : '建立題庫'}</button>
      </Modal>
    </>
  )
}
