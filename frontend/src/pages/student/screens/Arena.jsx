import { useState } from 'react';
import { SUBQ_TITLES, formatMatchTime, containsBannedWord } from '../data.js';

const SUBQ_IDS = [1, 2, 3];

const COV_MINI = ['財務影響量化', '替代方案比較'];
const OTHER_TEAMS = ['A 隊：財務、法遵', 'B 隊：替代方案', 'D 隊：溝通策略 ⚠幻覺', 'E 隊：尚未送出'];
const KMAP_LIVE_ROWS = [
  { label: '財務影響量化', dots: [['A', 'var(--d1)'], ['B', 'var(--d2)'], ['C', 'var(--d3)']], snippet: '最新：阿哲（C 隊）試算了更換供應商後的隱藏成本' },
  { label: '替代方案比較', dots: [['B', 'var(--d2)'], ['C', 'var(--d3)']] },
  { label: '員工／客戶影響', dots: [['D', 'var(--d4)']] },
  { label: '倫理／法遵考量', dots: [['A', 'var(--d1)']] },
  { label: '溝通／揭露策略', dots: [['D', 'var(--d4)']] },
];

export default function Arena({ arenaState, onUpdate, onEndCompetition, onReplayHint, showToast }) {
  const [caseOpen, setCaseOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const state = arenaState;

  function handleDraftSubmit() {
    if (containsBannedWord(state.draftText)) { showToast('內容包含不適當字詞，請修改後再送出。'); return; }
    onUpdate((s) => ({ ...s, draftSubmitted: true }));
  }

  function handlePauseToggle() {
    const next = !state.isArenaPaused;
    showToast(next ? '競賽已暫停' : '競賽已恢復');
    onUpdate((s) => ({ ...s, isArenaPaused: next }));
  }

  function handleExtend() {
    onUpdate((s) => ({ ...s, matchSecondsLeft: s.matchSecondsLeft + 120 }));
    showToast('教師已為全班加時');
  }

  function handleRoleToggle() {
    onUpdate((s) => ({ ...s, isRep: !s.isRep }));
  }

  function handleChatSend() {
    const val = chatDraft.trim();
    if (!val || !state.isRep) return;
    if (containsBannedWord(val)) { showToast('內容包含不適當字詞，請修改後再送出。'); return; }
    onUpdate((s) => ({ ...s, sharedChat: [...s.sharedChat, { role: 'rep', author: '你（代表）', text: val }] }));
    setChatDraft('');
  }

  // 2026-10-24 決定：拿掉組內匿名投票，提交改成時間內可以一直上傳（不限次數、不會鎖定），
  // 不再需要「提交後就定案」的確認視窗——上傳不是破壞性/不可逆的動作，直接上傳即可。
  function handleUpload() {
    const at = Date.now();
    const uploadNumber = state.submissions.length + 1;
    onUpdate((s) => ({ ...s, submissions: [...s.submissions, { at }] }));
    showToast(`已上傳目前版本（第 ${uploadNumber} 次）`);
  }

  return (
    <>
      <div className="stu-arena-head">
        <div>
          <span className="stu-tag">案例：供應鏈勞動爭議</span>
          <div className="stu-subq-heading">第 {state.currentSubQ} 小題（共 3 題）：{SUBQ_TITLES[state.currentSubQ]}</div>
          <div className="stu-subq-tabs">
            {SUBQ_IDS.map((n) => (
              <button
                type="button"
                key={n}
                className={`stu-subq-tab${state.currentSubQ === n ? ' stu-subq-tab-active' : ''}`}
                onClick={() => onUpdate((s) => ({ ...s, currentSubQ: n }))}
              >
                小題 {n}
              </button>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="stu-round-pill">C 隊</div>
          <div className="stu-timer">{formatMatchTime(state.matchSecondsLeft)}</div>
          <div className="stu-timer-label">全場剩餘時間</div>
        </div>
      </div>

      {state.isArenaPaused && (
        <div className="stu-pause-banner">⏸ 競賽已暫停，倒數已凍結，請等待教師恢復。</div>
      )}

      <div className="panel" style={{ marginBottom: 16 }}>
        <button type="button" className="stu-accordion-toggle" onClick={() => setCaseOpen((v) => !v)}>
          <span>📄 完整案例說明（隨時可展開查看）</span><span>{caseOpen ? '▴' : '▾'}</span>
        </button>
        <div className={`stu-accordion-body${caseOpen ? ' stu-accordion-body-open' : ''}`}>
          <p>「安心生活」是台灣中大型電商平台，其熱銷生活用品供應商近期被爆料涉及超時工作與未依法投保，引發社群輿論與媒體關注。財務長認為更換供應商將墊高短期成本並影響出貨穩定；永續長主張若不處理將重創品牌信任度；人資長則擔心倉促更換供應商會讓現有窗口的關係與合作細節出現斷層。</p>
          <p>你的團隊需要完成這場競賽的 3 道小題，運用 AI 協助分析並提出兼顧財務、員工／客戶、法遵倫理與溝通揭露的整體解方。完整解方會依教師預設的六大面向評分覆蓋率，並比較跨隊是否涵蓋了其他隊伍沒有觸及的面向。</p>
        </div>
      </div>

      <div className="stu-arena-layout">
        <div className="panel">
          <div className="eyebrow">Step 1 · 個人草稿（隊友看不到）</div>
          <textarea
            className="stu-textarea"
            style={{ minHeight: 100, marginTop: 14 }}
            placeholder="先自己想一版提示，這份草稿只有你自己看得到..."
            value={state.draftText}
            readOnly={state.draftSubmitted}
            onChange={(e) => onUpdate((s) => ({ ...s, draftText: e.target.value }))}
          />
          <div className="stu-submit-row">
            <span className="stu-attempt-count">🔒 隊友看不到這份草稿</span>
            <button type="button" className="stu-btn stu-btn-sm" disabled={state.draftSubmitted} onClick={handleDraftSubmit}>
              {state.draftSubmitted ? '已送交 AI 整合' : '送交 AI 整合'}
            </button>
          </div>

          {state.draftSubmitted && (
            <>
              <div className="eyebrow" style={{ marginTop: 18 }}>Step 2 · AI 整合差異卡</div>
              <div className="stu-diff-block">
                <div className="stu-diff-row"><b>共識點：</b>三人都同意要先量化「更換供應商」對成本的影響。</div>
                <div className="stu-diff-row"><b>分歧點：</b>阿哲著重「隱藏成本」，小薇偏向「方案比較」，志明則想先查核供應商是否違法。</div>
              </div>

              <div className="eyebrow" style={{ marginTop: 18 }}>
                Step 3 · 共用對話框
                <span className="stu-chat-role-tag">{state.isRep ? '· 你是本題代表，可以輸入' : '· 你目前是唯讀'}</span>
              </div>
              <div className="stu-shared-chat">
                {state.sharedChat.map((m, i) => (
                  <div className={`stu-chat-msg stu-chat-msg-${m.role}`} key={i}><b>{m.author}：</b>{m.text}</div>
                ))}
              </div>
              {state.isRep ? (
                <div className="stu-chat-input-row">
                  <textarea
                    placeholder="以本題代表身份，輸入要送給 AI 的訊息..."
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                  />
                  <button type="button" className="stu-btn stu-btn-sm" onClick={handleChatSend}>送出</button>
                </div>
              ) : (
                <div className="stu-chat-readonly-note">🔒 目前由「阿哲」擔任本題代表負責輸入，其他隊員唯讀，看得到對話但不能打字。</div>
              )}

              <div className="eyebrow" style={{ marginTop: 18 }}>Step 4 · 上傳你的答案</div>
              <div className="stu-arena-submit-row">
                <div className="stu-arena-submit-note">
                  時間內可以重複上傳目前版本（不限次數、不會鎖定）；每次上傳如果提到新面向或新答案，AI 判斷合理就會加分。
                </div>
                <button type="button" className="stu-btn stu-btn-sm" onClick={handleUpload}>上傳目前版本</button>
              </div>
              {state.submissions.length > 0 && (
                <div className="stu-arena-submitted-banner">
                  ✓ 已上傳 {state.submissions.length} 次，最後一次{' '}
                  {new Date(state.submissions[state.submissions.length - 1].at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="stu-side-stack">
          <div className="panel">
            <div className="eyebrow">本隊完整解方覆蓋率</div>
            <div className="stu-cov-mini">
              {COV_MINI.map((label) => (
                <div className="stu-row" key={label}><span className="stu-cov-dot" />{label}</div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">其他隊伍目前進度（策略參考）</div>
            <div className="stu-other-teams">
              {OTHER_TEAMS.map((t) => <span className="stu-pillmini" key={t}>{t}</span>)}
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">即時集體知識地圖（每隊每 1～2 分鐘更新）<span className="stu-live-badge">即時，不是正式評分</span></div>
            <div className="stu-kmap-live">
              {KMAP_LIVE_ROWS.map((row) => (
                <div key={row.label}>
                  <div className="stu-kmap-live-row">
                    <span>{row.label}</span>
                    <div className="stu-kmap-live-dots">
                      {row.dots.map(([letter, color]) => (
                        <span className="stu-kdot-sm" style={{ background: color }} key={letter}>{letter}</span>
                      ))}
                    </div>
                  </div>
                  {row.snippet && <div className="stu-kmap-live-snippet">{row.snippet}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="stu-arena-demo-row">
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onReplayHint}>🔔 重播教師提示</button>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handlePauseToggle}>{state.isArenaPaused ? '（Demo）教師恢復競賽' : '（Demo）教師暫停競賽'}</button>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleExtend}>（Demo）教師加時 +2 分鐘</button>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleRoleToggle}>（Demo）切換身份：代表／隊員</button>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onEndCompetition}>（Demo）結束本場競賽 → 查看結果</button>
        <span className="stu-note">教師若在監控台推播引導卡，畫面右下角會即時跳出提示條（不會打斷你正在輸入的內容）。</span>
      </div>
    </>
  );
}
