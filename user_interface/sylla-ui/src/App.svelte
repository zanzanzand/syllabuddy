<script>
  import Calendar from './PCalendar.svelte';
  import FileUpload from './FileUpload.svelte';
  import { currPage } from './store.js'

  let syllabusData = $state(null);

</script>

<main>
  <div>
    {#if $currPage === 'upload'}
      <FileUpload />
    {:else if $currPage === 'calendar'}
      <Calendar />
    {/if}
  </div>
</main>

<style>
</style>
