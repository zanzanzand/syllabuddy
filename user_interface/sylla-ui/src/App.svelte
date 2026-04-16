<script>
  import { onMount } from 'svelte';
  import Calendar from './PCalendar.svelte';
  import FileUpload from './FileUpload.svelte';
  import PostUpload from './PostUpload.svelte';
  import Settings from './Settings.svelte';
  import GradeCalculator from './GradeCalculator.svelte';
  import Profile from './Profile.svelte';
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

<div class="navbar">
  <div class="nav-left">
  <button onclick={() => {    
        window.history.pushState({}, '', '/');
        currPage.set('calendar');
      }}>
    <h2 class="text-lg font-semibold text-center sm:text-left cursor-pointer"
      >SyllaBuddy</h2>
    </button>
  </div>
  <div class="nav-right">
    <button onclick={() => {
      window.history.pushState({}, '', '/upload');
      currPage.set('upload');
    }}>Upload</button>
    <button onclick={() => {
      window.history.pushState({}, '', '/calendar');
      currPage.set('calendar');
    }}>Calendar</button>
    <button onclick={() => {
      window.history.pushState({}, '', '/calculator');
      currPage.set('calculator');
    }}>Calculator</button>
    <button onclick={() => currPage.set('profile')}>Profile</button>
  </div>
</div>

<main>
  <div class="nav">
    <button onclick={() => $currPage = 'settings'}>Settings</button>
  </div>

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
      {:else if $currPage === 'calculator'}
        <GradeCalculator />
      {:else if $currPage === 'profile'}
        <Profile />
      {:else if $currPage === 'settings'}
        <Settings />
      {:else if $currPage === 'calendar'}
        <Calendar />
        
        <div class="export-section">
          <div class="export-card">
            <button class="export-btn"
              onclick={() => window.location.href = 'http://localhost:3000/export'}>
              ⬇ Export .ics
            </button>
            <div class="instructions">
              <h3>How to Import</h3>
                <ol>
                  <li>Download the .ics file</li>
                  <li>Open Google Calendar</li>
                  <li>Go to <b>Settings → Import</b></li>
                  <li>Select your downloaded file</li>
                </ol>
            </div>
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
  .nav {
    display: flex;
    gap: 8px;
    margin-bottom: 1rem;
    justify-content: flex-end;
  }
  button {
    background-color: #e5e5e5;
    color: black;
    font-weight: 500;
  }

.export-section {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.export-card {
  background: white;
  border-radius: 16px;
  padding: 24px 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.export-btn {
  margin: 15px 0;
  padding: 10px 16px;
  border-radius: 8px;
  background: #6d28d9;
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.export-btn:hover {
  background: #5b21b6;
  transform: translateY(-1px);
}

.instructions {
  color: #666;
  font-size: 0.85rem;
  text-align: left;
}

.landing {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 100px;
    gap: 20px;
}
  main {
    padding-top: 90px;
}
</style>