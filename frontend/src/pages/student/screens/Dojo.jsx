import { useEffect, useRef, useState } from 'react';
import {
  PROBLEMS, TIERS, MAX_ROUNDS, HINT_LEVEL_LABELS,
  containsBannedWord, indicatorInfoFor, indicatorBadgeInfo, indicatorReasonText,
  dimFeedbackText, DIM_NAMES,
  doRestart, advanceRound, endRoundViaHint, revealHintInPlace, revealNextHintLevel,
  submitResult, pushUserAndPending, resolveAIReply, retryMessageStart, retryMessageResolve,
} from '../data.js';
import { IconFile, IconSend } from '../icons.jsx';

function ConfirmModal({ modal, onCancel, onConfirm }) {
  if (!modal) return null;
  return (
    <div className="stu-modal-veil stu-modal-veil-show">
      <div className="stu-modal-box">
        <h3>{modal.title}</h3>
        <p>{modal.body}</p>
        <div className="stu-modal-actions">
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onCancel}>取消</button>
          <button type="button" className="stu-btn stu-btn-sm" onClick={onConfirm}>確定</button>
        </div>
      </div>
    </div>
  );
}

function SubmitModal({ open, outcomeType, text, onChangeText, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="stu-modal-veil stu-modal-veil-show">
      <div className="stu-modal-box stu-modal-box-wide">
        <h3>提交成果</h3>
        <p>成果類型：<span>{outcomeType}</span>。系統已經自動帶入 AI 最後一次回覆的內容，確認沒問題或修改後再提交。</p>
        <textarea className="stu-textarea" value={text} onChange={(e) => onChangeText(e.target.value)} />
        <div className="stu-modal-actions">
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onCancel}>取消</button>
          <button type="button" className="stu-btn stu-btn-sm" onClick={onConfirm}>確認提交</button>
        </div>
      </div>
    </div>
  );
}

function IndicatorInfoModal({ modal, onClose }) {
  if (!modal) return null;
  const info = indicatorInfoFor(modal.label);
  return (
    <div className="stu-modal-veil stu-modal-veil-show">
      <div className="stu-modal-box stu-modal-box-narrow">
        <h3>{modal.label}</h3>
        <div className="stu-info-body">
          {modal.liveNote && <div className="stu-info-live-note">{modal.liveNote}</div>}
          <div className="stu-info-row"><div className="stu-info-label">定義</div><div>{info.def}</div></div>
          <div className="stu-info-row"><div className="stu-info-label">好例子</div><div>{info.good}</div></div>
          <div className="stu-info-row"><div className="stu-info-label">壞例子</div><div>{info.bad}</div></div>
        </div>
        <div className="stu-modal-actions">
          <button type="button" className="stu-btn stu-btn-sm" onClick={onClose}>關閉</button>
        </div>
      </div>
    </div>
  );
}

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

function indicatorRowHtml(r, includeEvidence, onEvidenceClick, onInfoClick) {
  const b = indicatorBadgeInfo(r.score);
  const reason = indicatorReasonText(r.score);
  return (
    <div className="stu-indicator-row" key={r.id}>
      <div className="stu-indicator-top">
        <span className="stu-indicator-name-wrap">
          <span className="stu-indicator-name">{r.label}</span>
          <button type="button" className="stu-info-icon" aria-label="什麼是這個？" title="什麼是這個？" onClick={() => onInfoClick(r.label)}>i</button>
        </span>
        <span className={`stu-indicator-badge stu-badge-${b.cls}`}>{b.text}</span>
      </div>
      <div className="stu-indicator-reason">{reason}</div>
      {includeEvidence && r.evidenceMsgIndex != null && r.score !== 'unseen' && (
        <button type="button" className="stu-indicator-evidence" onClick={() => onEvidenceClick(r.evidenceMsgIndex)}>查看對話中的依據 →</button>
      )}
    </div>
  );
}

function DimFeedback({ indicatorResults }) {
  const dims = {};
  indicatorResults.forEach((r) => { (dims[r.dim] = dims[r.dim] || []).push(r.score); });
  return (
    <div className="stu-dim-feedback">
      {Object.keys(dims).map((dimKey) => (
        <div className="stu-dim-row" key={dimKey}>
          <div className="stu-dim-label" style={{ color: `var(--${dimKey})` }}>{DIM_NAMES[dimKey]}</div>
          <div className="stu-dim-text">{dimFeedbackText(dimKey, dims[dimKey])}</div>
        </div>
      ))}
    </div>
  );
}

