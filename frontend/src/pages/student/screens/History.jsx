import { useState } from 'react';

const HISTORY = [
  {
    id: 'h1', title: '外送勞權兩難', meta: '課程：AI提示工程與批判思考 · 2026/06/12 · 隊伍：B 隊', rank: '第 3 名／5 隊',
    scoreLines: [['各組互評平均分', '80'], ['AI 評分（參考）', '82'], ['老師調整', '−6']],
    solution: '建議平台導入「尖峰時段動態調度」機制，同時提供外送員意外險加保選項，並將等待超時的部分費用轉為外送員的即時獎勵金，而非全數由平台留存。',
    peerFeedback: ['A 隊：有具體的獎勵金機制很不錯，但沒有談到跟外送員工會的溝通。', 'C 隊：動態調度的想法可行，建議補充系統開發的時程評估。'],
    aiComment: '方案兼顧了外送員誘因與平台成本，但對「尖峰時段動態調度」的技術可行性著墨較少，建議下次補充實作時程。',
    teacherComment: '對外送員工時安排的分析很細，但方案缺少成本試算，下次可以多補財務面的量化。',
  },
  {
    id: 'h2', title: '新創資源分配決策', meta: '課程：資訊管理專題研究 · 2026/05/03 · 隊伍：A 隊', rank: '第 1 名／4 隊',
    scoreLines: [['各組互評平均分', '92'], ['AI 評分（參考）', '91']],
    solution: '建議將有限的工程資源優先投入付費轉換率最高的核心功能，行銷預算則分三階段依成效滾動調整，並明確設定每階段若未達標即終止投入的停損點。',
    peerFeedback: ['B 隊：停損點的設計很務實，值得參考。', 'D 隊：核心功能的判斷標準寫得很清楚。'],
    aiComment: '資源分配的優先順序邏輯扎實，且有主動要求標示假設前提，是本場 D3 辨識向度最高分的隊伍。',
    teacherComment: null,
  },
];

export default function History() {
  const [openIds, setOpenIds] = useState(() => new Set());

  function toggle(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {HISTORY.map((h) => {
        const isOpen = openIds.has(h.id);
        return (
          <div className="stu-hist-card" key={h.id}>
            <button type="button" className="stu-hist-head" onClick={() => toggle(h.id)}>
              <div>
                <div className="stu-t">{h.title}</div>
                <div className="stu-meta">{h.meta}</div>
              </div>
              <div className="stu-hist-rank">{h.rank}</div>
            </button>
            <div className={`stu-hist-body${isOpen ? ' stu-hist-body-open' : ''}`}>
              <div className="stu-hist-body-inner">
                {h.scoreLines.map(([label, value]) => (
                  <div className="stu-score-line" key={label}><span className="stu-n">{label}</span><span className="stu-v">{value}</span></div>
                ))}
                <div className="eyebrow" style={{ marginTop: 14 }}>當時提出的完整解方</div>
                <div className="stu-hist-feedback">{h.solution}</div>
                <div className="eyebrow" style={{ marginTop: 14 }}>各組互評</div>
                <div className="stu-hist-feedback">
                  {h.peerFeedback.map((line, i) => (
                    <span key={i}>{line}{i < h.peerFeedback.length - 1 && <br />}</span>
                  ))}
                </div>
                <div className="eyebrow" style={{ marginTop: 14 }}>AI 評語</div>
                <div className="stu-hist-feedback">{h.aiComment}</div>
                {h.teacherComment && (
                  <>
                    <div className="eyebrow" style={{ marginTop: 14 }}>老師評語</div>
                    <div className="stu-hist-feedback">{h.teacherComment}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
