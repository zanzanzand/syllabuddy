<script>
  import { currPage, scannedSyllabus, categoryColors } from './store.js'
 
  const EVENT_TYPES = ['exam', 'assignment', 'quiz', 'project', 'consultation', 'lecture', 'recitation', 'break', 'other']

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
        if (!e.startDate){
          saveError = `Event #${i + 1} is missing a start date.`
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
        throw new Error(body.error || 'Failed to save. Please try again.')
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
        throw new Error('Failed to cancel. Please try again.')
      } 

      $scannedSyllabus = null
      $currPage = 'calendar'
    } catch (error) {
        cancelError = error.message
    }
  }

  function typeBadgeStyle(type) {
    const color = $categoryColors[type] || '#e0ddd7'
    return `background:${color};border:1px solid ${color};`
  }

</script>
 
{#if $scannedSyllabus}
<div class="verification-container">
 
  <header class="verify-header">
    <div>
      <h2>{$scannedSyllabus.title || 'Untitled Course'}</h2>
      <p class="sylla-meta">
        <span class="meta-chip">{$scannedSyllabus.code}</span>
        <span class="meta-chip">{$scannedSyllabus.instructor}</span>
        {#if $scannedSyllabus.semester}<span class="meta-chip"> {$scannedSyllabus.semester}</span>{/if}
      </p>
    </div>
  </header>
 
  <section class="events-section">
    <div class="section-header">
      <h3>Events <span class="event-count">{events.length}</span></h3>
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
            {#if !event.editing && event.type}
              <span class="event-type-badge" style={typeBadgeStyle(event.type)}>{capitalize(event.type)}</span>
            {/if}
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
            <div class="field-row">
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
            </div>
            <div class="field">
              <label for="desc-{event.eventID}">Description</label>
              <textarea id="desc-{event.eventID}" value={event.description}
                oninput={(e) => updateEvent(event.eventID, 'description', e.target.value)}
                rows="2" placeholder="Event description…"></textarea>
            </div>
          </div>
          {:else}
            <div class="event-fields viewing">
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
                  <span class="field-label">Start Date</span>
                  <span class="field-value">{formatDate(event.startDate)}</span>
                </div>
                <div class="field">
                  <span class="field-label">End Date</span>
                  <span class="field-value">{formatDate(event.endDate)}</span>
                </div>
              </div>
              {#if event.description}
                <div class="field">
                  <span class="field-label">Description</span>
                  <span class="field-value desc">{event.description}</span>
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
          <p class="confirm-hint">You can still make edits after saving!</p>
          <div class="confirm-actions">
            <button class="btn-secondary" onclick={cancelSave}>Cancel</button>
            <button class="btn-primary" onclick={confirmSave}>Save Events</button>
          </div>
        </div>
      </div>
  {/if}
  <footer class="action-bar">
    <div class="action-errors">
      {#if saveError}
        <p class="error-message">{saveError}</p>
      {/if}
      {#if cancelError}
        <p class="error-message">{cancelError}</p>
      {/if}
    </div>
    <div class="action-buttons">
      {#if !saved}
        <button class="btn-primary" onclick={attemptSave} disabled={events.length==0}>Save Events</button>
        <button class="btn-secondary" onclick={cancelUpload}>Cancel Upload</button>
      {/if}
    </div>
  </footer>
</div>
{/if}

<style>
  .verification-container { 
    max-width: 800px; 
    margin: 1.5rem auto; 
    padding: 0 1rem; 
    font-family: 'DM Sans', sans-serif;
  }
  .verify-header { 
    margin-bottom: 1.5rem; 
    padding-bottom: 1rem; 
    border-bottom: 1px solid #e8e5df; 
    text-align: center;
  }
  .verify-header h2 { 
    margin: 0 0 0.25rem; 
    font-size: 1.4rem; 
    font-family: 'Fraunces', serif;
    font-weight: 600;
    color: #1a1a1a;
  }
  .sylla-meta { 
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0;
    justify-content: center ;
  }
  .meta-chip {
    display: inline-block;
    padding: 0.2rem 0.65rem;
    background: #efefef;
    border: 1px solid #c0bfbd;
    border-radius: 20px;
    font-size: 0.82rem;
    color: #555;
  }
  .events-section h3 { 
    margin-bottom: 1rem; 
    font-family: 'Fraunces', serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .event-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #eef4e8;
    color: #2d5016;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.1rem 0.55rem;
    font-family: 'DM Sans', sans-serif;
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .empty-state { 
    text-align: center; 
    padding: 2rem; 
    color: #aaa9a4; 
    border: 2px dashed #e8e5df; 
    border-radius: 8px; 
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .events-list { 
    display: flex; 
    flex-direction: column; 
    gap: 1rem; 
  }
  .event-card { 
    border: 1px solid #e8e5df; 
    border-radius: 10px; 
    padding: 1rem 1.25rem; 
    background: #fff; 
  }
  .event-card:hover {
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  .event-card.is-new { 
    border-left: 4px solid #8fae72; 
  }
  .event-card-header { 
    display: flex; 
    align-items: center; 
    gap: 0.5rem; 
    margin-bottom: 0.75rem; 
  }
  .event-number { 
    font-weight: 700; 
    color: #aaa9a4;
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
  }
  .event-new-badge { 
    background: #eaf2fb;
    color: #1a4a7a;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.15rem 0.55rem;
    border-radius: 20px; 
  }
  .event-fields { 
    display: flex; 
    flex-direction: column; 
    gap: 0.5rem; 
  }
  .viewing {
    gap: 0.4rem;
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
    color: #aaa9a4; 
    text-transform: uppercase; 
    letter-spacing: 0.03em; 
    margin-bottom: 0.15rem; 
  }
  .desc {
    color: #666;
    font-size: 0.85rem;
  }
  .field label { 
    display: block; 
    font-size: 0.8rem; 
    font-weight: 500; 
    color: #555; 
    margin-bottom: 0.2rem; 
  }
  .field input, .field textarea, .field select { 
    width: 100%; 
    padding: 0.45rem 0.6rem; 
    border: 1px solid #e0ddd7;
    border-radius: 6px; 
    font-size: 0.9rem; 
    box-sizing: border-box; 
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
    background: #fff;
  }
  .field input:focus, .field textarea:focus, .field select:focus { 
    outline: none; 
    border-color: #8fae72; 
    box-shadow: 0 0 0 2px rgba(143,174,114,0.15);
  }
  .field-value { 
    display: block; 
    font-size: 0.9rem; 
    color: #1a1a1a; 
  }
  .action-bar { 
    display: flex; 
    justify-content: flex-end; 
    gap: 0.75rem; 
    margin-top: 2rem; 
    padding-top: 1rem; 
    border-top: 1px solid #e8e5df; 
  }
  .action-errors {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
  .btn-primary { 
    padding: 0.55rem 1.5rem; 
    background: #3d6b1a;
    color: #fff; 
    border: none; 
    border-radius: 6px; 
    cursor: pointer; 
    font-weight: 500; 
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    transition: background 0.15s, transform 0.1s;
  }
  .btn-primary:hover { 
    background: #2d5016;
  }
  .btn-secondary { 
    padding: 0.55rem 1.5rem; 
    background: #fff; 
    border: 1px solid #e0ddd7; 
    border-radius: 6px; 
    cursor: pointer; 
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: #555;
    transition: background 0.15s, border-color 0.15s;
  }
  .btn-secondary:hover { 
    background: #f7f6f3;
    border-color: #ccc9c2;
  }
  .btn-edit { 
    background: #f7f6f3; 
    border: 1px solid #e8e5df; 
    border-radius: 5px; 
    padding: 0.25rem 0.65rem; 
    cursor: pointer; 
    font-size: 0.8rem; 
    color: #555;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.15s;
  }
  .btn-edit:hover { 
    background: #eef4e8;
    border-color: #c5d9ad;
    color: #2d5016; 
  }
  .btn-add { 
    padding: 0.4rem 1rem; 
    background: #eef4e8;
    color: #2d5016;
    border: 1px solid #c5d9ad; 
    border-radius: 6px; 
    cursor: pointer; 
    font-weight: 500; 
    font-size: 0.85rem; 
    font-family: 'DM Sans', sans-serif;
    transition: background 0.15s, border-color 0.15s;
  }
  .btn-add:hover { 
    background: #e2eed8;
    border-color: #adc994;
  }
  .btn-remove { 
    background: none; 
    border: none; 
    color: #aaa9a4;
    cursor: pointer; 
    font-size: 1.1rem; 
    padding: 0.25rem; 
    line-height: 1; 
  }
  .btn-remove:hover { 
    background: #fef2f2;
    border-color: #f5c2c2;
    color: #c0392b;
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
    background: rgba(26, 26, 26, 0.35);
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
    border: 1px solid #e8e5df;
  }
  .confirm-box h3 { 
    margin: 0 0 0.75rem; 
    font-family: 'Fraunces', serif;
    font-size: 1.15rem;
    color: #1a1a1a;
  }
  .confirm-box p { 
    margin: 0.5rem 0; 
    color: #333;
    font-size: 0.95rem;
  }
  .confirm-hint { 
    font-size: 0.8rem; 
    color: #aaa9a4; 
  }
  .confirm-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }
</style>