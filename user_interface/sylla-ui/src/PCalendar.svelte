<script>
    import {Calendar, DayGrid} from '@event-calendar/core';

    let options = $state({
        view: 'dayGridMonth',
        events: [
            // your list of events
        ]
    });
</script>

<Calendar plugins={[DayGrid]} {options} />