function IssueDropdown({ value, onChange }) {
  return (
    <div className="gov-field">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Select Issue Type
      </label>
      <select
        className="gov-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- Choose an issue --</option>
        <option value="garbage">Garbage</option>
        <option value="street_light">Street Light</option>
        <option value="road_damage">Road Damage</option>
        <option value="water_leakage">Water Leakage</option>
        <option value="electricity">Electricity Issue</option>
        <option value="public_safety">Public Safety</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
}
export default IssueDropdown;
