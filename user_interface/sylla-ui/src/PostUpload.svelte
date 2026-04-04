<script>
  import { currPage, scannedSyllabus } from './store.js'
 
  function formatDate(val) {
    if (!val) return '—'
    const d = new Date(val)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
</script>
 
{#if $scannedSyllabus}
<div class="verification-container">
 
  <header class="verify-header">
    <div>
      <h2>{$scannedSyllabus.title || 'Untitled Course'}</h2>
      <p class="sylla-meta">
        <span>{$scannedSyllabus.code}</span>
        <span>· {$scannedSyllabus.instructor}</span>
        {#if $scannedSyllabus.semester}<span>· {$scannedSyllabus.semester}</span>{/if}
      </p>
    </div>
  </header>
 
  <section class="events-section">
    <h3>Events ({$scannedSyllabus.events.length})</h3>
 
    {#if $scannedSyllabus.events.length === 0}
      <p class="empty-state">No events detected from this syllabus.</p>
    {/if}
 
    <div class="events-list">
      {#each $scannedSyllabus.events as event, i}
        <div class="event-card">
          <div class="event-card-header">
            <span class="event-number">#{i + 1}</span>
            <span class="event-type-badge">{event.type}</span>
          </div>
 
          <div class="event-fields">
            <div class="field-row">
              <div class="field">
                <span class="field-label">Title</span>
                <span class="field-value">{event.title}</span>
              </div>
            </div>
 
            <div class="field-row">
              <div class="field">
                <span class="field-label">Date</span>
                <span class="field-value">{formatDate(event.date)}</span>
              </div>
            </div>
 
            {#if event.description}
              <div class="field-row">
                <div class="field">
                  <span class="field-label">Description</span>
                  <span class="field-value">{event.description}</span>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </section>
 
  <footer class="action-bar">
    <button class="btn-secondary" onclick={() => $currPage = 'upload'}>Upload Another</button>
    <button class="btn-primary" onclick={() => $currPage = 'calendar'}>View Calendar</button>
  </footer>
</div>
{/if}