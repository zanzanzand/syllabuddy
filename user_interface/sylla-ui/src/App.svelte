<script>
  import Calendar from './PCalendar.svelte';
  import FileUpload from './FileUpload.svelte';

  let page = $state('upload');
  let syllabusData = $state(null);
  
  function handleUploaded(result){
    syllabusData = result;
    page = 'calendar';
  }
</script>

<main>
  <div>
    {#if page === 'upload'}
    <FileUpload onUploaded={handleUploaded} />
  {:else if page === 'calendar'}
    <Calendar />
  {/if}
  </div>
</main>

<style>
</style>
