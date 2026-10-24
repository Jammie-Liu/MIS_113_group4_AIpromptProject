import { useState } from 'react'
import Modal from '../components/Modal.jsx'
import { courseLabels, generateCourseCode } from '../data.js'

const COURSE_ICONS = {
  grad: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9V16h5v-.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3z" />
    </svg>
  ),
  bars: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20V11M12 20V6M19 20v-7" />
      <path d="M3 20h18" />
    </svg>
  ),
  trend: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16l5-5 4 3 6-7" />
      <path d="M15 7h4v4" />
    </svg>
  ),
}

const ICON_CYCLE = ['grad', 'bars', 'trend']

// datetime-local 輸入框要的格式：yyyy-MM-ddTHH:mm（本地時間）
function toLocalInput(date) {
  const pad2 = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function addMonths(value, months) {
  const d = new Date(value)
  d.setMonth(d.getMonth() + months)
  return toLocalInput(d)
}

function emptyForm() {
  const now = new Date()
  now.setSeconds(0, 0)
  const publishAt = toLocalInput(now)
  return { title: '', intro: '', visibility: 'public', capacity: '40', publishAt, endAt: addMonths(publishAt, 6), endTouched: false, price: '', tags: '' }
}

/*
  開設課程（docs/system-flow.md 三）：
  必填——課程名稱、課程介紹、公開／私人、人數限制、發布時間；選填——結束時間（預設半年）、價錢、標籤。
  私人課程學生加入後要老師審核；公開課程自動通過。
*/
function CreateCourseModal({ show, onClose, onCreate, courseCount }) {
  const [form, setForm] = useState(emptyForm)
  const [tried, setTried] = useState(false)

  function setField(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value }
      // 結束時間沒有手動改過時，跟著發布時間自動帶「半年後」
      if (field === 'publishAt' && !f.endTouched && value) next.endAt = addMonths(value, 6)
      if (field === 'endAt') next.endTouched = true
      return next
    })
  }

  const capacityNum = Number(form.capacity)
  const errors = {
    title: !form.title.trim() ? '請填課程名稱' : '',
    intro: !form.intro.trim() ? '請填課程介紹' : '',
    capacity: !Number.isInteger(capacityNum) || capacityNum < 1 ? '人數限制要是 1 以上的整數' : '',
    publishAt: !form.publishAt ? '請選擇發布時間' : '',
    endAt: form.endAt && form.publishAt && new Date(form.endAt) <= new Date(form.publishAt) ? '結束時間要在發布時間之後' : '',
    price: form.price !== '' && (Number.isNaN(Number(form.price)) || Number(form.price) < 0) ? '價錢要是 0 以上的數字' : '',
  }
  const hasError = Object.values(errors).some(Boolean)

  function close() {
    setForm(emptyForm())
    setTried(false)
    onClose()
  }

  function submit(e) {
    e.preventDefault()
    setTried(true)
    if (hasError) return
    const published = new Date(form.publishAt)
    onCreate({
      id: `c${Date.now()}`,
      term: `${published.getFullYear()}/${published.getMonth() + 1} 開課`,
      icon: ICON_CYCLE[courseCount % ICON_CYCLE.length],
      title: form.title.trim(),
      intro: form.intro.trim(),
      schedule: '尚未設定上課時間',
      studentCount: 0,
      competitionCount: 0,
      visibility: form.visibility,
      capacity: capacityNum,
      publishAt: form.publishAt,
      endAt: form.endAt || null,
      price: form.price === '' ? null : Number(form.price),
      tags: form.tags.split(/[,，、\s]+/).map((t) => t.trim()).filter(Boolean),
      joinCode: generateCourseCode(),
      pending: [],
      extraStudents: [],
    })
    close()
  }

  const showErr = (field) => (tried && errors[field] ? <small className="field-error">{errors[field]}</small> : null)

  return (
    <Modal show={show} onClose={close} labelledBy="createCourseTitle">
      <div className="modal-head" id="createCourseTitle">
        <div className="name">開設課程</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>填寫課程資料，建立後系統會產生課程代碼與 QR Code 讓學生加入・<span className="required-mark">＊</span> 為必填</div>
      </div>
      <form className="case-form course-form" onSubmit={submit} style={{ marginTop: 16 }}>
        <label htmlFor="cfTitle">課程名稱<span className="required-mark">＊</span></label>
        <div className="cf-field">
          <input id="cfTitle" type="text" maxLength={40} placeholder="例：AI 提示工程與批判思考" value={form.title} onChange={(e) => setField('title', e.target.value)} />
          {showErr('title')}
        </div>
        <label htmlFor="cfIntro">課程介紹<span className="required-mark">＊</span></label>
        <div className="cf-field">
          <textarea id="cfIntro" maxLength={300} placeholder="簡單說明這門課在做什麼" value={form.intro} onChange={(e) => setField('intro', e.target.value)} />
          {showErr('intro')}
        </div>
        <label>公開／私人<span className="required-mark">＊</span></label>
        <div className="cf-chips" role="radiogroup" aria-label="公開或私人">
          <button type="button" role="radio" aria-checked={form.visibility === 'public'} className={form.visibility === 'public' ? 'on' : ''} onClick={() => setField('visibility', 'public')}>公開</button>
          <button type="button" role="radio" aria-checked={form.visibility === 'private'} className={form.visibility === 'private' ? 'on' : ''} onClick={() => setField('visibility', 'private')}>私人</button>
          <small>{form.visibility === 'private' ? '學生用代碼加入後，要經過你審核才算加入' : '學生用代碼加入後自動通過'}</small>
        </div>
        <label htmlFor="cfCap">人數限制<span className="required-mark">＊</span></label>
        <div className="cf-field">
          <input id="cfCap" type="number" min="1" step="1" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} />
          {showErr('capacity')}
        </div>
        <label htmlFor="cfPublish">發布時間<span className="required-mark">＊</span></label>
        <div className="cf-field">
          <input id="cfPublish" type="datetime-local" value={form.publishAt} onChange={(e) => setField('publishAt', e.target.value)} />
          {showErr('publishAt')}
        </div>
        <label htmlFor="cfEnd">結束時間（選填）</label>
        <div className="cf-field">
          <input id="cfEnd" type="datetime-local" value={form.endAt} onChange={(e) => setField('endAt', e.target.value)} />
          <small className="cf-hint">預設是發布時間後半年，會跟著發布時間自動調整</small>
          {showErr('endAt')}
        </div>
        <label htmlFor="cfPrice">價錢（選填）</label>
        <div className="cf-field">
          <input id="cfPrice" type="number" min="0" step="1" placeholder="不填就是免費" value={form.price} onChange={(e) => setField('price', e.target.value)} />
          {showErr('price')}
        </div>
        <label htmlFor="cfTags">標籤（選填，用逗號分開）</label>
        <input id="cfTags" type="text" placeholder="例：提示工程, 商業分析" value={form.tags} onChange={(e) => setField('tags', e.target.value)} />
        <button type="submit" className="hint-btn sm" style={{ marginTop: 14 }}>建立課程</button>
      </form>
    </Modal>
  )
}

