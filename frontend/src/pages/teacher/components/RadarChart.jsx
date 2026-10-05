import { DIM_4D } from '../data.js'

const CX = 195
const CY = 150
const RADIUS = 92
const LABEL_GAP = 16

function point(index, pct, radius = RADIUS) {
  const angle = (-90 + index * 90) * (Math.PI / 180)
  const r = (pct / 100) * radius
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
}

function polygon(values) {
  return DIM_4D.map((dim, i) => point(i, values[dim.key]).join(',')).join(' ')
}

// 標籤一律放在圖形外圍，上下兩個置中、左右兩個靠外側對齊，避免壓到多邊形與數據點
const LABELS = [
  { x: CX, y: CY - RADIUS - LABEL_GAP, anchor: 'middle' },
  { x: CX + RADIUS + LABEL_GAP, y: CY + 3, anchor: 'start' },
  { x: CX, y: CY + RADIUS + LABEL_GAP + 8, anchor: 'middle' },
  { x: CX - RADIUS - LABEL_GAP, y: CY + 3, anchor: 'end' },
]

// 4D 雷達圖：實線是該隊，虛線是全班平均
export default function RadarChart({ values, compare }) {
  return (
    <svg className="rs-radar" viewBox="0 0 390 310" role="img" aria-label="4D 雷達圖">
      {[25, 50, 75, 100].map((ring) => (
        <polygon key={ring} className="rs-radar-ring" points={DIM_4D.map((dim, i) => point(i, ring).join(',')).join(' ')} />
      ))}
      {DIM_4D.map((dim, i) => {
        const [x, y] = point(i, 100)
        return <line key={dim.key} className="rs-radar-axis" x1={CX} y1={CY} x2={x} y2={y} />
      })}
      {compare && <polygon className="rs-radar-compare" points={polygon(compare)} />}
      <polygon className="rs-radar-team" points={polygon(values)} />
      {DIM_4D.map((dim, i) => {
        const [x, y] = point(i, values[dim.key])
        return <circle key={dim.key} className="rs-radar-dot" cx={x} cy={y} r="4" />
      })}
      {DIM_4D.map((dim, i) => (
        <text key={dim.key} className="rs-radar-label" x={LABELS[i].x} y={LABELS[i].y} textAnchor={LABELS[i].anchor}>
          {dim.key} {dim.label}
          <tspan className="rs-radar-score" dx="5">{Math.round(values[dim.key])}</tspan>
        </text>
      ))}
    </svg>
  )
}
