import { useEffect, useRef, useState } from 'react';
import {
  ARENA_CASES, findArenaCase, stageLabel, formatMatchTime, containsBannedWord,
  pushArenaUserMessage, resolveArenaAIReply, submitArenaAnswers, setCurrentSubQ, unlockNextStage, setCurrentCase,
  DEMO_HINT_TEXT, pushHint,
} from '../data.js';
import { IconSend } from '../icons.jsx';

function MessageText({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
      ))}
    </>
  );
}

export default function Arena({ arenaState, onUpdate, onEndCompetition, onReplayHint, showToast }) {
  const [caseOpen, setCaseOpen] = useState(false);
  const [input, setInput] = useState('');
  const [aiPending, setAiPending] = useState(false);
  const [checked, setChecked] = useState({});
  const textareaRef = useRef(null);
  const threadRef = useRef(null);
  const state = arenaState;
  const caseId = state.currentCaseId;
  const caseDef = findArenaCase(caseId);
  const caseState = state.cases[caseId];
  const subqId = caseState.currentSubQ;
  const stage = caseState.stages[subqId];
  const stageCount = caseDef.stages.length;
  const basicList = caseDef.stages[subqId - 1].basicAnswers;
  const buzzList = caseState.publicBuzz[subqId];

  // 切換案例／階段或這個階段有新訊息時，自動捲到對話最底部
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [caseId, subqId, stage.messages.length]);

  function gotoCase(id) {
    if (id === caseId) return;
    onUpdate((s) => setCurrentCase(s, id));
  }

  function gotoStage(n) {
    if (n > caseState.unlockedSubQ) return; // 鎖住的階段點了沒反應
    onUpdate((s) => setCurrentSubQ(s, caseId, n));
  }

  function sendPrompt() {
    if (aiPending) return;
    const val = input.trim();
    if (!val) return;
    if (containsBannedWord(val)) { showToast('內容包含不適當字詞，請修改後再送出。'); return; }
    const pendingIndex = stage.messages.length + 1;
    const isFirst = stage.messages.length === 0;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '';
    setAiPending(true);
    onUpdate((s) => pushArenaUserMessage(s, caseId, subqId, val));
    setTimeout(() => {
      onUpdate((s) => resolveArenaAIReply(s, caseId, subqId, pendingIndex, isFirst));
      setAiPending(false);
    }, 700);
  }

  function pointKey(msgIndex, pointIndex) {
    return `${caseId}|${subqId}|${msgIndex}|${pointIndex}`;
  }

  function togglePoint(msgIndex, pointIndex) {
    const key = pointKey(msgIndex, pointIndex);
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const selectedTexts = [];
  stage.messages.forEach((m, mi) => {
    if (m.role !== 'ai' || m.pending) return;
    m.points.forEach((p, pi) => { if (checked[pointKey(mi, pi)]) selectedTexts.push(p); });
  });

  // 送出所有勾選的列點：先用目前的 state 算出要跳什麼提示，再透過 onUpdate 用 React 給的
  // 最新 s 實際套用——避免連續快速點擊時用到過期的 state。
  function handleSubmitChecked() {
    if (selectedTexts.length === 0) return;
    const { summary } = submitArenaAnswers(state, caseId, subqId, selectedTexts);
    onUpdate((s) => submitArenaAnswers(s, caseId, subqId, selectedTexts).state);
    setChecked((prev) => {
      const next = { ...prev };
      stage.messages.forEach((m, mi) => { if (m.points) m.points.forEach((_, pi) => { delete next[pointKey(mi, pi)]; }); });
      return next;
    });
    const parts = [];
    if (summary.basicCount > 0) parts.push(`命中基本答案 ${summary.basicCount} 格（+${summary.basicScore} 分）`);
    if (summary.publicCount > 0) parts.push(`搶答成功 ${summary.publicCount} 項（+${summary.publicScore} 分）`);
    if (summary.dupCount > 0) parts.push(`重複不計分 ${summary.dupCount} 項`);
    showToast(`送出 ${selectedTexts.length} 項：${parts.join('、')}`);
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

  function handleUnlockNext() {
    if (caseState.unlockedSubQ >= stageCount) return;
    onUpdate((s) => unlockNextStage(s, caseId));
    showToast(`教師已開放階段${stageLabel(caseState.unlockedSubQ + 1)}`);
  }

  function handlePushHint() {
    onUpdate((s) => pushHint(s, DEMO_HINT_TEXT));
    onReplayHint(); // 畫面右下角的「來自教師」提示條，看過之後內容仍留在左側教師提示區清單裡
  }

  return (
    <div className="stu-arena-shell">
      <div className="stu-arena-side-left">
        <div className="panel">
          <div className="eyebrow">題目列表</div>
          <div className="stu-case-list">
            {ARENA_CASES.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`stu-case-item${c.id === caseId ? ' stu-case-item-active' : ''}`}
                onClick={() => gotoCase(c.id)}
              >
                {c.tag}
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="eyebrow">教師提示區</div>
          {state.hints.length === 0 ? (
            <div className="stu-observed-empty" style={{ marginTop: 8 }}>目前還沒有教師提示。</div>
          ) : (
            <div className="stu-hint-list">
              {state.hints.slice().reverse().map((h, i) => (
                <div className="stu-hint-item" key={i}>{h.text}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="stu-arena-main">
        <div className="stu-arena-head">
          <div>
            <span className="stu-tag">案例：{caseDef.tag}</span>
            <div className="stu-subq-heading">階段{stageLabel(subqId)}：{caseDef.stages[subqId - 1].title}</div>
            <div className="stu-subq-tabs">
              {caseDef.stages.map((_, i) => {
                const n = i + 1;
                const locked = n > caseState.unlockedSubQ;
                const dim = n !== caseState.unlockedSubQ;
                return (
                  <button
                    type="button"
                    key={n}
                    disabled={locked}
                    className={`stu-subq-tab${subqId === n ? ' stu-subq-tab-active' : ''}${dim ? ' stu-subq-tab-dim' : ''}${locked ? ' stu-subq-tab-locked' : ''}`}
                    title={locked ? '教師還沒開放這個階段' : undefined}
                    onClick={() => gotoStage(n)}
                  >
                    階段{stageLabel(n)}{locked && ' 🔒'}
                  </button>
                );
              })}
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
            {caseDef.brief.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>

        <div className="stu-arena-layout">
          <div className="stu-arena-main-col">
            <div className="panel stu-basic-compact">
              <div className="eyebrow">基本答案<span className="stu-live-badge">只有自己隊看得到進度</span></div>
              <div className="stu-basic-chip-row">
                {basicList.map((answer, i) => {
                  const revealed = stage.revealed.includes(i);
                  return (
                    <span className={`stu-basic-chip${revealed ? ' stu-basic-chip-revealed' : ''}`} title={revealed ? answer : '尚未命中'} key={i}>
                      {revealed ? '✓' : '?'}
                    </span>
                  );
                })}
              </div>
              <div className="stu-d" style={{ marginTop: 8 }}>已經答出 {stage.revealed.length} / {basicList.length} 格</div>
            </div>

            <div className="panel stu-chat-panel">
              <div className="eyebrow">與 AI 對話（這個階段的討論）</div>
              <div className="stu-chat-conv">
                <div className="stu-chat-thread" ref={threadRef}>
                  {stage.messages.length === 0 ? (
                    <div className="stu-chat-empty">送出第一則訊息，開始跟 AI 討論這個階段吧。</div>
                  ) : (
                    stage.messages.map((m, mi) => (
                      <div className={`stu-bubble stu-bubble-${m.role}${m.pending ? ' stu-bubble-pending' : ''}`} key={mi}>
                        {m.role === 'ai' && !m.pending ? (
                          m.points.map((p, pi) => (
                            <label className="stu-point-row" key={pi}>
                              <input type="checkbox" checked={!!checked[pointKey(mi, pi)]} onChange={() => togglePoint(mi, pi)} />
                              <span className="stu-point-text"><MessageText text={p} /></span>
                            </label>
                          ))
                        ) : (
                          <MessageText text={m.text} />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="stu-checked-submit-bar">
                  <span className="stu-d">已勾選 {selectedTexts.length} 項</span>
                  <button type="button" className="stu-btn stu-btn-sm" disabled={selectedTexts.length === 0} onClick={handleSubmitChecked}>
                    送出勾選的答案
                  </button>
                </div>

                <div className="stu-composer">
                  <textarea
                    ref={textareaRef}
                    placeholder="跟 AI 討論這個階段的想法……"
                    rows={1}
                    value={input}
                    disabled={aiPending}
                    onChange={(e) => {
                      setInput(e.target.value);
                      const el = e.target;
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPrompt(); }
                    }}
                  />
                  <button type="button" className="stu-send-btn" aria-label="送出" title="送出" disabled={aiPending || !input.trim()} onClick={sendPrompt}>
                    <IconSend />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="panel stu-buzz-panel">
            <div className="eyebrow">公開搶答區<span className="stu-live-badge">全班都看得到，先搶先贏</span></div>
            {buzzList.length === 0 ? (
              <div className="stu-observed-empty" style={{ marginTop: 10 }}>還沒有人搶答，搶第一個！</div>
            ) : (
              <div className="stu-buzz-list stu-buzz-list-tall">
                {buzzList.slice().reverse().map((entry, i) => (
                  <div className="stu-buzz-item" key={i}>
                    <span className="stu-buzz-team">{entry.team}</span>
                    <span className="stu-buzz-text">{entry.text}</span>
                    <span className="stu-buzz-score">+{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stu-arena-demo-row">
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handlePushHint}>（Demo）教師推播提示</button>
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handlePauseToggle}>{state.isArenaPaused ? '（Demo）教師恢復競賽' : '（Demo）教師暫停競賽'}</button>
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleExtend}>（Demo）教師加時 +2 分鐘</button>
          {caseState.unlockedSubQ < stageCount && (
            <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleUnlockNext}>（Demo）教師開放下一階段</button>
          )}
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onEndCompetition}>（Demo）結束本場競賽 → 查看結果</button>
        </div>
      </div>
    </div>
  );
}
