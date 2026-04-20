<script>
  import { currPage, scannedSyllabus } from './store.js'
 
  const EVENT_TYPES = ['exam', 'assignment', 'project', 'consultation', 'lecture', 'other']

  let events = $state([])
  let saved = $state(false)
  let showConfirm = $state(false)
  let saveError = $state('')
  let cancelError = $state('')

  $effect(()=> {
    const sylla = $scannedSyllabus;
    if (sylla && sylla.events){
      events = sylla.events.map((e, i)=> {
        let id;
        if (crypto.randomUUID) {
          id = crypto.randomUUID()
        }
        else {
          id = 'evt-' + i + '-' + Date.now()
        }

        let title = ''
        if (e.title) {title = e.title}

        let startDate = toDateInputValue(e.startDate)
        let endDate = toDateInputValue(e.endDate)

        let type = 'other'
        if (e.type) {type = e.type}

        let description = ''
        if (e.description) {description = e.description}

        return {
          eventID: id,
          title: title,
          startDate: startDate,
          endDate: endDate,
          type: type,
          description: description,
          isNew: false,
          editing: false
        }
      })
    }
  })

  function toDateInputValue(val) {
    if (!val) return ''

    let str
    if (typeof val == 'string'){
      str = val
    }
    else{
      str = val.toString()
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str

    const match = str.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]

    return str
  }

  function formatDate(val) {
    if (!val) return '—'
    const d = new Date(val)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  function capitalize(val) {
    if (!val) return '-'
    return val.charAt(0).toUpperCase() + val.slice(1)
  }

  function toggleEdit(eventID) {
    if (saved) return
    events = events.map(function(e) {
      if (e.eventID==eventID){
        return {
          ...e, 
          editing: !e.editing
        }
      }
      return e
    })
  }

  function updateEvent(eventID, field, value) {
    events = events.map(function(e) {
      if (e.eventID==eventID){
        return{
          ...e,
          [field]: value
        }
      }
      return e
    })
  }

  function addEvent() {
    if (saved) return
    let id;
    if(crypto.randomUUID){
      id = crypto.randomUUID()
    }
    else{
      id = 'new-' + Date.now()
    }

    events = [...events, {
      eventID: id,
      title: '',
      startDate: '',
      endDate: '',
      type: '',
      description: '',
      isNew: true,
      editing: true

    }]
  }

  function removeEvent(eventID){
    if (saved) return
    if (!confirm('Remove this event?')) return 
    events = events.filter(function(e) {
      return e.eventID != eventID
    })
  }

  function attemptSave() {
    saveError = ''
    for (let i = 0; i < events.length; i++) {
        const e = events[i]
        if (!e.title || !e.title.trim()) {
            saveError = `Event #${i + 1} is missing a title.`
            return
        }
        if (!e.type) {
            saveError = `Event #${i + 1} is missing a type.`
            return
        }
    }
    showConfirm = true
  }

  async function confirmSave() {
    showConfirm = false
    saveError = ''

    try {
      const payload = {
        SyllaID: $scannedSyllabus._id,
        title: $scannedSyllabus.title,
        code: $scannedSyllabus.code,
        instructor: $scannedSyllabus.instructor,
        semester: $scannedSyllabus.semester,
        events: events.map(function(e){
          return {
            title: e.title,
            startDate: e.startDate,
            endDate: e.endDate || null,
            type: e.type,
            description: e.description,
            userId: $scannedSyllabus.userId
          }
        })
      }

      const res = await fetch('http://localhost:3000/syllabus/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      if (!res.ok){
        const body = await res.json()
        throw new Error(body.error)
      }

      const result = await res.json()
      saved = true
      $scannedSyllabus = result
      $currPage = 'calendar'

    } catch(error) {
      saveError = error.message
    }
  }

  function cancelSave() {
    showConfirm = false
  }

  async function cancelUpload() {
    try {
      const res = await fetch('http://localhost:3000/syllabus/delete/' + $scannedSyllabus._id,  {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok){
        const body = await res.json()
        throw new Error(body.error)
      } 

      $scannedSyllabus = null
      $currPage = 'calendar'
    } catch (error) {
        cancelError = error.message
    }
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
    <div class="section-header">
      <h3>Events ({events.length})</h3>
      <button class="btn-add" onclick={addEvent}>+ Add Event</button>
    </div>
 
    {#if events.length === 0}
      <p class="empty-state">No events detected from this syllabus.</p>
    {/if}
 
    <div class="events-list">
      {#each events as event, i (event.eventID)}
        <div class="event-card" class:is-new={event.isNew}>
          <div class="event-card-header">
            <span class="event-number">#{i + 1}</span>
            {#if event.isNew}
              <span class="event-type-badge event-new-badge">New</span>
            {/if}
            <div class="event-header-actions">
              <button class="btn-edit" onclick={() => toggleEdit(event.eventID)}>
                {#if event.editing}
                  Done
                {:else}
                  Edit
                {/if}
              </button>
              <button class="btn-remove" onclick={() => removeEvent(event.eventID)}>✕</button>
            </div>
          </div>

          {#if event.editing}
          <div class="event-fields">
            <div class="field-row">
              <div class="field field-grow">
                <label for="title-{event.eventID}">Title</label>
                <input id="title-{event.eventID}" type="text" value={event.title}
                  oninput={(e) => updateEvent(event.eventID, 'title', e.target.value)}
                  placeholder="e.g. Midterm Exam" />
              </div>
              <div class="field">
                <label for="type-{event.eventID}">Type</label>
                <select id="type-{event.eventID}" value={event.type}
                  onchange={(e) => updateEvent(event.eventID, 'type', e.target.value)}>
                  {#each EVENT_TYPES as t}
                    <option value={t}>{capitalize(t)}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class="field">
              <label for="startdate-{event.eventID}">Start Date</label>
              <input id="startdate-{event.eventID}" type="date" value={event.startDate}
                oninput={(e) => updateEvent(event.eventID, 'startDate', e.target.value)} />
            </div>
            <div class="field">
              <label for="enddate-{event.eventID}">End Date</label>
              <input id="enddate-{event.eventID}" type="date" value={event.endDate}
                oninput={(e) => updateEvent(event.eventID, 'endDate', e.target.value)} />
            </div>
            <div class="field">
              <label for="desc-{event.eventID}">Description</label>
              <textarea id="desc-{event.eventID}" value={event.description}
                oninput={(e) => updateEvent(event.eventID, 'description', e.target.value)}
                rows="2" placeholder="Event description…"></textarea>
            </div>
          </div>
          {:else}
            <div class="event-fields">
              <div class="field-row">
                <div class="field">
                  <span class="field-label">Title</span>
                  {#if event.title}
                    <span class="field-value">{event.title}</span>
                  {:else}
                    <span class="field-value">—</span>
                  {/if}
                </div>
                <div class="field">
                  <span class="field-label">Type</span>
                  <span class="field-value">{capitalize(event.type)}</span>
                </div>
              </div>
              <div class="field">
                <span class="field-label">Start Date</span>
                <span class="field-value">{formatDate(event.startDate)}</span>
              </div>
              <div class="field">
                <span class="field-label">End Date</span>
                <span class="field-value">{formatDate(event.endDate)}</span>
              </div>

              {#if event.description}
                <div class="field">
                  <span class="field-label">Description</span>
                  <span class="field-value">{event.description}</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
  
  {#if showConfirm}
      <div class="confirm-container">
        <div class="confirm-box">
          <h3>Confirm Save</h3>
          <p>Save {events.length} event{#if events.length !== 1}s{/if}?</p>
          <p class="confirm-hint">You won't be able to edit after saving.</p>
          <div class="confirm-actions">
            <button class="btn-secondary" onclick={cancelSave}>Cancel</button>
            <button class="btn-primary" onclick={confirmSave}>Confirm</button>
          </div>
        </div>
      </div>
  {/if}
  <footer class="action-bar">
    {#if saveError}
      <p class="error-message">{saveError}</p>
    {/if}

    {#if cancelError}
      <p class="error-message">{cancelError}</p>
    {/if}

    {#if !saved}
      <button class="btn-primary" onclick={attemptSave} disabled={events.length==0}>Save Events</button>
sul      <button class="btn-secondary" onclick={cancelUpload}>Cancel Upload</button>
    {/if}
    <button class="btn-primary" onclick={() => {
      $currPage = 'calculator';
    }}>
      Go to Calculator
    </button>
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
  .event-card.is-new { 
    border-left: 4px solid #3b82f6; 
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
  .event-header-actions { 
    margin-left: auto; 
    display: flex; 
    gap: 0.4rem; 
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
  .event-new-badge { 
    background: #dbeafe; 
    color: #1e40af; 
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
  .field-grow { 
    flex: 2 !important; 
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
  .field label { 
    display: block; 
    font-size: 0.8rem; 
    font-weight: 500; 
    color: #475569; 
    margin-bottom: 0.2rem; 
  }
  .field input, .field textarea, .field select { 
    width: 100%; 
    padding: 0.45rem 0.6rem; 
    border: 1px solid #cbd5e1; 
    border-radius: 6px; 
    font-size: 0.9rem; 
    box-sizing: border-box; 
    font-family: inherit; 
  }
  .field input:focus, .field textarea:focus, .field select:focus { 
    outline: none; 
    border-color: #4f46e5; 
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15); 
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
  .btn-edit { 
    background: #f1f5f9; 
    border: 1px solid #cbd5e1; 
    border-radius: 5px; 
    padding: 0.25rem 0.65rem; 
    cursor: pointer; 
    font-size: 0.8rem; 
    color: #475569; 
  }
  .btn-edit:hover { 
    background: #e2e8f0; 
  }
  .btn-add { 
    padding: 0.4rem 1rem; 
    background: #eef2ff; 
    color: #4f46e5; 
    border: 1px solid #c7d2fe; 
    border-radius: 6px; 
    cursor: pointer; 
    font-weight: 500; 
    font-size: 0.85rem; 
  }
  .btn-add:hover { 
    background: #e0e7ff; 
  }
  .btn-remove { 
    background: none; 
    border: none; 
    color: #ef4444; 
    cursor: pointer; 
    font-size: 1.1rem; 
    padding: 0.25rem; 
    line-height: 1; 
  }
  .btn-remove:hover { 
    color: #dc2626; 
  }
  .error-message {
    padding: 0.55rem 1rem;
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 10px;
    color: #ef4444;
    font-size: 0.85rem;
    flex: 1;
  }
  .confirm-container {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .confirm-box {
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem 2rem;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }
  .confirm-box h3 { 
    margin: 0 0 0.75rem; 
  }
  .confirm-box p { 
    margin: 0.5rem 0; 
  }
  .confirm-hint { 
    font-size: 0.8rem; 
    color: #94a3b8; 
  }
  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }
</style>