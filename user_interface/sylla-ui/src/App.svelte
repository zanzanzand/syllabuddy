<script>
  import Calendar from './PCalendar.svelte';
  import FileUpload from './FileUpload.svelte';
  import PostUpload from './PostUpload.svelte';
  import { currPage, scannedSyllabus } from './store.js';
</script>

<main>
  <div>
    {#if $currPage === 'upload'}
      <FileUpload />
    {:else if $currPage === 'postUpload'}
      <PostUpload />
    {:else if $currPage === 'calendar'}
      <Calendar />
    {/if}
  </div>

  <div class="export-section">
    <button on:click={() => window.location.href = 'http://localhost:3000/export'}>
      Export Calendar (.ics)
    </button>

    <div>
      <h2>How to Import to Google Calendar</h2>
      <ol>
        <li>Click the Export Calendar button.</li>
        <li>Download the .ics file.</li>
        <li>Open Google Calendar.</li>
        <li>Go to Settings → Import.</li>
        <li>Select the downloaded .ics file.</li>
      </ol>
    </div>
  </div>
  
</main>

<style>
  button{
    background-color: #e5e5e5;
    color: black;
    font-weight: 500;
    }

  .export-section{
    margin-top: 25px;
    text-align: center;
  }
</style>
