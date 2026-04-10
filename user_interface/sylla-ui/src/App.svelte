<script>
  import { onMount } from 'svelte';
  import Calendar from './PCalendar.svelte';
  import FileUpload from './FileUpload.svelte';
  import PostUpload from './PostUpload.svelte';
  import { currPage, scannedSyllabus } from './store.js';
  import ProfileMenu from './ProfileMenu.svelte';
  import Charts from './Charts.svelte';

  let user = $state(null);
  let isLoggedIn = $state(false);

  onMount(async () => {
    const res = await fetch('http://localhost:3000/profile', {
      credentials: 'include'
    });
    if (res.ok) {
      user = await res.json();
      isLoggedIn = true;
      currPage.set('calendar');
    } else {
      isLoggedIn = false;
    }
  });
</script>

<main>
  <div>
    {#if !isLoggedIn}
      <div class="landing">
        <h1>Welcome to Syllabuddy!</h1>
        <a href="http://localhost:3000/auth/google">
          <button>Login with Google</button>
        </a>
      </div>
    {:else}
      <div class="navbar">
        <ProfileMenu {user} />
      </div>
      <div class="content">
      {#if $currPage === 'upload'}
        <FileUpload />
      {:else if $currPage === 'charts'}
        <Charts />
      {:else if $currPage === 'postUpload'}
        <PostUpload />
      {:else if $currPage === 'calendar'}
        <Calendar />
        <div class="export-section">
          <button onclick={() => window.location.href = 'http://localhost:3000/export'}>
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
      {/if}
    </div>
    {/if}
  </div>
</main>

<style>

  .navbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 16px;
}
  .content {
    padding: 0 16px;
  }
  button {
    background-color: #e5e5e5;
    color: black;
    font-weight: 500;
  }

  .export-section {
    margin-top: 25px;
    text-align: center;
  }

  .landing {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 100px;
    gap: 20px;
  }
</style>