export default function TeacherHome({ courses, onSelectCourse, onCreateCourse }) {
  const [createOpen, setCreateOpen] = useState(false)
  const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0)
  const totalCompetitions = courses.reduce((sum, c) => sum + c.competitionCount, 0)
  return (
    <>
      <div className="home-hero">
        <div className="home-hero-copy">
          <div className="home-greet-kicker"><span className="home-live-dot" /> TEACHER SPACE</div>
          <div className="home-greet-title">歡迎回來，張欣綠老師</div>
          <div className="home-greet-sub">每一堂課，都是新的探索。來看看今天的教學進度吧。</div>
          <div className="home-hero-note"><span aria-hidden="true">✦</span> 你的課程都整理好了，準備開始今天的教學旅程嗎？</div>
        </div>
        <div className="home-stats" aria-label="教學概況">
          <div className="home-stat"><div className="home-stat-v">{courses.length}</div><div className="home-stat-k">開設課程</div></div>
          <div className="home-stat"><div className="home-stat-v">{totalStudents}</div><div className="home-stat-k">位學習夥伴</div></div>
          <div className="home-stat"><div className="home-stat-v">{totalCompetitions}</div><div className="home-stat-k">累計競賽</div></div>
        </div>
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-spark spark-one" aria-hidden="true">✦</div>
        <div className="hero-spark spark-two" aria-hidden="true">✧</div>
      </div>

      <section className="home-section" aria-labelledby="course-section-title">
        <div className="home-section-heading">
          <div>
            <p className="home-section-kicker">YOUR CLASSROOMS</p>
            <h2 id="course-section-title">課程管理 <span>✳</span></h2>
            <p>選一門課，繼續打造精彩的學習體驗。</p>
          </div>
          <div className="home-heading-actions">
            <button type="button" className="hint-btn ghost sm" onClick={() => setCreateOpen(true)}>＋ 開設課程</button>
            <div className="course-count"><strong>{courses.length}</strong><span>門課程</span></div>
          </div>
        </div>
        <div className="course-grid">
          {courses.map((course, idx) => (
            <CourseCard key={course.id} course={course} delay={idx * 0.05} onSelect={() => onSelectCourse(course)} />
          ))}
        </div>
      </section>

      <CreateCourseModal show={createOpen} onClose={() => setCreateOpen(false)} onCreate={onCreateCourse} courseCount={courses.length} />
    </>
  )
}

