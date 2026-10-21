export default function Switch({ checked, onChange, ariaLabel }) {
  return (
    <label className="stu-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={ariaLabel} />
      <span className="stu-slider" />
    </label>
  );
}
