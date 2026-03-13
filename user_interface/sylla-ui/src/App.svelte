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
</main>

<style>
</style>
