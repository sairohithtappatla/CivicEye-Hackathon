function DescriptionBox({ value, onChange }) {
  return (
    <div className="gov-field">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Describe the issue
      </label>
      <textarea
        className="gov-input"
        placeholder="Give a clear, concise description — what happened, where, and when."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
      />
    </div>
  );
}
export default DescriptionBox;
