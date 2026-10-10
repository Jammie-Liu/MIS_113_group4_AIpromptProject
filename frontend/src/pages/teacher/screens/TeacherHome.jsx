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
        <div className="home-hero-copy">
          <div className="home-greet-kicker"><span className="home-live-dot" /> TEACHER SPACE</div>
          <div className="home-greet-title">歡迎回來，張欣綠老師</div>
          <div className="home-greet-sub">每一堂課，都是新的探索。來看看今天的教學進度吧。</div>
          <div className="home-hero-note"><span aria-hidden="true">✦</span> 你的課程都整理好了，準備開始今天的教學旅程嗎？</div>
        </div>
        <div className="home-stats" aria-label="教學概況">
          <div className="home-stat"><div className="home-stat-v">3</div><div className="home-stat-k">開設課程</div></div>
          <div className="home-stat"><div className="home-stat-v">95</div><div className="home-stat-k">位學習夥伴</div></div>
          <div className="home-stat"><div className="home-stat-v">4</div><div className="home-stat-k">累計競賽</div></div>
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
            <h2 id="course-section-title">課程總覽 <span>✳</span></h2>
            <p>選一門課，繼續打造精彩的學習體驗。</p>
          </div>
          <div className="course-count"><strong>{COURSES.length}</strong><span>門課程</span></div>
        </div>
        <div className="course-grid">
          {COURSES.map((course, idx) => (
            <CourseCard key={course.id} course={course} delay={idx * 0.05} onSelect={() => onSelectCourse(course)} />
          ))}
        </div>
      </section>
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
  const rows = [
    ['students', course.students],
    ['schedule', course.schedule],
    ['competitions', course.competitions],
  ]
  return (
    <button className={`course-card pop-in course-tone-${course.icon}`} style={{ animationDelay: `${delay}s` }} onClick={onSelect} type="button" aria-label={`查看課程：${course.title}`}>
      <div className="course-card-head">
        <div className="course-icon">{COURSE_ICONS[course.icon]}</div>
        <div className="course-card-title">
          <span className="term">{course.term}</span>
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
