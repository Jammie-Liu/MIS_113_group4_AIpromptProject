export default function ConfirmModal({ modal, onCancel, onConfirm }) {
  if (!modal) return null;
  return (
    <div className="stu-modal-veil stu-modal-veil-show">
      <div className="stu-modal-box">
        <h3>{modal.title}</h3>
        <p>{modal.body}</p>
        <div className="stu-modal-actions">
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onCancel}>取消</button>
          <button type="button" className="stu-btn stu-btn-sm" onClick={onConfirm}>確定</button>
        </div>
      </div>
    </div>
  );
}
