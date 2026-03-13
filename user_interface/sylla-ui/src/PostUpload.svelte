<script>
  import { currPage, scannedSyllabus } from './store.js'
</script>

<div>
  {#if $scannedSyllabus}
    <h2>{$scannedSyllabus.title}</h2>
    <p><strong>Code:</strong> {$scannedSyllabus.code}</p>
    <p><strong>Instructor:</strong> {$scannedSyllabus.instructor}</p>
    <p><strong>Semester:</strong> {$scannedSyllabus.semester}</p>

    <h3>Events ({$scannedSyllabus.events.length})</h3>

    {#each $scannedSyllabus.events as event}
      <div>
        <p><strong>{event.title}</strong></p>
        {#if event.date}
            <p>{new Date(event.date).toLocaleDateString()}</p>
        {:else}
            <p>—</p>
        {/if}
        <p>{event.type}</p>
        {#if event.description}
            <p>{event.description}</p>
        {:else}
            <p>—</p>
        {/if}
        </div>
    {/each}

    <button onclick={() => $currPage = 'calendar'}>View Calendar</button>
    <button onclick={() => $currPage = 'upload'}>Upload Another</button>
  {/if}
</div>