const META_ICONS = {
  students: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7" /><circle cx="17" cy="9.5" r="2.4" /><path d="M15.5 14.6c2.4-.2 4.3 1.3 5 4.2" /></svg>,
  schedule: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>,
  competitions: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4.2a5 5 0 0 1-10 0z" /><path d="M7 5.2H4.3A2.8 2.8 0 0 0 7 9.5" /><path d="M17 5.2h2.7A2.8 2.8 0 0 1 17 9.5" /><path d="M12 13.2v3" /><path d="M9 20h6" /></svg>,
}

/*
  課程卡片：左上圖示＋學期與課名，中間三行資訊（人數、上課時間、競賽場次）各配一個小圖示、
  左邊對齊，最下面是「進入課程」。卡片用 flex 直排，三張卡片即使課名長短不同，底部也會對齊。
*/
function CourseCard({ course, delay, onSelect }) {
  const labels = courseLabels(course)
  const rows = [
    ['students', labels.students],
    ['schedule', course.schedule],
    ['competitions', labels.competitions],
  ]
  return (
    <button className={`course-card pop-in course-tone-${course.icon}`} style={{ animationDelay: `${delay}s` }} onClick={onSelect} type="button" aria-label={`查看課程：${course.title}`}>
      <div className="course-card-head">
        <div className="course-icon">{COURSE_ICONS[course.icon]}</div>
        <div className="course-card-title">
          {/* 待審核放在學期標籤那一列的最右邊（卡片右上角），不另外佔一列，每張卡片的「進入課程」才會在同一個位置 */}
          <div className="course-card-tags">
            <span className="term">{course.term}{course.visibility === 'private' && <em className="private-tag">私人</em>}</span>
            {course.pending.length > 0 && <span className="course-pending-badge">待審核<b>{course.pending.length}</b></span>}
          </div>
          <h3>{course.title}</h3>
        </div>
      </div>
      <ul className="course-card-meta">
        {rows.map(([key, text]) => (
          <li key={key}><span className="meta-ic" aria-hidden="true">{META_ICONS[key]}</span>{text}</li>
        ))}
      </ul>
      <div className="course-card-footer"><span>進入課程</span><span className="course-arrow" aria-hidden="true">↗</span></div>
    </button>
  )
}
