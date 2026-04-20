<script>
  import { currPage, scannedSyllabus } from './store.js'

  let file = $state(null);
  let error = $state("");
  let status = $state("");
  let dragOver = $state(false);

  const ALLOWED_TYPES = "application/pdf";
  const MAX_SIZE_MB = 10;

  function validateFile(f) {
    if (!ALLOWED_TYPES.includes(f.type)) return "Only PDF files are supported.";
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_SIZE_MB}MB.`;
    return null;
  }

  function handleFileSelect(event) {
    const selected = event.target.files[0];
    if (!selected) return;
    const err = validateFile(selected);
    if (err) { error = err; file = null; }
    else { error = ""; file = selected; }
  }

  function handleDrop(event) {
    event.preventDefault();
    dragOver = false;
    const dropped = event.dataTransfer.files[0];
    if (!dropped) return;
    const err = validateFile(dropped);
    if (err) { error = err; file = null; }
    else { error = ""; file = dropped; }
  }

  function handleDragOver(event) { event.preventDefault(); dragOver = true; }
  function handleDragLeave() { dragOver = false; }

  async function handleUpload() {
    if (!file) return;

    const formData = new FormData();
    formData.append("syllabus", file);

    try {
      status = "uploading";
      const res = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
        credentials: 'include',
      });

      status = "preprocessing";
      await new Promise(r => setTimeout(r, 500));

      status = "scanning";

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Upload failed.");
      }

      const result = await res.json();
      status = "done";
      $scannedSyllabus = result
      $currPage = 'postUpload'

    } catch (err) {
      error = err.message || "Something went wrong.";
      status = "";
    }
  }

  function handleReset() {
    file = null;
    error = "";
    status = "";
  }
</script>

<div class="upload-container">
  <header class="upload-header">
    <h2>Upload Syllabus</h2>
    <p class="upload-subtitle">Upload a PDF of your syllabus to extract events automatically.</p>
  </header>

  <div
    class="drop-zone"
    class:drag-over={dragOver}
    class:has-file={file && status === ""}
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    role="region"
    aria-label="Upload zone"
  >
    {#if status === ""}
      {#if !file}
        <div class="drop-idle">
          <div class="drop-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p class="drop-text">Drag and drop your syllabus here, or</p>
          <label class="btn-browse">
            Browse Files
            <input type="file" accept=".pdf" onchange={handleFileSelect} hidden />
          </label>
          <p class="drop-hint">PDF · Max 10MB</p>
        </div>
      {:else}
        <div class="file-ready">
          <div class="drop-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p class="file-name">{file.name}</p>
          <p class="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          <div class="file-actions">
            <button class="btn-primary" onclick={handleUpload}>Upload</button>
            <button class="btn-secondary" onclick={handleReset}>Cancel</button>
          </div>
        </div>
      {/if}
    {:else}
      <div class="status-block">
        <div class="spinner"></div>
        {#if status === "uploading"}
          <p class="status-text">Uploading...</p>
        {:else if status === "preprocessing"}
          <p class="status-text">Preprocessing file...</p>
        {:else if status === "scanning"}
          <p class="status-text">Scanning and parsing syllabus...</p>
        {:else if status === "done"}
          <p class="status-text">Done! Redirecting...</p>
        {/if}
      </div>
    {/if}
  </div>

  {#if error}
    <p class="error-message" role="alert">{error}</p>
  {/if}
</div>

<style>
  .upload-container {
    max-width: 600px;
    margin: 1.5rem auto;
    padding: 0 1rem;
  }

  .upload-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .upload-header h2 {
    margin: 0 0 0.25rem;
    font-size: 1.4rem;
  }

  .upload-subtitle {
    color: #64748b;
    font-size: 0.9rem;
    margin: 0;
  }

  .drop-zone {
    border: 2px dashed #e2e8f0;
    border-radius: 10px;
    padding: 3rem 2rem;
    text-align: center;
    background: #fff;
    transition: border-color 0.2s, background 0.2s;
  }

  .drop-zone.drag-over {
    border-color: #4f46e5;
    background: #eef2ff;
  }

  .drop-zone.has-file {
    border-color: #4f46e5;
    border-style: solid;
  }

  .drop-icon {
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: center;
}

  .drop-text {
    color: #475569;
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
  }

  .drop-hint {
    color: #94a3b8;
    font-size: 0.8rem;
    margin: 0.5rem 0 0;
  }

  .btn-browse {
    display: inline-block;
    padding: 0.5rem 1.25rem;
    background: #eef2ff;
    color: #4f46e5;
    border: 1px solid #c7d2fe;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .btn-browse:hover {
    background: #e0e7ff;
  }

  .file-ready {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .file-name {
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    font-size: 0.95rem;
  }

  .file-size {
    color: #94a3b8;
    font-size: 0.8rem;
    margin: 0 0 0.75rem;
  }

  .file-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-primary {
    padding: 0.55rem 1.5rem;
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-primary:hover {
    background: #4338ca;
  }

  .btn-secondary {
    padding: 0.55rem 1.5rem;
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    cursor: pointer;
  }

  .btn-secondary:hover {
    background: #f8fafc;
  }

  .status-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status-text {
    color: #475569;
    font-size: 0.95rem;
    margin: 0;
  }

  .error-message {
    margin-top: 1rem;
    padding: 0.55rem 1rem;
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 10px;
    color: #ef4444;
    font-size: 0.85rem;
  }
</style>