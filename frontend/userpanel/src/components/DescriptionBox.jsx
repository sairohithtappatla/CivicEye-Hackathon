function DescriptionBox({ value, onChange }) {
  return (
    <div className="gov-field">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Describe the Issue
      </label>
      <textarea
        className="gov-input min-h-[100px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Please provide detailed information about the issue..."
        rows={4}
      />
      <div className="text-xs text-gray-500 mt-1">
        Minimum 10 characters required
      </div>
    </div>
  );
}

export default DescriptionBox;
