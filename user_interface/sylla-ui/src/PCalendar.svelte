<script>
    import {Calendar, DayGrid, Interaction, List, TimeGrid} from '@event-calendar/core';
    import {currPage, calendarTheme, calendarBackground, backgroundOpacity, categoryColors} from './store.js';
    import Modal from './AddEventModal.svelte';
    import EditEventModal from './EditEventModal.svelte';
    import { onMount } from 'svelte';
    let showModal = $state(false);
    
    let status = $state('');
    let submittedData = $state(null);
    let ec = $state()
    let events_ = $state([])
    
    let theme = $state('light');
    let bgImage = $state('');
    let bgOpacity = $state(1);
    let catColors = $state({});

    let selectedEvent = $state(null);
    let showEditModal = $state(false);

    calendarTheme.subscribe(v => theme = v);
    calendarBackground.subscribe(v => bgImage = v);
    backgroundOpacity.subscribe(v => bgOpacity = v);
    categoryColors.subscribe(v => catColors = v);

    // get color for event based on category
    function getEventColor(category) {
        if (!category) return catColors['other'] ?? '#DDA0DD';
        const key = category.toLowerCase();
        return catColors[key] ?? catColors['other'] ?? '#DDA0DD';
    }

    let options = {
        view: 'dayGridMonth',
        events:[],
        headerToolbar: {
            start: 'prev, next today',
            center: 'title',
            end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        buttonText: {
            dayGridMonth: 'month',
            timeGridWeek: 'week',
            timeGridDay: 'day',
            listWeek: 'list'
        },
        selectable: true,
        eventClick: (info) => {
            selectedEvent = info.event;
            showEditModal = true;
        }
    };


    async function handleSubmit (e) {
        // Insert a event into the collection MongoDB
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        console.log("Form Submitted:", data);

        submittedData = data;
        const newEvent = {
            title: data.title,
            start: new Date(`${data.startdate}T00:00:00`),
            end: new Date(`${data.enddate ? data.enddate : data.startdate}T00:00:00`),
            startDate: new Date(`${data.startdate}T00:00:00`),
            endDate: new Date(`${data.enddate ? data.enddate : data.startdate}T00:00:00`),
            type: data.type,
            description: data.description,
            backgroundColor: getEventColor(data.type), // apply color on add
            editable: true
        }
        status = 'Success!';
        e.currentTarget.reset();
        events_ = [...events_, newEvent]
        // ec.addEvent(newEvent)

        const res = await fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',      // needed for session cookies
        body: JSON.stringify(newEvent)
        });

        if (res.ok) {
          status = 'Success!';
          showModal = false;
          await reloadCalendarEvents();
        } else {
          status = 'Error saving event.';
        }

    };

    async function handleEdit(e) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const updatedEvent = {
            title: data.title,
            startDate: data.startdate,
            endDate: data.enddate || null,
            type: data.type,
            description: data.description,
            backgroundColor: getEventColor(data.type)
        };
        
        let url = '';
        if (selectedEvent.extendedProps.isSyllabusEvent) {
            url = `http://localhost:3000/syllabus/${selectedEvent.extendedProps.syllaId}/event/${selectedEvent.extendedProps.eventId}`;
        } 
        else {
            url = `http://localhost:3000/events/${selectedEvent.id}`;
        }

        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updatedEvent)
        });

        if (res.ok) {
           await reloadCalendarEvents();
           showEditModal = false;
           selectedEvent = null;
        }
    }

    async function handleDelete() {
        let url = '';
        if (selectedEvent.extendedProps.isSyllabusEvent) {
            url = `http://localhost:3000/syllabus/${selectedEvent.extendedProps.syllaId}/event/${selectedEvent.extendedProps.eventId}`;
        } 
        else {
            url = `http://localhost:3000/events/${selectedEvent.id}`;
        }

        const res = await fetch(url, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (res.ok) {
            await reloadCalendarEvents();
            showEditModal = false;
            selectedEvent = null;
        }
    }

    async function reloadCalendarEvents() {
        const [eventsRes, syllabiRes] = await Promise.all([
            fetch('http://localhost:3000/events', { credentials: 'include' }),
            fetch('http://localhost:3000/syllabi', { credentials: 'include' })
        ]);

        const allEvents = [];

        if (eventsRes.ok) {
            const saved = await eventsRes.json();
            const formattedEvents = saved.map(event => ({
                id: event._id,
                title: event.title,
                start: new Date(event.startDate),
                end: new Date(event.endDate || event.startDate),
                backgroundColor: getEventColor(event.type),
                extendedProps: {
                    description: event.description,
                    type: event.type
                },
                editable: true,
                allDay: true
            }));
            allEvents.push(...formattedEvents)
        }

        if (syllabiRes.ok) {
            const syllabi = await syllabiRes.json();
            syllabi.forEach(function(syllabus) {
                syllabus.events.forEach(function(event) {
                    if (!event.startDate) return;
                    allEvents.push({
                        title: event.title,
                        start: new Date(event.startDate),
                        end: new Date(event.endDate || event.startDate),
                        backgroundColor: getEventColor(event.type),
                        extendedProps: {
                        description: event.descrpition,
                        type: event.type,
                        isSyllabusEvent: true,
                        syllaId: syllabus._id,
                        eventId: event._id
                    },
                        editable: true,
                        allDay: true
                    });
                });
            });
        }

        ec.setOption('events', allEvents)
    }

    onMount(async () => {

    const prefsRes = await fetch('http://localhost:3000/preferences', {
        credentials: 'include'
    });
    if (prefsRes.ok) {
        const prefs = await prefsRes.json();
        if (prefs.calendarTheme) calendarTheme.set(prefs.calendarTheme);
        if (prefs.calendarBackground) calendarBackground.set(prefs.calendarBackground);
        if (prefs.backgroundOpacity !== undefined) backgroundOpacity.set(prefs.backgroundOpacity);
        if (prefs.categoryColors) categoryColors.set(prefs.categoryColors);
    }
    
    const [eventsRes, syllabiRes] = await Promise.all([
        fetch ('http://localhost:3000/events', { credentials: 'include' }),
        fetch ('http://localhost:3000/syllabi', { credentials: 'include' })
    ])

    if (eventsRes.ok) {
        const saved = await eventsRes.json()
        saved.forEach(function(event) {
            ec.addEvent({
                ...event,
                id: event._id,
                title: event.title,
                start: new Date(event.startDate || event.start),
                end: new Date(event.endDate || event.end || event.startDate || event.start),
                backgroundColor: getEventColor(event.type),
                extendedProps: {
                    description: event.description,
                    type: event.type,
                    isSyllabusEvent: false
                },
                editable: true,
                allDay: true
            })
        })
    }

    if (syllabiRes.ok) {
        const syllabi = await syllabiRes.json()
        syllabi.forEach(function(syllabus) {
            syllabus.events.forEach(function(event) {
                if (!event.startDate) return
                ec.addEvent({
                    title: event.title,
                    start: new Date(event.startDate),
                    end: new Date(event.endDate || event.startDate),
                    backgroundColor: getEventColor(event.type),
                    extendedProps: {
                        description: event.descrpition,
                        type: event.type,
                        isSyllabusEvent: true,
                        syllaId: syllabus._id,
                        eventId: event._id
                    },
                    editable: true,
                    allDay: true
                })
            })
        })
    }
    });

    function toLocalDateString(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function toLocalEndDateString(date) {
        if (!date) return '';
        const d = new Date(date);
        d.setDate(d.getDate() - 1);  // subtract one day to correct the offset
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

</script>

<div
    class="calendar-wrapper theme-{theme}"
    style="
        {bgImage ? `background-image: url('${bgImage}'); background-size: cover; background-position: center;` : ''}
    "
>
    {#if bgImage}
        <div class="bg-overlay" style="opacity: {1 - bgOpacity};"></div>
    {/if}

<!-- <Calendar bind:this={ec} plugins={[DayGrid, TimeGrid, List, Interaction]} {options} /> -->
  
    <div id="addbtns">
        <button class="add" onclick={() => (showModal = true)}>Add Event</button>
        <button class="add" onclick={() => window.location.href = 'http://localhost:3000/export'}>Export</button>
    </div>

    <Calendar bind:this={ec} plugins={[DayGrid, TimeGrid, List, Interaction]} {options} />

    <Modal bind:showModal>
        {#snippet header()}
            <h2>New Event</h2>
        {/snippet}

        <form id="calendar-event-form" name="calendar-event-form" method="post" onsubmit={handleSubmit}>
            <div class="form-group">
                <label for="event-title">Event Title</label>
                <input type="text" id="event-title" name="title" placeholder="e.g., Marketing Workshop" required>
            </div>

            <!-- Category dropdown so color can be applied -->
            <div class="form-group">
                <label for="event-category">Category</label>
                <select id="event-category" name="type">
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="quiz">Quiz</option>
                    <option value="recitation">Recitation</option>
                    <option value="lecture">Lecture</option>
                    <option value="consultation">Consultation</option>
                    <option value="break">Break</option>
                    <option value="other">Other</option>
                </select>

            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="event-start-date">Start Date</label>
                    <input type="date" id="event-start-date" name="startdate" required>
                </div>
                <div class="form-group">
                    <label for="event-end-date">End Date</label>
                    <input type="date" id="event-end-date" name="enddate">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="event-desc">Description</label>
                    <textarea id="event-desc" name="description" rows="2"></textarea>
                </div>
            </div>

            <button id="final" type="submit">Add to Calendar</button>
        </form>
    </Modal>

    <Modal bind:showModal={showEditModal}>
    {#snippet header()}
        <h2>Edit Event</h2>
    {/snippet}

    {#if selectedEvent}
        <form id="edit-event-form" onsubmit={handleEdit}>
            <div class="form-group">
                <label for="edit-title">Event Title</label>
                <input type="text" id="edit-title" name="title" value={selectedEvent.title} required>
            </div>

            <div class="form-group">
                <label for="edit-category">Category</label>
                <select id="edit-category" name="type" value={selectedEvent.extendedProps?.type ?? 'other'}>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="quiz">Quiz</option>
                    <option value="recitation">Recitation</option>
                    <option value="lecture">Lecture</option>
                    <option value="consultation">Consultation</option>
                    <option value="break">Break</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="edit-start">Start Date</label>
                    <input type="date" id="edit-start" name="startdate"
                        value={toLocalDateString(selectedEvent.start)} required>
                </div>
                <div class="form-group">
                    <label for="edit-end">End Date</label>
                    <input type="date" id="edit-end" name="enddate"
                        value={toLocalEndDateString(selectedEvent.end)}>
                </div>
            </div>

            <div class="form-group">
                <label for="edit-desc">Description</label>
                <textarea id="edit-desc" name="description" rows="2">{selectedEvent.extendedProps?.description ?? ''}</textarea>
            </div>

            <div style="display:flex; gap:8px;">
                <button id="final" type="submit">Save Changes</button>
                <button id="final" type="button" onclick={handleDelete}
                    style="background:#fee2e2; border-color:#fca5a5;">
                    Delete
                </button>
            </div>
        </form>
    {/if}
</Modal>
</div>

<style>
    .calendar-wrapper {
        position: relative;
        padding: 1rem;
        border-radius: 12px;
        overflow: hidden;
        min-height: 400px;
    }

    .bg-overlay {
        position: absolute;
        inset: 0;
        background: #000;
        pointer-events: none;
        z-index: 0;
    }

    .calendar-wrapper > :not(.bg-overlay) {
        position: relative;
        z-index: 1;
    }

    .theme-light {
        background-color: #ffffff;
        color: #1a1a1a;
    }

    .theme-dark {
        background-color: #1e1e2e;
        color: #cdd6f4;
    }

    .theme-dark :global(.ec-toolbar),
    .theme-dark :global(.ec-header),
    .theme-dark :global(.ec-body),
    .theme-dark :global(.ec-day),
    .theme-dark :global(.ec-day-head) {
        background-color: #1e1e2e !important;
        color: #cdd6f4 !important;
        border-color: #45475a !important;
    }

    .theme-high-contrast {
        background-color: #000000;
        color: #ffffff;
    }

    .theme-high-contrast :global(.ec-toolbar),
    .theme-high-contrast :global(.ec-header),
    .theme-high-contrast :global(.ec-body),
    .theme-high-contrast :global(.ec-day),
    .theme-high-contrast :global(.ec-day-head) {
        background-color: #000000 !important;
        color: #ffffff !important;
        border-color: #ffffff !important;
    }

    #addbtns{
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        margin-bottom: 0.5em;
    }

    .add{
        background: #fff;
        color: currentcolor;
        border-color: oklch(87% 0 0);

    }
    .add:hover {
    background-color: oklch(92.2% 0 0);
    }
    #calendar-event-form {
    background: var(--card-bg);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
    border: 1px solid var(--border-color);
        }

    h2 {
    margin-top: 1rem;
    font-size: 1.5rem;
    color: black;
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    font-weight: 600;
    }

    .form-group {
    margin-bottom: 1.5rem;
    }

    .form-row {
    display: flex;
    gap: 15px;
    margin-bottom: 1rem;
    }

    .form-row > div {
    flex: 1; /* Makes Date and Time take up equal space */
    }

    label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #64748b;
    }

    input {
    width: 100%;
    padding: 10px;
    border: 1px solid oklch(92.2% 0 0);
    border-radius: 6px;
    font-size: 1rem;
    box-sizing: border-box; /* Prevents padding from breaking width */
    transition: border-color 0.2s;
    }

    input:focus {
    outline: none;
    border-color: var(--primary-color);
    }

    #final {
    width: 100%;
    background: #fff;
    color: currentcolor;
    border-color: oklch(87% 0 0);
    padding: 12px;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 10px;
    }

    #final:hover {
    background-color: oklch(92.2% 0 0);
    }

    .theme-dark :global(.ec-button) {
    background-color: #2a2a3e !important;
    color: #cdd6f4 !important;
    border-color: #45475a !important;
    }

    .theme-dark :global(.ec-button:hover) {
        background-color: #3a3a5e !important;
    }

    .theme-dark :global(.ec-button-active) {
        background-color: #45475a !important;
    }

    .theme-high-contrast :global(.ec-button) {
        background-color: #000 !important;
        color: #fff !important;
        border-color: #fff !important;
    }

    .theme-high-contrast :global(.ec-button:hover) {
        background-color: #333 !important;
    }

    .theme-dark :global(.ec-button) {
        background-color: #2a2a3e !important;
        color: #cdd6f4 !important;
        border-color: #45475a !important;
    }

    .theme-dark :global(.ec-button:hover) {
        background-color: #3a3a5e !important;
    }

    .theme-dark :global(.ec-button-active),
    .theme-dark :global(.ec-button.active) {
        background-color: #45475a !important;
        color: #ffffff !important;
    }

    .theme-dark :global(.ec-title) {
        color: #cdd6f4 !important;
    }

    /* Also style the Add Event / Export / Upload buttons in dark mode */
    .theme-dark .add {
        background: #2a2a3e;
        color: #cdd6f4;
        border-color: #45475a;
    }

    .theme-dark .add:hover {
        background: #3a3a5e;
    }

    .theme-dark :global(.ec-header),
    .theme-dark :global(.ec-header *) {
        background-color: #1e1e2e !important;
        color: #cdd6f4 !important;
        border-color: #45475a !important;
    }

    /* High contrast toolbar buttons */
    .theme-high-contrast :global(.ec-button) {
        background-color: #000 !important;
        color: #fff !important;
        border-color: #fff !important;
    }

    .theme-high-contrast :global(.ec-button:hover) {
        background-color: #333 !important;
    }

    .theme-high-contrast :global(.ec-button-active),
    .theme-high-contrast :global(.ec-button.active) {
        background-color: #fff !important;
        color: #000 !important;
    }

    .theme-high-contrast :global(.ec-title) {
        color: #fff !important;
    }

    .theme-high-contrast .add {
        background: #000;
        color: #fff;
        border-color: #fff;
    }

    .theme-high-contrast .add:hover {
        background: #333;
    }

    .theme-high-contrast :global(.ec-header),
    .theme-high-contrast :global(.ec-header *) {
        background-color: #000000 !important;
        color: #ffffff !important;
        border-color: #ffffff !important;
    }
</style>
