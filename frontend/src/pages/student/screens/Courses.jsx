import { COURSES, TEACHERS } from '../data.js';

export default function Courses({ onSelectCourse }) {
  return (
    <div className="stu-course-grid">
      {COURSES.map((c) => {
        const teacherNames = c.teacherIds.map((id) => TEACHERS[id].name).join('、');
        return (
          <button type="button" className="stu-course-card" key={c.id} onClick={() => onSelectCourse(c.id)}>
            <div className="stu-t">{c.name}</div>
            <div className="stu-d">{teacherNames} · {c.schedule}</div>
            {c.activeArenas.length > 0 ? (
              <div className="stu-course-badge stu-course-badge-live">🔴 {c.activeArenas.length} 場競賽進行中</div>
            ) : (
              <div className="stu-course-badge stu-course-badge-idle">目前沒有進行中的競賽</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
