import { COURSES } from '../data.js'

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

export default function TeacherHome({ onSelectCourse }) {
  return (
    <>
      <div className="home-hero">
        <div className="home-greet">
          <div className="home-greet-title">歡迎回來，張欣綠老師</div>
          <div className="home-greet-sub">這是你目前開設的所有課程總覽</div>
        </div>
        <div className="home-stats">
          <div className="home-stat"><div className="home-stat-v">3</div><div className="home-stat-k">門課程</div></div>
          <div className="home-stat"><div className="home-stat-v">95</div><div className="home-stat-k">位學生</div></div>
          <div className="home-stat"><div className="home-stat-v">4</div><div className="home-stat-k">場累計競賽</div></div>
        </div>
      </div>
      <div className="course-grid">
        {COURSES.map((course) => (
          <div key={course.id} className="course-card" onClick={() => onSelectCourse(course)}>
            <div className="course-card-top">
              <span className="term">{course.term}</span>
              <div className="course-icon">{COURSE_ICONS[course.icon]}</div>
            </div>
            <h3>{course.title}</h3>
            <div className="meta">
              {course.cardMeta[0]}<br />{course.cardMeta[1]}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
