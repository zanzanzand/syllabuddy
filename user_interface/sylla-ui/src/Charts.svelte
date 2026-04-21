<script>
    import { onMount } from 'svelte';
    import { Line, Pie } from 'svelte-chartjs';
    import {
        Chart, LineElement, PointElement, LineController,
        CategoryScale, LinearScale, Legend, Tooltip,
        ArcElement, PieController
    } from 'chart.js';

    Chart.register(
        LineElement, PointElement, LineController,
        CategoryScale, LinearScale, Legend, Tooltip,
        ArcElement, PieController
    );

    let events = $state([]);

    const MONTHS = ['January','February','March','April','May',
                    'June','July','August','September','October','November','December'];
    const COLORS = ['#6366f1','#a3b545','#a855f7','#eab308','#6b7280','#3b82f6'];

    let lineData = $state({ labels: [], datasets: [] });
    let pieData = $state({ labels: [], datasets: [] });

    onMount(async () => {
        const res = await fetch('http://localhost:3000/events', {
            credentials: 'include'
        });
        if (res.ok) {
            events = await res.json();
            processData();
        }
    });

    function processData() {
        const monthlyCounts = Array(12).fill(0);
        const typeCounts = {};

         events.forEach(event => {
            const dateStr = event.startDate || event.start;
            if (!dateStr) return;
            const date = new Date(dateStr);
            const month = date.getMonth();
            monthlyCounts[month]++;

            const type = event.type || 'event';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        lineData = {
            labels: MONTHS.map(m => m.slice(0, 3)),
            datasets: [{
                label: 'Tasks & Events',
                data: monthlyCounts,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                pointBackgroundColor: '#6366f1',
                tension: 0.3,
                fill: true
            }]
        };

        pieData = {
            labels: Object.keys(typeCounts),
            datasets: [{
                data: Object.values(typeCounts),
                backgroundColor: COLORS
            }]
        };
    }

    const lineOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
                title: { display: true, text: 'No. of tasks' }
            },
            x: {
                title: { display: true, text: 'Months' }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' }
        }
    };
</script>

<div class="charts-wrapper">
    <div class="chart-card">
        <h2>Seasonal Trend</h2>
        <p class="subtitle">{events.length} total events</p>
        <Line data={lineData} options={lineOptions} />
    </div>

    <div class="chart-card">
        <h2>Event Types</h2>
        {#if pieData.labels.length > 0}
            <Pie data={pieData} options={pieOptions} />
        {:else}
            <p class="empty">No event data yet.</p>
        {/if}
    </div>
</div>

<style>
    .charts-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        padding: 16px;
    }

    .chart-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e5e5;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        padding: 24px;
        flex: 1;
        min-width: 300px;
    }

    h2 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 4px 0;
    }

    .subtitle {
        font-size: 0.875rem;
        color: #888;
        margin: 0 0 16px 0;
    }

    .empty {
        color: #aaa;
        text-align: center;
        margin-top: 80px;
    }
</style>