function RoundResultBlock({ entry, includeEvidence, onEvidenceClick, onInfoClick }) {
  return (
    <>
      <div className="eyebrow">回合 {entry.round} 結果</div>
      <div className={`stu-result-check ${entry.completed ? 'stu-result-check-pass' : 'stu-result-check-fail'}`}>
        {entry.completed ? '✓ 已達標' : '還沒達標'}
      </div>
      {!entry.completed && entry.unmet.length > 0 && (
        <ul className="stu-result-unmet">
          {entry.unmet.map((t) => <li key={t}>未達成：{t}</li>)}
        </ul>
      )}
      <div className="stu-indicator-list">
        {entry.indicatorResults.map((r) => indicatorRowHtml(r, includeEvidence, onEvidenceClick, onInfoClick))}
      </div>
      <DimFeedback indicatorResults={entry.indicatorResults} />
    </>
  );
}

function downloadRoundTranscript(entry, problem) {
  const lines = [problem.title + ' · 回合 ' + entry.round + ' 對話紀錄', ''];
  (entry.transcript || []).forEach((m) => {
    if (m.pending || m.failed) return;
    lines.push((m.role === 'user' ? '你' : 'AI') + '：' + m.text, '');
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = problem.title + '-回合' + entry.round + '對話紀錄.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Dojo({ problemId, state, onUpdate, onBack, onGoToNextProblem, demoFailureShownRef, showToast }) {
  const problem = PROBLEMS[problemId];
  const tierInfo = TIERS.find((t) => t.id === problem.tier);

  const [input, setInput] = useState('');
  const [aiPending, setAiPending] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitText, setSubmitText] = useState('');
  const [infoModal, setInfoModal] = useState(null);
  const [highlightIdx, setHighlightIdx] = useState(null);
  const textareaRef = useRef(null);
  const threadRef = useRef(null);

  // 自動捲到對話最底部
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [state.messages.length]);

  // 每個回合結果第一次出現時，預設最新一筆展開、其餘維持使用者自己選過的狀態
  useEffect(() => {
    const entries = state.roundsHistory;
    const hasMissing = entries.some((e) => !(e.round in state.resultOpen));
    if (!hasMissing) return;
    onUpdate((s) => {
      const resultOpen = { ...s.resultOpen };
      s.roundsHistory.forEach((e, i) => {
        if (!(e.round in resultOpen)) resultOpen[e.round] = i === s.roundsHistory.length - 1;
      });
      return { ...s, resultOpen };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.roundsHistory.length]);

  function scrollToMessage(idx) {
    const el = threadRef.current?.querySelector(`[data-msg-index="${idx}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightIdx(idx);
    setTimeout(() => setHighlightIdx((cur) => (cur === idx ? null : cur)), 1600);
  }

  function openIndicatorInfo(label, liveNote) {
    setInfoModal({ label, liveNote });
  }

  function sendPrompt() {
    if (state.roundEnded || aiPending) return;
    const val = input.trim();
    if (!val) return;
    if (containsBannedWord(val)) { showToast('內容包含不適當字詞，請修改後再送出。'); return; }
    const pendingIndex = state.messages.length + 1;
    const isFirstInRound = state.userMsgCountThisRound + 1 === 1;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '';
    setAiPending(true);
    onUpdate((s) => pushUserAndPending(s, val));
    setTimeout(() => {
      const demoFailureAlreadyShown = demoFailureShownRef.current;
      demoFailureShownRef.current = true;
      onUpdate((s) => resolveAIReply(s, problem, pendingIndex, isFirstInRound, demoFailureAlreadyShown));
      setAiPending(false);
    }, 700);
  }

  function handleRetry(idx) {
    setAiPending(true);
    onUpdate((s) => retryMessageStart(s, idx));
    setTimeout(() => {
      onUpdate((s) => retryMessageResolve(s, problem, idx));
      setAiPending(false);
    }, 700);
  }

  function handleRestartClick() {
    if (state.roundEnded && state.round >= MAX_ROUNDS) { onGoToNextProblem(); return; }
    if (state.roundEnded) { onUpdate((s) => advanceRound(s, false)); return; }
    setConfirmModal({
      title: '重開這回合？',
      body: `重開會放棄目前這段對話，不會被評分。回合 ${state.round} 重開後仍是回合 ${state.round}，可以一直重開。`,
      onConfirm: () => { onUpdate(doRestart); setConfirmModal(null); },
    });
  }

  function handleHintClick() {
    if (!state.hintRevealed) {
      if (state.round === 1 && !state.roundEnded) {
        setConfirmModal({
          title: '要提示？',
          body: '取得提示會結束目前這個回合並評分，接著開啟新的對話。',
          onConfirm: () => { onUpdate((s) => endRoundViaHint(s, problem)); setConfirmModal(null); },
        });
      } else {
        onUpdate(revealHintInPlace);
      }
    } else if (state.hintLevelOpen < problem.hints.length) {
      onUpdate((s) => revealNextHintLevel(s, problem));
    }
  }

  function openSubmitPanel() {
    if (state.roundEnded || aiPending) return;
    setConfirmModal({
      title: '提交成果？',
      body: '提交後這個回合會結束並評分。',
      onConfirm: () => {
        const lastAiMsg = [...state.messages].reverse().find((m) => m.role === 'ai' && !m.pending && !m.failed);
        setSubmitText(lastAiMsg ? lastAiMsg.text : '');
        setSubmitModalOpen(true);
        setConfirmModal(null);
      },
    });
  }

  function handleSubmitConfirm() {
    const val = submitText.trim();
    if (containsBannedWord(val)) { showToast('內容包含不適當字詞，請修改後再送出。'); return; }
    onUpdate((s) => submitResult(s, problem, val));
    setSubmitModalOpen(false);
  }

  function handleAiSuggestDismiss() {
    onUpdate((s) => ({ ...s, aiSuggestDismissedThisRound: true }));
  }

  function toggleResultEntry(round) {
    onUpdate((s) => ({ ...s, resultOpen: { ...s.resultOpen, [round]: !s.resultOpen[round] } }));
  }

  const roundEnded = state.roundEnded;
  const chatOverlayText = state.round >= MAX_ROUNDS
    ? '本題已結束，無法再對話，請前往下一題'
    : '本回合已結束，無法再對話，請開啟下一回合';

  const showSuggestBar = state.round >= 2 && !state.roundEnded && state.userMsgCountThisRound >= 2 && !state.aiSuggestDismissedThisRound;

  let restartBtnText, restartHandler;
  if (state.roundEnded && state.round >= MAX_ROUNDS) {
    restartBtnText = '前往下一題';
    restartHandler = onGoToNextProblem;
  } else if (state.roundEnded) {
    restartBtnText = '再來一回合';
    restartHandler = handleRestartClick;
  } else {
    restartBtnText = '重開';
    restartHandler = handleRestartClick;
  }

  let hintBtnVisible = true;
  let hintBtnText = '';
  if (!state.hintRevealed) {
    hintBtnText = (state.round === 1 && !state.roundEnded) ? '要提示' : '查看提示';
  } else if (state.hintLevelOpen < problem.hints.length) {
    hintBtnText = '要下一個提示';
  } else {
    hintBtnVisible = false;
  }

  const seenTags = [];
  const seenLabels = new Set();
  state.messages.forEach((m) => {
    if (m.liveTag && !seenLabels.has(m.liveTag.label)) { seenLabels.add(m.liveTag.label); seenTags.push(m.liveTag); }
  });

  return (
    <div className="stu-dojo-layout">
      <div className="stu-dojo-col">
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="stu-dojo-topbar">
            <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onBack}>← 返回題目列表</button>
            <span className={`stu-tag stu-diff-${tierInfo.diffClass}`}>{tierInfo.label}</span>
            <span className="stu-round-pill">回合 {state.round}</span>
            <div className="stu-dojo-title">{problem.title}</div>
          </div>
          <div className="stu-outcome">成果類型：<b>{problem.outcomeType}</b></div>
          <div className="stu-brief">{problem.scenario}</div>
        </div>

        <div className="panel stu-chat-panel">
          <div className="stu-chat-conv">
            <div className="stu-chat-thread" ref={threadRef}>
              {state.messages.length === 0 ? (
                <div className="stu-chat-empty">送出第一則訊息，開始跟 AI 對話吧。</div>
              ) : (
                state.messages.map((m, i) => {
                  let cls = `stu-bubble stu-bubble-${m.role}`;
                  if (m.pending) cls += ' stu-bubble-pending';
                  if (m.failed) cls += ' stu-bubble-failed';
                  if (highlightIdx === i) cls += ' stu-bubble-highlight';
                  return (
                    <div className={cls} data-msg-index={i} key={i}>
                      <MessageText text={m.text} />
                      {m.failed && <><br /><span className="stu-retry" onClick={() => handleRetry(i)}>重試</span></>}
                      {m.liveTag && (
                        <>
                          <div className="stu-live-tags">
                            <button type="button" className="stu-live-tag" onClick={() => openIndicatorInfo(m.liveTag.label, '你這則對話中的回覆，展現了「' + m.liveTag.label + '」這個行為。')}>
                              偵測到：{m.liveTag.label}
                            </button>
                          </div>
                          <div className="stu-live-note">即時偵測，不是正式分數</div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className={`stu-suggest-bar${showSuggestBar ? ' stu-suggest-bar-show' : ''}`}>
              <span>AI 判斷你目前的成果已經達到交付規格，可以提交了（由你決定要不要提交）。</span>
              <button type="button" className="stu-btn stu-btn-sm" onClick={openSubmitPanel}>提交</button>
              <button type="button" className="stu-suggest-close" aria-label="關閉提示" onClick={handleAiSuggestDismiss}>✕</button>
            </div>

            <div className="stu-composer">
              <textarea
                ref={textareaRef}
                placeholder="跟 AI 說說你想怎麼做……"
                rows={1}
                value={input}
                disabled={aiPending || roundEnded}
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
              <button type="button" className="stu-send-btn" aria-label="送出" title="送出" disabled={aiPending || roundEnded} onClick={sendPrompt}>
                <IconSend />
              </button>
            </div>

            {roundEnded && (
              <div className="stu-chat-overlay">
                <div className="stu-chat-overlay-text">{chatOverlayText}</div>
              </div>
            )}
          </div>

          <div className="stu-actions">
            <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={restartHandler}>{restartBtnText}</button>
            {hintBtnVisible && <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleHintClick}>{hintBtnText}</button>}
            <button type="button" className="stu-btn stu-btn-sm" disabled={roundEnded} onClick={openSubmitPanel}>{roundEnded ? '已提交' : '提交成果'}</button>
          </div>
        </div>
      </div>

      <div className="stu-dojo-side">
        <div className="panel">
          <div className="eyebrow">本回合觀察到的行為<span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>（即時偵測，不是正式分數）</span></div>
          {seenTags.length > 0 ? (
            <div className="stu-live-tags">
              {seenTags.map((t) => (
                <button type="button" className="stu-live-tag" key={t.label} onClick={() => openIndicatorInfo(t.label, '這是你這回合目前展現過的行為之一。')}>{t.label}</button>
              ))}
            </div>
          ) : (
            <div className="stu-observed-empty">還沒有觀察到行為，繼續跟 AI 對話看看。</div>
          )}
        </div>

        {state.hintRevealed && (
          <div className="panel">
            <div className="eyebrow">提示</div>
            {Array.from({ length: Math.min(state.hintLevelOpen, problem.hints.length) }).map((_, i) => (
              <div className="stu-hint-level" key={i}>
                <div className="stu-hint-level-label">第 {i + 1} 級 · {HINT_LEVEL_LABELS[i]}</div>
                <div className="stu-hint-level-body" dangerouslySetInnerHTML={{ __html: problem.hints[i] }} />
              </div>
            ))}
          </div>
        )}

        {state.roundsHistory.length > 0 && (
          <div className="panel">
            <div className="eyebrow">回合結果</div>
            {state.roundsHistory.map((entry, i) => {
              const isOpen = entry.round in state.resultOpen ? state.resultOpen[entry.round] : i === state.roundsHistory.length - 1;
              const isCurrent = entry.round === state.round;
              return (
                <div className={`stu-result-entry${isOpen ? ' stu-result-entry-open' : ''}`} key={entry.round} style={{ marginTop: i > 0 ? 10 : 0 }}>
                  <button type="button" className="stu-result-toggle" onClick={() => toggleResultEntry(entry.round)}>查看回合 {entry.round} 結果</button>
                  <div className="stu-result-body">
                    {entry.hidden ? (
                      <div className="stu-result-incomplete">由於回合 {entry.round} 未完成即結束，因此無可查看的結果。</div>
                    ) : (
                      <RoundResultBlock entry={entry} includeEvidence={isCurrent} onEvidenceClick={scrollToMessage} onInfoClick={(label) => openIndicatorInfo(label)} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {state.roundsHistory.length > 0 && (
          <div className="panel">
            <div className="eyebrow">回合對話紀錄</div>
            {state.roundsHistory.map((entry, idx) => (
              <button type="button" className="stu-transcript-item" key={idx} onClick={() => downloadRoundTranscript(entry, problem)}>
                <span className="stu-transcript-icon"><IconFile /></span>
                <span className="stu-transcript-name">回合 {entry.round} 對話紀錄</span>
                <span className="stu-transcript-action">下載</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        modal={confirmModal}
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => confirmModal && confirmModal.onConfirm()}
      />
      <SubmitModal
        open={submitModalOpen}
        outcomeType={problem.outcomeType}
        text={submitText}
        onChangeText={setSubmitText}
        onCancel={() => setSubmitModalOpen(false)}
        onConfirm={handleSubmitConfirm}
      />
      <IndicatorInfoModal modal={infoModal} onClose={() => setInfoModal(null)} />
    </div>
  );
}
