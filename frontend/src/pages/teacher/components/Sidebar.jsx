import { useEffect, useState } from 'react'
import { BANK_LEVELS } from '../data.js'

const LINKS = [
  {
    id: 'teacher-home',
    label: '首頁',
    icon: (
      <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 11.5 12 4.5l8.5 7" />
        <path d="M5.5 10v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10" />
        <path d="M9.5 19.5V14a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: '設定',
    icon: (
      <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2.8" />
        <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8 6.3 6.3" />
      </svg>
    ),
  },
]

const BANK_ICON = (
    <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.2c-1.6-1.4-3.7-2-6.5-2A1 1 0 0 0 4.5 5.2v12.6c0 .6.5 1 1.1.9 2.5-.3 4.5.2 6 1.5" />
        <path d="M12 6.2c1.6-1.4 3.7-2 6.5-2a1 1 0 0 1 1 1v12.6c0 .6-.5 1-1.1.9-2.5-.3-4.5.2-6 1.5" />
        <path d="M12 6.2v14" />
      </svg>
)

const COURSE_ICON = (
  <svg className="icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
  </svg>
)

function Chevron({ open }) {
  return (
    <svg className={`sb-chev${open ? ' open' : ''}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/*
  側邊欄：「首頁」底下可以展開「課程管理」，「課程管理」再展開所有課程標題，
  點課程標題會直接進入該課程。目前正在看某堂課時，會自動把兩層都展開並標出那堂課。
  「題庫管理」同樣可以展開成「依分類」「依難度」，再展開各分類／難度，點項目就直接看該類題庫。
*/
export default function Sidebar({ activeScreen, open, onNavigate, courses, activeCourseId, onSelectCourse, bank, categories, onAddCategory, bankFilter, onSelectBankFilter }) {
  const bankSubs = [
    { type: 'category', label: '依分類', items: categories },
    { type: 'level', label: '依難度', items: BANK_LEVELS },
  ]
  const [homeOpen, setHomeOpen] = useState(true)
  const [courseOpen, setCourseOpen] = useState(false)
  const homeLink = LINKS[0]
  const otherLinks = LINKS.slice(1)
  const inCourse = activeScreen === 'course-detail'
  const inBank = activeScreen === 'bank-manage'
  const [bankOpen, setBankOpen] = useState(false)
  const [bankSubOpen, setBankSubOpen] = useState({ category: false, level: false })

  useEffect(() => {
    if (inCourse) {
      setHomeOpen(true)
      setCourseOpen(true)
    }
  }, [inCourse])

  // 進到題庫管理時，自動展開並標出目前看的那一類
  useEffect(() => {
    if (inBank) {
      setBankOpen(true)
      if (bankFilter.type !== 'all') setBankSubOpen((prev) => ({ ...prev, [bankFilter.type]: true }))
    }
  }, [inBank, bankFilter.type])

  return (
    <aside className={`sidebar${open ? '' : ' collapsed'}`}>
      <div className="sb-top">
        <div className="sb-avatar">張</div>
        <div className="sb-who">
          <div className="name">張欣綠 老師</div>
          <div className="role">資訊管理學系</div>
        </div>
      </div>

      <div className="sb-group">
        <div className={`sb-link sb-parent${activeScreen === homeLink.id ? ' active' : ''}`} onClick={() => onNavigate(homeLink.id)}>
          <span className="ic">{homeLink.icon}</span>
          <span className="sb-label">{homeLink.label}</span>
          <button
            type="button"
            className="sb-toggle"
            aria-label={homeOpen ? '收合首頁底下的選項' : '展開首頁底下的選項'}
            aria-expanded={homeOpen}
            onClick={(e) => { e.stopPropagation(); setHomeOpen((v) => !v) }}
          >
            <Chevron open={homeOpen} />
          </button>
        </div>

        {homeOpen && (
          <div className="sb-children">
            <div
              className={`sb-link sb-sub${inCourse ? ' on-path' : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={courseOpen}
              onClick={() => setCourseOpen((v) => !v)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCourseOpen((v) => !v) } }}
            >
              <span className="ic">{COURSE_ICON}</span>
              <span className="sb-label">課程管理</span>
              <Chevron open={courseOpen} />
            </div>

            {courseOpen && (
              <div className="sb-children sb-leaves">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`sb-link sb-leaf${inCourse && activeCourseId === course.id ? ' active' : ''}`}
                    role="button"
                    tabIndex={0}
                    title={course.title}
                    onClick={() => onSelectCourse(course)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSelectCourse(course) }}
                  >
                    <span className="sb-dot" aria-hidden="true" />
                    <span className="sb-label">{course.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sb-group">
        <div className={`sb-link sb-parent${inBank ? (bankFilter.type === 'all' ? ' active' : ' on-path') : ''}`} onClick={() => onSelectBankFilter('all')}>
          <span className="ic">{BANK_ICON}</span>
          <span className="sb-label">題庫管理</span>
          <button
            type="button"
            className="sb-toggle"
            aria-label={bankOpen ? '收合題庫管理底下的選項' : '展開題庫管理底下的選項'}
            aria-expanded={bankOpen}
            onClick={(e) => { e.stopPropagation(); setBankOpen((v) => !v) }}
          >
            <Chevron open={bankOpen} />
          </button>
        </div>

        {bankOpen && (
          <div className="sb-children">
            {bankSubs.map((sub) => {
              const subOpen = bankSubOpen[sub.type]
              const toggleSub = () => setBankSubOpen((prev) => ({ ...prev, [sub.type]: !prev[sub.type] }))
              return (
                <div key={sub.type}>
                  <div
                    className={`sb-link sb-sub${inBank && bankFilter.type === sub.type ? ' on-path' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={subOpen}
                    onClick={toggleSub}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSub() } }}
                  >
                    <span className="sb-label">{sub.label}</span>
                    <Chevron open={subOpen} />
                  </div>
                  {subOpen && (
                    <div className="sb-children sb-leaves">
                      {sub.items.map((item) => {
                        const key = sub.type === 'level' ? 'diff' : 'category'
                        const count = bank.filter((b) => b[key] === item.name).length
                        const active = inBank && bankFilter.type === sub.type && bankFilter.value === item.name
                        return (
                          <div
                            key={item.name}
                            className={`sb-link sb-leaf${active ? ' active' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectBankFilter(sub.type, item.name)}
                            onKeyDown={(e) => { if (e.key === 'Enter') onSelectBankFilter(sub.type, item.name) }}
                          >
                            <span className="sb-dot" style={{ background: item.tone, opacity: 1 }} aria-hidden="true" />
                            <span className="sb-label">{item.name}{sub.type === 'level' ? '難度' : ''}</span>
                            <small className="sb-count">{count}</small>
                          </div>
                        )
                      })}
                      {sub.type === 'category' && (
                        <div
                          className="sb-link sb-leaf sb-add"
                          role="button"
                          tabIndex={0}
                          onClick={onAddCategory}
                          onKeyDown={(e) => { if (e.key === 'Enter') onAddCategory() }}
                        >
                          <span className="sb-add-plus" aria-hidden="true">＋</span>
                          <span className="sb-label">新增分類</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {otherLinks.map((link) => (
        <div
          key={link.id}
          className={`sb-link${activeScreen === link.id ? ' active' : ''}`}
          onClick={() => onNavigate(link.id)}
        >
          <span className="ic">{link.icon}</span>{link.label}
        </div>
      ))}
    </aside>
  )
}
