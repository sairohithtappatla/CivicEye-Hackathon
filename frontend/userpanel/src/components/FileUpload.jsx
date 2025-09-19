function FileUpload({ fileRef, photo, photoURL, onFileChange, onRemove }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Upload photo / proof (optional)
      </label>
      <label className="gov-file" htmlFor="photo-upload">
        <div className="gov-file-info">
          {photo ? (
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">{photo.name}</div>
              <div className="text-xs text-slate-500">
                {(photo.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              Click to choose photo or drag & drop (jpg, png). Max 10MB.
            </div>
          )}
        </div>
        <button
          type="button"
          className="gov-file-btn"
          onClick={() => fileRef.current?.click()}
        >
          📷 Upload Photo
        </button>
        <input
          id="photo-upload"
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </label>

      {photoURL && (
        <div className="mt-3 flex items-start gap-3">
          <img
            src={photoURL}
            alt="preview"
            className="gov-preview w-28 h-28 object-cover"
          />
          <div className="flex-1">
            <div className="text-sm font-medium">{photo.name}</div>
            <div className="text-xs text-slate-500 mt-2">{photo.type || ""}</div>
            <button
              type="button"
              onClick={onRemove}
              className="gov-loc-btn mt-3"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default FileUpload;
