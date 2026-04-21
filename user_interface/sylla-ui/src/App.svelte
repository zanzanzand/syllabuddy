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

{#if !isLoggedIn}
  <div class="landing">
    <div class="landing-card">
      <img src="/logo.png" alt="SyllaBuddy" class="landing-logo" />
      <h1>SyllaBuddy</h1>
      <p>Your academic calendar, organized.</p>
      <a href="http://localhost:3000/auth/google" class="login-btn">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </a>
    </div>
  </div>
{:else}
  <div class="app-shell">
    <nav class="topnav">
      <div class="nav-brand" onclick={() => currPage.set('calendar')} role="button" tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && currPage.set('calendar')}>
          <img src="/logo.png" alt="SyllaBuddy" class="brand-logo" />
          <span class="brand-name">SyllaBuddy</span>
      </div>
      <div class="nav-links">
        <button class:active={$currPage === 'calendar'} onclick={() => currPage.set('calendar')}>Calendar</button>
        <button class:active={$currPage === 'upload'} onclick={() => currPage.set('upload')}>Upload</button>
        <button class:active={$currPage === 'calculator'} onclick={() => currPage.set('calculator')}>Calculator</button>
        <button class:active={$currPage === 'charts'} onclick={() => currPage.set('charts')}>Dashboard</button>
      </div>
      <div class="nav-profile">
        <ProfileMenu {user} />
      </div>
    </nav>

    <main class="content">
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
      {/if}
    </main>
  </div>
{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:wght@600&display=swap');

  :global(body) {
    margin: 0;
    background: #f7f6f3;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
  }

  /* Landing */
  .landing {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7f6f3;
  }

  .landing-card {
    text-align: center;
    padding: 3rem 4rem;
    background: #fff;
    border-radius: 20px;
    border: 1px solid #e8e5df;
    box-shadow: 0 8px 40px rgba(0,0,0,0.07);
  }

  .landing-logo {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    object-fit: cover;
    margin: 0 auto 1.25rem;
    display: block;
}

  .landing-card h1 {
    font-family: 'Fraunces', serif;
    font-size: 2.2rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  .landing-card p {
    color: #777;
    font-size: 1rem;
    margin: 0 0 2rem;
  }

  .login-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 1.5px solid #e0ddd7;
    border-radius: 10px;
    padding: 12px 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    color: #1a1a1a;
    text-decoration: none;
    transition: all 0.15s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .login-btn:hover {
    border-color: #bbb;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }

  /* App shell */
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f7f6f3;
  }

  /* Navbar */
  .topnav {
    display: flex;
    align-items: center;
    padding: 0 2rem;
    height: 60px;
    background: #fff;
    border-bottom: 1px solid #e8e5df;
    position: sticky;
    top: 0;
    z-index: 100;
    gap: 2rem;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .brand-logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    object-fit: cover;
  }
  .brand-name {
    font-family: 'Fraunces', serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
  }

  .nav-links button {
    background: none;
    border: none;
    padding: 6px 14px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.15s;
  }

  .nav-links button:hover {
    background: #f0ede8;
    color: #1a1a1a;
  }

  .nav-links button.active {
    background: #eef4e8;
    color: #2d5016;
    font-weight: 600;
  }

  .nav-profile {
    flex-shrink: 0;
    margin-left: auto;
  }

  /* Content */
  .content {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }
</style>