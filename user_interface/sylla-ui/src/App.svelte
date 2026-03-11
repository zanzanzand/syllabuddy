<script>
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Counter from './lib/Counter.svelte'
  import Calendar from './PCalendar.svelte';
</script>

<main>
  <div>
    <Calendar />
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
