import { useEffect, useState } from 'react'
import { COURSES, ACHIEVEMENTS } from '../data.js'

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

export default function TeacherHome({ onSelectCourse, unlockedAchievementIds, justUnlockedId }) {
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

      <section className="home-achievements" aria-labelledby="achievement-title">
        <div className="achievement-heading">
          <div>
            <p className="home-section-kicker">LITTLE WINS</p>
            <h2 id="achievement-title">教學成就</h2>
          </div>
          <span>持續累積，解鎖更多徽章</span>
        </div>
        <div className="achv-row">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedAchievementIds.has(a.id)
            return (
              <div
                key={a.id}
                className={`achv-badge${unlocked ? ' unlocked' : ''}${justUnlockedId === a.id ? ' just-unlocked' : ''}`}
                title={a.desc}
              >
                <span className="ic">{a.icon}</span>
                <div>
                  <div className="t">{a.title}</div>
                  <div className="d">{unlocked ? a.desc : '尚未解鎖'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

function CourseCard({ course, delay, onSelect }) {
  const targetPct = Math.min(100, Math.round((course.competitionsDone / course.competitionGoal) * 100))
  const [fillPct, setFillPct] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setFillPct(targetPct), 250 + delay * 1000)
    return () => window.clearTimeout(t)
  }, [targetPct, delay])

  return (
    <button className={`course-card pop-in course-tone-${course.icon}`} style={{ animationDelay: `${delay}s` }} onClick={onSelect} type="button" aria-label={`查看課程：${course.title}`}>
      <div className="course-card-top">
        <span className="term">{course.term}</span>
        <div className="course-icon">{COURSE_ICONS[course.icon]}</div>
      </div>
      <h3>{course.title}</h3>
      <div className="meta">
        {course.cardMeta[0]}<br />{course.cardMeta[1]}
      </div>
      <div className="course-progress">
        <div className="course-progress-label">
          <span>競賽進度</span>
          <span>{course.competitionsDone} / {course.competitionGoal}</span>
        </div>
        <div className="course-progress-track">
          <div className="course-progress-fill" style={{ width: `${fillPct}%` }} />
        </div>
      </div>
      <div className="course-card-footer"><span>進入課程</span><span className="course-arrow" aria-hidden="true">↗</span></div>
    </button>
  )
}
