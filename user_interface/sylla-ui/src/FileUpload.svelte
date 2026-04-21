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
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8fae72" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
          <div class="drop-icon success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3d6b1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p class="file-name">{file.name}</p>
          <p class="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          <div class="file-actions">
            <button class="btn-primary" onclick={handleUpload}>Upload & Scan</button>
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
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:wght@600&display=swap');

  .upload-container {
    max-width: 600px;
    margin: 1.5rem auto;
    padding: 0 1rem;
    font-family: 'DM Sans', sans-serif;
  }

  .upload-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .upload-header h2 {
    margin: 0 0 0.25rem;
    font-family: 'Fraunces', serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .upload-subtitle {
    color: #777;
    font-size: 0.9rem;
    margin: 0;
  }

  .drop-zone {
    border: 2px dashed #d8d4cd;
    border-radius: 14px;
    padding: 3rem 2rem;
    text-align: center;
    background: #fff;
    transition: border-color 0.2s, background 0.2s;
  }

  .drop-zone.drag-over {
    border-color: #8fae72;
    background: #f4f9ee;
  }

  .drop-zone.has-file {
    border-color: #8fae72;
    border-style: solid;
    background: #f9fcf6;
  }

  .drop-icon {
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: center;
  }

  .success-icon {
    background: #eef4e8;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    align-items: center;
    margin: 0 auto 0.75rem;
  }

  .drop-text {
    color: #555;
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
  }

  .drop-hint {
    color: #aaa9a4;
    font-size: 0.8rem;
    margin: 0.5rem 0 0;
  }

  .btn-browse {
    display: inline-block;
    padding: 0.5rem 1.25rem;
    background: #eef4e8;
    color: #2d5016;
    border: 1px solid #c5d9ad;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.15s, border-color 0.15s;
  }

  .btn-browse:hover {
    background: #e2eed8;
    border-color: #adc994;
  }

  .file-ready {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .file-name {
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    font-size: 0.95rem;
  }

  .file-size {
    color: #aaa9a4;
    font-size: 0.8rem;
    margin: 0 0 0.75rem;
  }

  .file-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-primary {
    padding: 0.55rem 1.5rem;
    background: #3d6b1a;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    transition: background 0.15s, transform 0.1s;
  }

  .btn-primary:hover {
    background: #2d5016;
  }

  .btn-secondary {
    padding: 0.55rem 1.5rem;
    background: #fff;
    border: 1px solid #e0ddd7;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: #555;
    transition: background 0.15s, border-color 0.15s;
  }

  .btn-secondary:hover {
    background: #f7f6f3;
    border-color: #ccc9c2;
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
    border-top-color: #3d6b1a;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status-text {
    color: #555;
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