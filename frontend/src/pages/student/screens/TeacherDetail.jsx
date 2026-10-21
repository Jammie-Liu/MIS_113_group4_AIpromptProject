import { TEACHERS, allCoursesList, avatarColorFor } from '../data.js';

export default function TeacherDetail({ teacherId, onBack, onSelectCourse }) {
  const t = TEACHERS[teacherId];
  const taughtCourses = allCoursesList().filter((c) => c.teacherIds.includes(teacherId));

  return (
    <>
      <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" style={{ marginBottom: 14 }} onClick={onBack}>← 返回課程</button>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="stu-profile-card">
          <div className="stu-profile-avatar" style={{ background: avatarColorFor(t.name) }}>{t.name.charAt(0)}</div>
          <div className="stu-profile-meta">
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{t.name}</div>
            <div>{t.title}・{t.dept}</div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">基本資料</div>
        <div style={{ marginTop: 4 }}>
          <div className="stu-sd-row"><span className="stu-sd-label">Email</span><span className="stu-sd-value">{t.email}</span></div>
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow">開過的課程</div>
        <div style={{ marginTop: 4 }}>
          {taughtCourses.length === 0 ? (
            <div className="stu-sd-empty">目前沒有課程紀錄。</div>
          ) : (
            taughtCourses.map((c) => (
              <button type="button" className="stu-sd-course-link" key={c.id} onClick={() => onSelectCourse(c.id)}>{c.name}</button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
