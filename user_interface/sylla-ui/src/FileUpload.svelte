<script>
  let { onUploaded } = $props();

  let file = $state(null);
  let error = $state("");
  let status = $state("");
  let dragOver = $state(false);

  const ALLOWED_TYPES = ["application/pdf", "image/png"];
  const MAX_SIZE_MB = 10;

  function validateFile(f) {
    if (!ALLOWED_TYPES.includes(f.type)) return "Only PDF and PNG files are supported.";
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
      onUploaded(result);

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

<div
  ondrop={handleDrop}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  role="region"
  aria-label="Upload zone"
>
  {#if status === ""}
    {#if !file}
      <p>Drag and drop your syllabus here, or</p>
      <label>
        Browse Files
        <input type="file" accept=".pdf,.png" onchange={handleFileSelect} hidden />
      </label>
      <p>PDF or PNG · Max 10MB</p>
    {:else}
      <p>Ready: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
      <button onclick={handleUpload}>Upload</button>
      <button onclick={handleReset}>Cancel</button>
    {/if}
  {/if}

  {#if status === "uploading"}
    <p>Uploading...</p>
  {:else if status === "preprocessing"}
    <p>Preprocessing file...</p>
  {:else if status === "scanning"}
    <p>Scanning and parsing syllabus...</p>
  {:else if status === "done"}
    <p>Done! Redirecting...</p>
  {/if}

  {#if error}
    <p role="alert">{error}</p>
  {/if}
</div>