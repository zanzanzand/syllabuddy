<script>
  import { currPage } from './store.js';
  let { user } = $props();
  let open = $state(false);
</script>

<div class="profile-wrapper">
<button class="avatar-btn" onclick={() => open = !open}>
  <img src={user.profilePicture} alt={user.displayName} class="avatar" />
</button>

  {#if open}
    <div class="dropdown">
      <p class="username">{user.displayName}</p>
      <hr />
      <button onclick={() => { currPage.set('calendar'); open = false; }}>Calendar</button>
      <button onclick={() => { currPage.set('charts'); open = false; }}>Dashboard</button>
      <button onclick={() => { currPage.set('settings'); open = false; }}>Settings</button>
      <button onclick={() => window.location.href = 'http://localhost:3000/logout'}>Logout</button>
    </div>
  {/if}
</div>

<style>
  .profile-wrapper {
    position: relative;
    z-index: 1000;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    object-fit: cover;
    border: 2px solid #e5e5e5;
  }

  .avatar-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
}

  .avatar:hover {
    border-color: #aaa;
  }

  .dropdown {
    position: absolute;
    top: 48px;
    left: 0;
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    padding: 8px;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .username {
    font-weight: 600;
    padding: 4px 8px;
    margin: 0;
    font-size: 0.875rem;
    color: #333;
  }

  hr {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 4px 0;
  }

  button {
    background: none;
    border: none;
    text-align: left;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #333;
    width: 100%;
  }

  button:hover {
    background-color: #f5f5f5;
  }
</style>