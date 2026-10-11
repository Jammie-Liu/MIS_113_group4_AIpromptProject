import { DIM_4D, DIM_4D_MAX } from '../data.js'

/*
  課程 4D 統計表：這個題目的「平均、高標（第 75 百分位）、低標（第 25 百分位）、中位數、標準差」，
  四個維度分開，每個維度滿分 25。競賽結束後寫入課程資料庫，用來追蹤這門課學生的 4D 能力成長。
  tone="dark" 用在深色的評分與總覽，tone="light" 用在淺色的課程頁。
*/
export default function FourDStatsTable({ stats, tone = 'light' }) {
  const weakest = DIM_4D.reduce((min, dim) => (stats[dim.key].mean < stats[min.key].mean ? dim : min), DIM_4D[0])
  return (
    <div className={`fds fds-${tone}`}>
      <table>
        <thead>
          <tr>
            <th>維度</th><th>平均</th><th>高標<small>（第 75 百分位）</small></th><th>低標<small>（第 25 百分位）</small></th><th>中位數</th><th>標準差</th>
          </tr>
        </thead>
        <tbody>
          {DIM_4D.map((dim) => {
            const s = stats[dim.key]
            return (
              <tr key={dim.key} className={dim.key === weakest.key ? 'weak' : ''}>
                <td><b>{dim.key} {dim.label}</b>{dim.key === weakest.key && <em>全班最弱</em>}</td>
                <td className="mean">
                  <div className="mean-cell">
                    <span className="bar" aria-hidden="true"><i style={{ width: `${(s.mean / DIM_4D_MAX) * 100}%` }} /></span>
                    <b>{s.mean.toFixed(1)}</b>
                  </div>
                </td>
                <td>{s.p75.toFixed(1)}</td>
                <td>{s.p25.toFixed(1)}</td>
                <td>{s.median.toFixed(1)}</td>
                <td>{s.sd.toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p>每個維度滿分 {DIM_4D_MAX} 分。以每位學生各回合平均的 4D 分數計算，四個維度分開統計。</p>
    </div>
  )
}
