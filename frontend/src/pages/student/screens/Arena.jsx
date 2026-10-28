import { useEffect, useRef, useState } from 'react';
import {
  SUBQ_TITLES, BASIC_ANSWERS, formatMatchTime, containsBannedWord,
  pushArenaUserMessage, resolveArenaAIReply, submitArenaAnswer,
} from '../data.js';
import { IconSend } from '../icons.jsx';

const SUBQ_IDS = [1, 2, 3];
const STAGE_CN = { 1: '一', 2: '二', 3: '三' };

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
  const textareaRef = useRef(null);
  const threadRef = useRef(null);
  const state = arenaState;
  const subqId = state.currentSubQ;
  const stage = state.stages[subqId];

  // 切換階段或這個階段有新訊息時，自動捲到對話最底部
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [subqId, stage.messages.length]);

  function gotoStage(n) {
    if (n > state.unlockedSubQ) return; // 鎖住的階段點了沒反應
    onUpdate((s) => ({ ...s, currentSubQ: n }));
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
    onUpdate((s) => pushArenaUserMessage(s, subqId, val));
    setTimeout(() => {
      onUpdate((s) => resolveArenaAIReply(s, subqId, pendingIndex, isFirst));
      setAiPending(false);
    }, 700);
  }

  // 送出一則 AI 回覆當作這個階段的答案：先用目前的 state 算出要跳什麼提示，
  // 再透過 onUpdate 用 React 給的最新 s 實際套用——避免連續快速點擊時用到過期的 state。
  function handleAnswerClick(text) {
    const { result } = submitArenaAnswer(state, subqId, text);
    onUpdate((s) => submitArenaAnswer(s, subqId, text).state);
    if (result.type === 'basic') showToast(`命中基本答案「${result.answer}」！+2 分`);
    else if (result.type === 'duplicate') showToast('這個答案已經有人搶先一步了，這次不計分。');
    else showToast(`搶答成功！+${result.score} 分`);
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
    if (state.unlockedSubQ >= SUBQ_IDS.length) return;
    const next = state.unlockedSubQ + 1;
    onUpdate((s) => ({ ...s, unlockedSubQ: next }));
    showToast(`教師已開放階段${STAGE_CN[next]}`);
  }

  const basicList = BASIC_ANSWERS[subqId];
  const buzzList = state.publicBuzz[subqId];

  return (
    <>
      <div className="stu-arena-head">
        <div>
          <span className="stu-tag">案例：供應鏈勞動爭議</span>
          <div className="stu-subq-heading">階段{STAGE_CN[subqId]}：{SUBQ_TITLES[subqId]}</div>
          <div className="stu-subq-tabs">
            {SUBQ_IDS.map((n) => {
              const locked = n > state.unlockedSubQ;
              return (
                <button
                  type="button"
                  key={n}
                  disabled={locked}
                  className={`stu-subq-tab${subqId === n ? ' stu-subq-tab-active' : ''}${locked ? ' stu-subq-tab-locked' : ''}`}
                  title={locked ? '教師還沒開放這個階段' : undefined}
                  onClick={() => gotoStage(n)}
                >
                  階段{STAGE_CN[n]}{locked && ' 🔒'}
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
          <p>「安心生活」是台灣中大型電商平台，其熱銷生活用品供應商近期被爆料涉及超時工作與未依法投保，引發社群輿論與媒體關注。財務長認為更換供應商將墊高短期成本並影響出貨穩定；永續長主張若不處理將重創品牌信任度；人資長則擔心倉促更換供應商會讓現有窗口的關係與合作細節出現斷層。</p>
          <p>每個階段都有自己跟 AI 的對話框，AI 給的回覆只要點「送出這個答案」就會直接送出：答到教師預先設好的「基本答案」就會亮起一格、私下計分；答到別的內容則會送進公開搶答區，全班都看得到，先搶先贏。</p>
        </div>
      </div>

      <div className="stu-arena-layout">
        <div className="panel stu-chat-panel">
          <div className="eyebrow">與 AI 對話（這個階段的討論）</div>
          <div className="stu-chat-conv">
            <div className="stu-chat-thread" ref={threadRef}>
              {stage.messages.length === 0 ? (
                <div className="stu-chat-empty">送出第一則訊息，開始跟 AI 討論這個階段吧。</div>
              ) : (
                stage.messages.map((m, i) => (
                  <div className={`stu-bubble stu-bubble-${m.role}${m.pending ? ' stu-bubble-pending' : ''}`} key={i}>
                    <MessageText text={m.text} />
                    {m.role === 'ai' && !m.pending && (
                      <div style={{ marginTop: 8 }}>
                        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={() => handleAnswerClick(m.text)}>
                          送出這個答案
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
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

        <div className="stu-side-stack">
          <div className="panel">
            <div className="eyebrow">基本答案<span className="stu-live-badge">只有自己隊看得到進度</span></div>
            <div className="stu-basic-grid">
              {basicList.map((answer, i) => {
                const revealed = stage.revealed.includes(i);
                return (
                  <div className={`stu-basic-box${revealed ? ' stu-basic-box-revealed' : ''}`} key={i}>
                    {revealed ? answer : '？'}
                  </div>
                );
              })}
            </div>
            <div className="stu-d" style={{ marginTop: 10 }}>已經答出 {stage.revealed.length} / {basicList.length} 格</div>
          </div>
          <div className="panel">
            <div className="eyebrow">公開搶答區<span className="stu-live-badge">全班都看得到，先搶先贏</span></div>
            {buzzList.length === 0 ? (
              <div className="stu-observed-empty" style={{ marginTop: 10 }}>還沒有人搶答，搶第一個！</div>
            ) : (
              <div className="stu-buzz-list">
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
      </div>

      <div className="stu-arena-demo-row">
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onReplayHint}>🔔 重播教師提示</button>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handlePauseToggle}>{state.isArenaPaused ? '（Demo）教師恢復競賽' : '（Demo）教師暫停競賽'}</button>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleExtend}>（Demo）教師加時 +2 分鐘</button>
        {state.unlockedSubQ < SUBQ_IDS.length && (
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleUnlockNext}>（Demo）教師開放下一階段</button>
        )}
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onEndCompetition}>（Demo）結束本場競賽 → 查看結果</button>
        <span className="stu-note">教師若在監控台推播引導卡，畫面右下角會即時跳出提示條（不會打斷你正在輸入的內容）。</span>
      </div>
    </>
  );
}
