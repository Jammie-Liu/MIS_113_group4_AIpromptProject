import { useState } from 'react';
import { PROBLEMS, TIERS, MY_STUDENT_ID, MY_SCORES, PRACTICE_STATUS_LABEL, containsBannedWord, getPracticeState } from '../data.js';
import { IconPencil } from '../icons.jsx';
import Switch from '../components/Switch.jsx';

const DIM_ROWS = [
  ['d1', 'D1 委託'], ['d2', 'D2 描述'], ['d3', 'D3 辨識'], ['d4', 'D4 盡責'],
];

const VISIBILITY_ROWS = [
  ['studentId', '學號'], ['email', 'Email'], ['bio', '個人簡介'],
  ['d4', '4D 能力總覽'], ['practice', '教學面練習紀錄'], ['competition', '競賽面表現紀錄'],
];

function PracticeLogList({ practiceState }) {
  const [openIds, setOpenIds] = useState(() => new Set());
  const ids = Object.keys(PROBLEMS).filter((id) => getPracticeState(practiceState, id).status !== 'not-started');

  if (ids.length === 0) {
    return <div className="stu-placeholder">目前還沒有練習紀錄，去「練習題」挑一題開始吧。</div>;
  }

  function toggle(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {ids.map((id) => {
        const problem = PROBLEMS[id];
        const state = getPracticeState(practiceState, id);
        const tier = TIERS.find((t) => t.id === problem.tier);
        const isOpen = openIds.has(id);
        return (
          <div className="stu-hist-card" key={id}>
            <button type="button" className="stu-hist-head" onClick={() => toggle(id)}>
              <div>
                <div className="stu-t">{problem.title}</div>
                <div className="stu-meta">難度：{tier.label} · 回合數：{state.roundsHistory.length}</div>
              </div>
              <div className="stu-hist-rank">{PRACTICE_STATUS_LABEL[state.status]}</div>
            </button>
            <div className={`stu-hist-body${isOpen ? ' stu-hist-body-open' : ''}`}>
              <div className="stu-hist-body-inner">
                {state.roundsHistory.length === 0 ? (
                  <div className="stu-placeholder">尚無回合紀錄。</div>
                ) : (
                  state.roundsHistory.map((h) => {
                    const statusLabel = h.completed ? '已達標' : '還沒達標';
                    const label = h.hidden ? `要提示後進入下一回合（${statusLabel}）` : statusLabel;
                    return <div className="stu-hist-feedback" key={h.round}><b>回合 {h.round}：</b>{label}</div>;
                  })
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Profile({ myName, myEmail, myBio, onSaveBio, visibility, onToggleVisibility, practiceState, showToast }) {
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [moderationNote, setModerationNote] = useState(false);

  function enterEdit() {
    setBioDraft(myBio);
    setModerationNote(false);
    setEditingBio(true);
  }

  function handleSave() {
    const val = bioDraft.trim();
    if (containsBannedWord(val)) { setModerationNote(true); return; }
    setModerationNote(false);
    onSaveBio(val);
    showToast('已儲存個人簡介');
    setEditingBio(false);
  }

  return (
    <>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="stu-profile-card">
          <div className="stu-profile-avatar">{myName.charAt(0)}</div>
          <div className="stu-profile-meta">
            <div><b>{myName}</b>　資訊管理學系 三年級</div>
            <div>學號：<span className="stu-mono">{MY_STUDENT_ID}</span>　身份：學生</div>
            <div>Email：{myEmail}</div>
            <div>加入時間：2026/03/01</div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">個人簡介<span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>（非必填，填寫後同學在「學生詳情」可以看到）</span></div>
        {!editingBio ? (
          <div className="stu-bio-view-row">
            <div className={`stu-bio-view-text${myBio.trim() ? '' : ' stu-bio-view-text-empty'}`}>{myBio.trim() || '尚未填寫個人簡介。'}</div>
            <button type="button" className="stu-bio-edit-btn" aria-label="編輯個人簡介" title="編輯個人簡介" onClick={enterEdit}>
              <IconPencil />
            </button>
          </div>
        ) : (
          <div>
            <textarea
              className="stu-textarea"
              style={{ minHeight: 70, marginTop: 8 }}
              maxLength={200}
              placeholder="簡單介紹一下自己吧！"
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
            />
            <div className="stu-submit-row">
              <span className="stu-attempt-count">{bioDraft.length} / 200</span>
              <button type="button" className="stu-btn stu-btn-sm" onClick={handleSave}>儲存簡介</button>
            </div>
            {moderationNote && <div className="stu-moderation-note">⚠️ 內容包含不適當字詞，請修改後再儲存。</div>}
          </div>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">公開設定<span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>（決定同學在「學生詳情」能看到你哪些資訊）</span></div>
        {VISIBILITY_ROWS.map(([key, label]) => (
          <div className="stu-set-row" key={key}>
            <div><div className="stu-t">{label}</div></div>
            <Switch checked={visibility[key]} onChange={(v) => onToggleVisibility(key, v)} ariaLabel={label} />
          </div>
        ))}
      </div>

      <div className="panel stu-rt" style={{ marginBottom: 16 }}>
        <div className="eyebrow">整體 4D 能力總覽（教學面 + 競賽面 綜合）</div>
        <div className="stu-radar-mini" style={{ marginTop: 10, marginBottom: 16 }}>
          {DIM_ROWS.map(([k, label]) => (
            <div className="stu-row" key={k}>
              <span className="stu-lbl" style={{ color: `var(--${k})` }}>{label}</span>
              <div className="stu-track"><div className="stu-fill" style={{ width: `${MY_SCORES[k]}%`, background: `var(--${k})` }} /></div>
              <span className="stu-pct">{MY_SCORES[k]}%</span>
            </div>
          ))}
        </div>
        <div className="eyebrow" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>教學面 vs 競賽面 逐向度細分</div>
        <table>
          <thead><tr><th>向度</th><th>教學面平均</th><th>競賽面平均</th><th>綜合</th><th>趨勢</th></tr></thead>
          <tbody>
            <tr><td>D1 委託</td><td className="stu-num">45%</td><td className="stu-num">58%</td><td className="stu-num">52%</td><td>↗ 進步中</td></tr>
            <tr><td>D2 描述</td><td className="stu-num">65%</td><td className="stu-num">76%</td><td className="stu-num">71%</td><td>↗ 進步中</td></tr>
            <tr><td>D3 辨識</td><td className="stu-num">50%</td><td className="stu-num">27%</td><td className="stu-num">38%</td><td>↘ 待加強</td></tr>
            <tr><td>D4 盡責</td><td className="stu-num">56%</td><td className="stu-num">63%</td><td className="stu-num">60%</td><td>→ 穩定</td></tr>
          </tbody>
        </table>
        <div className="stu-hist-feedback" style={{ marginTop: 14 }}>
          <b>能力分析：</b>你的 D2 描述能力最為穩定，教學面與競賽面都表現不錯，脈絡給得清楚、限制條件也交代得完整。
          D3 辨識在競賽情境下明顯落後教學面表現（27% vs 50%）——推測是團隊時間壓力下比較少停下來查核 AI 給的數字，
          建議回去多練「幻覺查核」與困難難度題目，並在競賽中養成看到具體數字就反問「這是哪來的」的習慣。
          D1 委託在兩邊都偏低，代表無論有沒有隊友，你都比較少主動保留最終決策權給自己，這是接下來優先補強的方向。
        </div>
      </div>

      <div className="panel stu-rt" style={{ marginBottom: 16 }}>
        <div className="eyebrow">教學面練習紀錄<span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>（題目名稱／難度／完成狀態／回合數，點擊展開看各回合回饋）</span></div>
        <div style={{ marginTop: 10 }}>
          <PracticeLogList practiceState={practiceState} />
        </div>
      </div>

      <div className="panel stu-rt">
        <div className="eyebrow">競賽面表現紀錄</div>
        <table>
          <thead><tr><th>競賽</th><th>日期</th><th>隊伍／名次</th><th>代表提示次數</th><th>D1</th><th>D2</th><th>D3</th><th>D4</th></tr></thead>
          <tbody>
            <tr><td>新創資源分配決策</td><td>2026/05/03</td><td>A 隊 · 第 1 名</td><td className="stu-num">3</td><td className="stu-num">60</td><td className="stu-num">70</td><td className="stu-num">55</td><td className="stu-num">62</td></tr>
            <tr><td>外送勞權兩難</td><td>2026/06/12</td><td>B 隊 · 第 3 名</td><td className="stu-num">2</td><td className="stu-num">55</td><td className="stu-num">62</td><td className="stu-num">48</td><td className="stu-num">50</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
