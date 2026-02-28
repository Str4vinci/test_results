/**
 * Section 1: Porto vs Berlin Comparison Charts
 */
(async function () {
    const BASE = 'data/comparison/';

    // Load yearly summaries and cost projections for all 5 scenarios
    const summaryFiles = SCENARIO_KEYS.map(k => ({
        label: k,
        url: BASE + k.replace('berlin_', 'berlin_') + '_yearly_summary.csv'
    }));
    // Fix: filenames use the key directly
    const summaries = {};
    const costs = {};

    await Promise.all(SCENARIO_KEYS.map(async (key) => {
        summaries[key] = await DataLoader.loadCSV(BASE + key + '_yearly_summary.csv');
        costs[key] = await DataLoader.loadCSV(BASE + key + '_cost_projection.csv');
    }));

    // === 1a: Performance Chart with metric dropdown ===
    const metrics = [
        { col: 'Grid_Independence_%', label: 'Grid Independence (%)', suffix: '%' },
        { col: 'PV_Production_kWh', label: 'PV Production (kWh)', suffix: ' kWh' },
        { col: 'Import_kWh', label: 'Grid Import (kWh)', suffix: ' kWh' },
        { col: 'Export_kWh', label: 'Grid Export (kWh)', suffix: ' kWh' },
        { col: 'Load_kWh', label: 'Annual Load (kWh)', suffix: ' kWh' }
    ];

    function buildPerformanceTraces(metricIdx) {
        return SCENARIO_KEYS.map(key => ({
            x: DataLoader.column(summaries[key], 'Year'),
            y: DataLoader.column(summaries[key], metrics[metricIdx].col),
            name: SCENARIO_LABELS[key],
            mode: 'lines+markers',
            line: { color: COLORS[key], width: 2 },
            marker: { size: 5, color: COLORS[key] },
            hovertemplate: `%{x}: %{y:.1f}${metrics[metricIdx].suffix}<extra>${SCENARIO_LABELS[key]}</extra>`
        }));
    }

    // Build updatemenus buttons for metric switching
    const metricButtons = metrics.map((m, i) => ({
        label: m.label.split(' (')[0],  // shorter label
        method: 'update',
        args: [
            {
                y: SCENARIO_KEYS.map(key => DataLoader.column(summaries[key], m.col))
            },
            {
                'yaxis.title': m.label
            }
        ]
    }));

    const perfLayout = {
        ...PLOT_DEFAULTS,
        xaxis: {
            title: 'Year',
            dtick: 1,
            range: [0.5, 20.5],
            gridcolor: '#eee'
        },
        yaxis: {
            title: metrics[0].label,
            gridcolor: '#eee'
        },
        updatemenus: [{
            type: 'buttons',
            direction: 'right',
            x: 0,
            y: 1.05,
            xanchor: 'left',
            yanchor: 'bottom',
            buttons: metricButtons,
            font: { size: 11 },
            bgcolor: '#f8f8f8',
            bordercolor: '#ddd',
            borderwidth: 1
        }]
    };

    Plotly.newPlot('chart-performance', buildPerformanceTraces(0), perfLayout, PLOT_CONFIG);

    // === 1b: Economics / Breakeven Chart ===
    const savingsCol = 'Savings_Cumulative_NPV';
    const savingsNomCol = 'Savings_Cumulative';

    function buildEconTraces(useNPV) {
        const col = useNPV ? savingsCol : savingsNomCol;
        return SCENARIO_KEYS.map(key => ({
            x: DataLoader.column(costs[key], 'Year'),
            y: DataLoader.column(costs[key], col),
            name: SCENARIO_LABELS[key],
            mode: 'lines+markers',
            line: { color: COLORS[key], width: 2 },
            marker: { size: 5, color: COLORS[key] },
            hovertemplate: '%{x}: %{y:,.0f} EUR<extra>' + SCENARIO_LABELS[key] + '</extra>'
        }));
    }

    const econButtons = [
        {
            label: 'NPV',
            method: 'update',
            args: [
                { y: SCENARIO_KEYS.map(key => DataLoader.column(costs[key], savingsCol)) },
                { 'yaxis.title': 'Cumulative Savings NPV (EUR)' }
            ]
        },
        {
            label: 'Nominal',
            method: 'update',
            args: [
                { y: SCENARIO_KEYS.map(key => DataLoader.column(costs[key], savingsNomCol)) },
                { 'yaxis.title': 'Cumulative Savings Nominal (EUR)' }
            ]
        }
    ];

    const econLayout = {
        ...PLOT_DEFAULTS,
        xaxis: {
            title: 'Year',
            dtick: 1,
            range: [0.5, 20.5],
            gridcolor: '#eee'
        },
        yaxis: {
            title: 'Cumulative Savings NPV (EUR)',
            gridcolor: '#eee',
            zeroline: true,
            zerolinecolor: '#999',
            zerolinewidth: 2
        },
        shapes: [{
            type: 'line',
            x0: 0, x1: 21,
            y0: 0, y1: 0,
            line: { color: '#999', width: 1.5, dash: 'dash' }
        }],
        updatemenus: [{
            type: 'buttons',
            direction: 'right',
            x: 0,
            y: 1.05,
            xanchor: 'left',
            yanchor: 'bottom',
            buttons: econButtons,
            font: { size: 11 },
            bgcolor: '#f8f8f8',
            bordercolor: '#ddd',
            borderwidth: 1
        }]
    };

    Plotly.newPlot('chart-economics', buildEconTraces(true), econLayout, PLOT_CONFIG);

    // === 1c: Battery Degradation (Lazy Loaded) ===
    let degradationLoaded = false;

    window.loadDegradation = async function () {
        if (degradationLoaded) return;
        degradationLoaded = true;

        const placeholder = document.getElementById('degradation-placeholder');
        if (placeholder) placeholder.innerHTML = '<p>Loading degradation data...</p>';

        const degradation = {};
        await Promise.all(SCENARIO_KEYS.map(async (key) => {
            degradation[key] = await DataLoader.loadCSV(BASE + key + '_degradation_data.csv');
        }));

        // Remove placeholder
        if (placeholder) placeholder.remove();

        // Build SOH and other traces
        const sohTraces = [];
        const cycleTraces = [];
        const compTraces = [];
        const replacementShapes = [];

        SCENARIO_KEYS.forEach((key, idx) => {
            const data = degradation[key];
            // Sample every 96th row (daily from 15-min)
            const sampled = data.filter((_, i) => i % 96 === 0);
            const totalPoints = sampled.length;
            const years = sampled.map((_, i) => (i / totalPoints) * 20);

            sohTraces.push({
                x: years,
                y: sampled.map(r => r.SOH),
                name: SCENARIO_LABELS[key],
                mode: 'lines',
                line: { color: COLORS[key], width: 1.5 },
                hovertemplate: 'Year %{x:.1f}: SOH %{y:.1f}%<extra>' + SCENARIO_LABELS[key] + '</extra>'
            });

            cycleTraces.push({
                x: years,
                y: sampled.map(r => r.Cumulative_FEC),
                name: SCENARIO_LABELS[key],
                mode: 'lines',
                line: { color: COLORS[key], width: 1.5 },
                hovertemplate: 'Year %{x:.1f}: %{y:.0f} cycles<extra>' + SCENARIO_LABELS[key] + '</extra>'
            });

            // Components: using dashed for cycle, solid for calendar
            // Only need to show these if we want, maybe a stacked area or separate traces?
            compTraces.push({
                x: years,
                y: sampled.map(r => r.Global_Cycle_Degradation * 100),
                name: SCENARIO_LABELS[key] + ' (Cycle)',
                mode: 'lines',
                line: { color: COLORS[key], width: 1.5, dash: 'dot' },
                hovertemplate: 'Year %{x:.1f}: %{y:.1f}% cycle loss<extra>' + SCENARIO_LABELS[key] + '</extra>',
                visible: idx === 0 ? true : 'legendonly' // Only show Porto by default to avoid clutter
            });

            compTraces.push({
                x: years,
                y: sampled.map(r => r.Global_Calendar_Degradation * 100),
                name: SCENARIO_LABELS[key] + ' (Calendar)',
                mode: 'lines',
                line: { color: COLORS[key], width: 1.5, dash: 'solid' },
                hovertemplate: 'Year %{x:.1f}: %{y:.1f}% calendar loss<extra>' + SCENARIO_LABELS[key] + '</extra>',
                visible: idx === 0 ? true : 'legendonly'
            });

            // Find replacement events (where SOH jumps up)
            for (let i = 1; i < sampled.length; i++) {
                if (sampled[i].SOH - sampled[i - 1].SOH > 5) {
                    replacementShapes.push({
                        type: 'line',
                        x0: years[i], x1: years[i],
                        y0: 65, y1: 102,
                        line: { color: COLORS[key], width: 1, dash: 'dot' }
                    });
                }
            }
        });

        const degLayout = {
            ...PLOT_DEFAULTS,
            height: 400,
            xaxis: { title: 'Year', dtick: 1, range: [0, 20], gridcolor: '#eee' },
            yaxis: { title: 'State of Health (%)', range: [65, 102], gridcolor: '#eee' },
            shapes: [
                { type: 'line', x0: 0, x1: 20, y0: 70, y1: 70, line: { color: '#C62828', width: 1.5, dash: 'dash' } },
                ...replacementShapes
            ]
        };

        const cyclesLayout = {
            ...PLOT_DEFAULTS,
            height: 400,
            xaxis: { title: 'Year', dtick: 1, range: [0, 20], gridcolor: '#eee' },
            yaxis: { title: 'Cumulative Eq. Full Cycles', gridcolor: '#eee' }
        };

        const compLayout = {
            ...PLOT_DEFAULTS,
            height: 400,
            xaxis: { title: 'Year', dtick: 1, range: [0, 20], gridcolor: '#eee' },
            yaxis: { title: 'Cumulative Life Loss (%)', gridcolor: '#eee' }
        };

        document.getElementById('chart-degradation-cycles').style.display = 'block';
        document.getElementById('chart-degradation-components').style.display = 'block';

        Plotly.newPlot('chart-degradation-soh', sohTraces, degLayout, PLOT_CONFIG);
        Plotly.newPlot('chart-degradation-cycles', cycleTraces, cyclesLayout, PLOT_CONFIG);
        Plotly.newPlot('chart-degradation-components', compTraces, compLayout, PLOT_CONFIG);
    };

    // Lazy-load via IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !degradationLoaded) {
                window.loadDegradation();
                observer.disconnect();
            }
        });
    }, { rootMargin: '200px' });

    const degContainer = document.getElementById('chart-degradation-soh');
    if (degContainer) observer.observe(degContainer);
})();
