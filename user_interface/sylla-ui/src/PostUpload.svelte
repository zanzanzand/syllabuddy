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

<style>
  .verification-container { 
    max-width: 800px; 
    margin: 1.5rem auto; 
    padding: 0 1rem; 
  }
  .verify-header { 
    margin-bottom: 1.5rem; 
    padding-bottom: 1rem; 
    border-bottom: 1px solid #e2e8f0; 
  }
  .verify-header h2 { 
    margin: 0 0 0.25rem; 
    font-size: 1.4rem; 
  }
  .sylla-meta { 
    color: #64748b; 
    font-size: 0.9rem; 
  }
  .sylla-meta span { 
    margin-left: 0.25rem; 
  }
  .events-section h3 { 
    margin-bottom: 1rem; 
  }
  .empty-state { 
    text-align: center; 
    padding: 2rem; 
    color: #94a3b8; 
    border: 2px dashed #e2e8f0; border-radius: 8px; 
  }
  .events-list { 
    display: flex; 
    flex-direction: column; 
    gap: 1rem; 
  }
  .event-card { 
    border: 1px solid #e2e8f0; 
    border-radius: 10px; 
    padding: 1rem 1.25rem; 
    background: #fff; 
  }
  .event-card-header { 
    display: flex; 
    align-items: center; 
    gap: 0.5rem; 
    margin-bottom: 0.75rem; 
  }
  .event-number { 
    font-weight: 700; 
    color: #64748b; 
    font-size: 0.85rem; 
  }
  .event-type-badge { 
    font-size: 0.7rem; 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
    padding: 0.15rem 0.5rem; 
    border-radius: 4px; 
    background: #f1f5f9; 
    color: #475569; 
  }
  .event-fields { 
    display: flex; 
    flex-direction: column; 
    gap: 0.5rem; 
  }
  .field-row { 
    display: flex; 
    gap: 0.75rem; 
  }
  .field-row .field { 
    flex: 1; 
  }
  .field-label { 
    display: block; 
    font-size: 0.75rem; 
    font-weight: 500; 
    color: #94a3b8; 
    text-transform: uppercase; 
    letter-spacing: 0.03em; 
    margin-bottom: 0.15rem; 
  }
  .field-value { 
    display: block; 
    font-size: 0.9rem; 
    color: #1e293b; 
  }
  .action-bar { 
    display: flex; 
    justify-content: flex-end; 
    gap: 0.75rem; 
    margin-top: 2rem; 
    padding-top: 1rem; 
    border-top: 1px solid #e2e8f0; 
  }
  .btn-primary { 
    padding: 0.55rem 1.5rem; 
    background: #4f46e5; 
    color: #fff; 
    border: none; 
    border-radius: 6px; 
    cursor: pointer; 
    font-weight: 500; 
  }
  .btn-primary:hover { 
    background: #4338ca; 
  }
  .btn-secondary { 
    padding: 0.55rem 1.5rem; 
    background: #fff; 
    border: 1px solid #cbd5e1; 
    border-radius: 6px; 
    cursor: pointer; 
  }
  .btn-secondary:hover { 
    background: #f8fafc; 
  }
</style>