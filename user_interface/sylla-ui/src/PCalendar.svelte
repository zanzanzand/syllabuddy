<script>
    import {Calendar, DayGrid, Interaction, List, TimeGrid} from '@event-calendar/core';
    import Modal from './AddEventModal.svelte';
    let showModal = $state(false);
    
    let status = $state('');
    let submittedData = $state(null);
    let ec = $state()
    let events_ = $state([])
    
    let options = {
        view: 'dayGridMonth',
        events:[],
        headerToolbar: {
            start: 'prev, next today',
            center: 'title',
            end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        selectable: true,
    };


    function handleSubmit (e) {
        // Insert a event into the collection MongoDB
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        console.log("Form Submitted:", data);
        submittedData = data;
        const newEvent = {
            title: data.title,
            start: `${data.datestart} ${data.timestart}`,
            end: `${data.dateend} ${data.timeend}`,
            editable: true
        }
        status = 'Success!';
        e.currentTarget.reset();
        events_ = [events_, newEvent]
        ec.addEvent(newEvent)

    }
</script>

<button id="add" onclick={() => (showModal = true)}> Add Event </button>

<Calendar bind:this={ec} plugins={[DayGrid, TimeGrid, List, Interaction]} {options} />

<Modal bind:showModal>
	{#snippet header()}
		<h2>
			New Event
		</h2>
	{/snippet}
        
  <form id="calendar-event-form" name="calendar-event-form" method="post" onsubmit={handleSubmit}>

  <div class="form-group">
    <label for="event-title">Event Title</label>
    <input type="text" id="event-title" name="title" placeholder="e.g., Marketing Workshop" required>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="date-start">Date Start: </label>
      <input type="date" id="date-start" name="datestart" required>
    </div>
    <div class="form-group">
      <label for="date-end">Date End: </label>
      <input type="date" id="date-end" name="dateend" required>
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="time-start">Time Start: </label>
      <input type="time" id="time-start" name="timestart" step="1" required>
    </div>
    <div class="form-group">
      <label for="time-end">Time End: </label>
      <input type="time" id="time-end" name="timeend" step="1" required>
    </div>
  </div>

  <button id="final" type="submit">Add to Calendar</button>
</form>
</Modal>

<style>
    #add{
        background: #fff;
        color: currentcolor;
        border-color: oklch(87% 0 0);

    }
    #add:hover {
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
</style>

