import { useState } from 'react';
import { containsBannedWord } from '../data.js';
import { UI_SCALES, getUiScaleId, setUiScaleId } from '../uiScale.js';
import Switch from '../components/Switch.jsx';

export default function Settings({ myName, myEmail, onSaveName, onSaveEmail, darkMode, onToggleDarkMode, showToast }) {
  const [nameDraft, setNameDraft] = useState(myName);
  const [emailDraft, setEmailDraft] = useState(myEmail);
  const [weeklyReminder, setWeeklyReminder] = useState(false);
  const [nicknameOnLeaderboard, setNicknameOnLeaderboard] = useState(false);
  const [sharePromptWithOtherTeams, setSharePromptWithOtherTeams] = useState(true);
  const [uiScale, setUiScale] = useState(getUiScaleId());

  function handleScaleChange(id) {
    setUiScale(id);
    setUiScaleId(id);
  }

  function handleSaveName() {
    const val = nameDraft.trim();
    if (!val) { showToast('顯示名稱不能是空的。'); return; }
    if (containsBannedWord(val)) { showToast('內容包含不適當字詞，請修改後再儲存。'); return; }
    onSaveName(val);
    setNameDraft(val);
    showToast('已儲存顯示名稱');
  }

  function handleSaveEmail() {
    const val = emailDraft.trim();
    if (!val) { showToast('Email 不能是空的。'); return; }
    onSaveEmail(val);
    setEmailDraft(val);
    showToast('已儲存 Email');
  }

  return (
    <>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">帳號設定</div>
        <div className="stu-set-row">
          <div><div className="stu-t">顯示名稱</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="stu-set-input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
            <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleSaveName}>儲存</button>
          </div>
        </div>
        <div className="stu-set-row">
          <div><div className="stu-t">Email</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="stu-set-input" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
            <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleSaveEmail}>儲存</button>
          </div>
        </div>
        <div className="stu-set-row">
          <div><div className="stu-t">密碼</div><div className="stu-d">上次變更：2026/07/02</div></div>
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm">修改密碼</button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">通知設定</div>
        <div className="stu-preview-banner">教師即時提示推播、隊友動態通知為系統必要通知，一律開啟、無法個別關閉。</div>
        <div className="stu-set-row">
          <div><div className="stu-t">每週練習提醒</div><div className="stu-d">固定時間提醒我回來練習關卡</div></div>
          <Switch checked={weeklyReminder} onChange={setWeeklyReminder} ariaLabel="每週練習提醒" />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">隱私設定</div>
        <div className="stu-set-row">
          <div><div className="stu-t">排行榜顯示暱稱而非本名</div></div>
          <Switch checked={nicknameOnLeaderboard} onChange={setNicknameOnLeaderboard} ariaLabel="排行榜顯示暱稱而非本名" />
        </div>
        <div className="stu-set-row">
          <div><div className="stu-t">允許其他隊伍在互評時看到我方提示紀錄</div></div>
          <Switch checked={sharePromptWithOtherTeams} onChange={setSharePromptWithOtherTeams} ariaLabel="允許其他隊伍在互評時看到我方提示紀錄" />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">顯示設定</div>
        <div className="stu-set-row">
          <div><div className="stu-t">畫面大小</div><div className="stu-d">整個學生端的文字與間距一起放大</div></div>
          <div className="stu-segmented" role="radiogroup" aria-label="畫面大小">
            {UI_SCALES.map((scale) => (
              <button
                type="button"
                role="radio"
                aria-checked={uiScale === scale.id}
                className={`stu-segmented-btn${uiScale === scale.id ? ' stu-segmented-btn-on' : ''}`}
                title={scale.desc}
                key={scale.id}
                onClick={() => handleScaleChange(scale.id)}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>
        <div className="stu-set-row">
          <div><div className="stu-t">深色模式</div></div>
          <Switch checked={darkMode} onChange={onToggleDarkMode} ariaLabel="深色模式" />
        </div>
      </div>
    </>
  );
}
