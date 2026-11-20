import { useEffect, useState } from 'react'
import { BANK_LEVELS } from '../data.js'
import { IconClose } from '../icons.jsx'
import { LogoMark } from '../../landing/Landing.jsx'

const OVERVIEW_ICON = (
  <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 11.5 12 4.5l8.5 7" />
    <path d="M5.5 10v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10" />
    <path d="M9.5 19.5V14a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" />
  </svg>
)

const BANK_ICON = (
    <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.2c-1.6-1.4-3.7-2-6.5-2A1 1 0 0 0 4.5 5.2v12.6c0 .6.5 1 1.1.9 2.5-.3 4.5.2 6 1.5" />
        <path d="M12 6.2c1.6-1.4 3.7-2 6.5-2a1 1 0 0 1 1 1v12.6c0 .6-.5 1-1.1.9-2.5-.3-4.5.2-6 1.5" />
        <path d="M12 6.2v14" />
      </svg>
)

const COURSE_ICON = (
  <svg className="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  側邊欄做成「抽屜」：點上方列的漢堡選單從左邊滑出來，蓋在畫面上面，後面調暗不能點，版面不會被推開；
  點後面暗的地方、右上角叉叉或按 Esc 關閉（遮罩和 Esc 在 TeacherApp.jsx）。
  最上面是「總覽」（芊穎做的教師端新版首頁：進行中的競賽＋題庫；網站的首頁是只有學生、教師兩個入口
  的那一頁，點左上角 logo 回去，所以這裡不叫「首頁」）。再來是「課程管理」（點了到課程列表），
  旁邊的箭頭展開所有課程標題，
  點課程標題會直接進入該課程。目前正在看某堂課時，會自動展開並標出那堂課。
  「設定」「帳號資訊」放在右上角頭像選單（Topbar.jsx），側邊欄不重複放。
  「題庫管理」同樣可以展開成「依分類」「依難度」，再展開各分類／難度，點項目就直接看該類題庫。
*/
export default function Sidebar({ activeScreen, open, onClose, onNavigate, courses, activeCourseId, onSelectCourse, bank, categories, onAddCategory, bankFilter, onSelectBankFilter }) {
  const bankSubs = [
    { type: 'category', label: '依分類', items: categories },
    { type: 'level', label: '依難度', items: BANK_LEVELS },
  ]
  const [courseOpen, setCourseOpen] = useState(false)
  const inCourse = activeScreen === 'course-detail' || activeScreen === 'courses'
  const inBank = activeScreen === 'bank-manage'
  const [bankOpen, setBankOpen] = useState(false)
  const [bankSubOpen, setBankSubOpen] = useState({ category: false, level: false })

  useEffect(() => {
    if (inCourse) setCourseOpen(true)
  }, [inCourse])

  // 進到題庫管理時，自動展開並標出目前看的那一類
  useEffect(() => {
    if (inBank) {
      setBankOpen(true)
      if (bankFilter.type !== 'all') setBankSubOpen((prev) => ({ ...prev, [bankFilter.type]: true }))
    }
  }, [inBank, bankFilter.type])

  return (
    <aside className={`sidebar${open ? '' : ' collapsed'}`} aria-hidden={!open} inert={!open}>
      {/* 抽屜最上面：左邊 logo、右邊關閉鈕（叉叉放在抽屜裡面）。頭像在上方列右上角（Topbar.jsx） */}
      <div className="sb-head">
        <span className="sb-logo"><LogoMark /></span>
        <button type="button" className="sb-close" aria-label="關閉選單" onClick={onClose}><IconClose size={16} /></button>
      </div>
      <div className={`sb-link${activeScreen === 'teacher-home' ? ' active' : ''}`} onClick={() => onNavigate('teacher-home')}>
        <span className="ic">{OVERVIEW_ICON}</span>總覽
      </div>

      <div className="sb-group">
        <div className={`sb-link sb-parent${activeScreen === 'courses' ? ' active' : inCourse ? ' on-path' : ''}`} onClick={() => onNavigate('courses')}>
          <span className="ic">{COURSE_ICON}</span>
          <span className="sb-label">課程管理</span>
          <button
            type="button"
            className="sb-toggle"
            aria-label={courseOpen ? '收合課程清單' : '展開課程清單'}
            aria-expanded={courseOpen}
            onClick={(e) => { e.stopPropagation(); setCourseOpen((v) => !v) }}
          >
            <Chevron open={courseOpen} />
          </button>
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
                            <span className="sb-dot" aria-hidden="true" />
                            <span className="sb-label">{item.name}</span>
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
    </aside>
  )
}
