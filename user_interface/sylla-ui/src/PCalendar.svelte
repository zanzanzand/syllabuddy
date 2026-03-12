<script>
    import {Calendar, DayGrid} from '@event-calendar/core';
    import { currPage } from './store.js';

    let options = $state({
        view: 'dayGridMonth',
        events: [
            // your list of events
        ]
    });
</script>

<div>
    <button onclick={() => $currPage = 'upload'}>Upload a File</button>
</div>

<Calendar plugins={[DayGrid]} {options} />