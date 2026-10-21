import { findCourseById, isMyCourse, sortedRoster, TEACHERS, avatarColorFor } from '../data.js';

export default function CourseDetail({ courseId, myName, onBack, onSelectStudent, onSelectTeacher, onJoinArena, showToast }) {
  const course = findCourseById(courseId);
  const enrolled = isMyCourse(courseId);
  const roster = sortedRoster(courseId);

  function handleJoinArena() {
    if (!enrolled) { showToast('您並非本堂課學生，無法加入。'); return; }
    onJoinArena();
  }

  return (
    <>
      <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" style={{ marginBottom: 14 }} onClick={onBack}>← 返回我的課程</button>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{course.name}</div>
        <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', marginTop: 4 }}>{course.schedule}</div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">授課教師</div>
        <div className="stu-roster-grid">
          {course.teacherIds.map((tid) => {
            const t = TEACHERS[tid];
            return (
              <button type="button" className="stu-roster-card" key={tid} onClick={() => onSelectTeacher(tid)}>
                <div className="stu-roster-avatar" style={{ background: avatarColorFor(t.name) }}>{t.name.charAt(0)}</div>
                <div className="stu-roster-name">{t.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">進行中的競賽</div>
        {course.activeArenas.length === 0 ? (
          <div className="stu-course-arena-empty">目前沒有進行中的競賽，等老師開賽後會顯示在這裡。</div>
        ) : (
          <div className="stu-course-arena-list">
            {course.activeArenas.map((a) => (
              <div className="stu-course-arena-card" key={a.id}>
                <div><div className="stu-t">{a.title}</div><div className="stu-d">{a.status}</div></div>
                <button type="button" className="stu-btn stu-btn-sm" onClick={handleJoinArena}>加入賽場</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel stu-course-assignments-locked" style={{ marginBottom: 16 }}>
        <div className="eyebrow">作業</div>
        <div className="stu-course-assignments-empty">🔒 作業功能尚未開放，之後會顯示在這裡。</div>
      </div>

      <div className="panel">
        <div className="eyebrow">同學名單</div>
        {!enrolled ? (
          <div className="stu-course-permission-note">您並非本堂課學生，無法瀏覽。</div>
        ) : (
          <div className="stu-roster-grid">
            {roster.map((s) => {
              const name = s.isSelf ? myName : s.name;
              return (
                <button type="button" className="stu-roster-card" key={s.id} onClick={() => onSelectStudent(s.id)}>
                  <div className="stu-roster-avatar" style={{ background: avatarColorFor(name) }}>{name.charAt(0)}</div>
                  <div className="stu-roster-name">{name}{s.isSelf ? '（你）' : ''}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
