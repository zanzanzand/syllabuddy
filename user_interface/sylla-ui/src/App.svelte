<script>
  import Calendar from './PCalendar.svelte';
  import FileUpload from './FileUpload.svelte';
  import PostUpload from './PostUpload.svelte';
  import Settings from './Settings.svelte';
  import GradeCalculator from './GradeCalculator.svelte';
  import Profile from './Profile.svelte';
  import { currPage, scannedSyllabus } from './store.js';
</script>

<div class="navbar">
  <div class="nav-left">
    <h2 class="text-lg font-semibold text-center sm:text-left cursor-pointer"
    on:click={() => {
      window.history.pushState({}, '', '/');
      currPage.set('calendar');
    }}>SyllaBuddy</h2>
  </div>

  <div class="nav-right">
    <button on:click={() => {
      window.history.pushState({}, '', '/upload');
      currPage.set('upload');
    }}>
      Upload
    </button>

    <button on:click={() => {
      window.history.pushState({}, '', '/calendar');
      currPage.set('calendar');
    }}>
      Calendar
    </button>

    <button on:click={() => {
      window.history.pushState({}, '', '/calculator');
      currPage.set('calculator');
    }}>
      Calculator
    </button>

    <button on:click={() => currPage.set('profile')}>Profile</button>
  </div>
</div>

<main>
  <div class="nav">
    <button on:click={() => $currPage = 'calendar'}>Calendar</button>
    <button on:click={() => $currPage = 'settings'}>Settings</button>
  </div>

  
  <div>
    {#if $currPage === 'upload'}
      <FileUpload />
    {:else if $currPage === 'postUpload'}
      <PostUpload />
    {:else if $currPage === 'calculator'}
     <GradeCalculator />
    {:else if $currPage === 'profile'}
      <Profile />
    {:else if $currPage === 'calendar'}
      <Calendar />
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
  </div>
  {:else if $currPage === 'settings'}
      <Settings />
    {/if}
  
  {/if}
  </div>

</main>

<style>
  .nav {
    display: flex;
    gap: 8px;
    margin-bottom: 1rem;
    justify-content: flex-end;
  }
  button{
    background-color: #e5e5e5;
    color: black;
    font-weight: 500;
    }

  .export-section{
    margin-top: 25px;
    text-align: center;
  }

  main {
    padding-top: 90px;
  }
</style>
