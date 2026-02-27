/**
 * Section 2: NSGA-II Pareto Front Visualizations
 */
(async function () {
    const portoData = await DataLoader.loadCSV('data/optimization/pareto_porto.csv');
    const berlinData = await DataLoader.loadCSV('data/optimization/pareto_berlin.csv');

    // Tag each row with location
    portoData.forEach(r => r._location = 'porto');
    berlinData.forEach(r => r._location = 'berlin');
    const allData = [...portoData, ...berlinData];

    // Populate tilt dropdown with unique values
    const tilts = [...new Set(allData.map(r => r.Tilt))].sort((a, b) => a - b);
    const tiltSelect = document.getElementById('tilt-select');
    tilts.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t + '\u00B0';
        tiltSelect.appendChild(opt);
    });

    // Update battery range slider max from data
    const maxBatt = Math.ceil(Math.max(...allData.map(r => r.Battery_kWh)));
    document.getElementById('battery-max').max = maxBatt;
    document.getElementById('battery-max').value = maxBatt;
    document.getElementById('battery-min').max = maxBatt;

    // === Filter state ===
    let filterLocation = 'both';
    let filterBattMin = 0;
    let filterBattMax = maxBatt;
    let filterTilt = 'all';

    function getFilteredData() {
        return allData.filter(r => {
            if (filterLocation !== 'both' && r._location !== filterLocation) return false;
            if (r.Battery_kWh < filterBattMin || r.Battery_kWh > filterBattMax) return false;
            if (filterTilt !== 'all' && r.Tilt !== parseFloat(filterTilt)) return false;
            return true;
        });
    }

    // === 2a: 2D Pareto Scatter ===
    function build2DTraces(filtered) {
        const porto = filtered.filter(r => r._location === 'porto');
        const berlin = filtered.filter(r => r._location === 'berlin');

        const traces = [];
        if (porto.length > 0) {
            traces.push({
                x: porto.map(r => r['Grid_Independence_%']),
                y: porto.map(r => r.NPV_Eur),
                text: porto.map(r =>
                    `Modules: ${r.Modules}<br>Battery: ${r.Battery_kWh} kWh<br>Tilt: ${r.Tilt}\u00B0<br>Azimuth: ${r.Azimuth}\u00B0<br>ZEB: ${r.ZEB_Ratio.toFixed(2)}`
                ),
                name: 'Porto',
                mode: 'markers',
                marker: {
                    size: 10,
                    color: porto.map(r => r.ZEB_Ratio),
                    colorscale: [[0, '#FFF3E0'], [0.5, '#FB8C00'], [1, '#E65100']],
                    colorbar: { title: 'ZEB Ratio', x: 1.02, len: 0.5, y: 0.75 },
                    line: { width: 1, color: '#E8820C' },
                    symbol: 'circle'
                },
                hovertemplate: '%{text}<br>GI: %{x:.1f}%<br>NPV: %{y:,.0f} EUR<extra>Porto</extra>'
            });
        }
        if (berlin.length > 0) {
            traces.push({
                x: berlin.map(r => r['Grid_Independence_%']),
                y: berlin.map(r => r.NPV_Eur),
                text: berlin.map(r =>
                    `Modules: ${r.Modules}<br>Battery: ${r.Battery_kWh} kWh<br>Tilt: ${r.Tilt}\u00B0<br>Azimuth: ${r.Azimuth}\u00B0<br>ZEB: ${r.ZEB_Ratio.toFixed(2)}`
                ),
                name: 'Berlin',
                mode: 'markers',
                marker: {
                    size: 10,
                    color: berlin.map(r => r.ZEB_Ratio),
                    colorscale: [[0, '#E3F2FD'], [0.5, '#42A5F5'], [1, '#0D47A1']],
                    colorbar: { title: 'ZEB Ratio', x: 1.12, len: 0.5, y: 0.75 },
                    line: { width: 1, color: '#2196F3' },
                    symbol: 'diamond'
                },
                hovertemplate: '%{text}<br>GI: %{x:.1f}%<br>NPV: %{y:,.0f} EUR<extra>Berlin</extra>'
            });
        }
        return traces;
    }

    const layout2D = {
        ...PLOT_DEFAULTS,
        xaxis: { title: 'Grid Independence (%)', gridcolor: '#eee' },
        yaxis: { title: 'NPV (EUR)', gridcolor: '#eee' },
        height: 500
    };

    Plotly.newPlot('chart-pareto-2d', build2DTraces(allData), layout2D, PLOT_CONFIG);

    // Filter event handlers
    function updatePareto() {
        const filtered = getFilteredData();
        const traces = build2DTraces(filtered);
        Plotly.react('chart-pareto-2d', traces, layout2D, PLOT_CONFIG);
    }

    // Location toggle
    document.querySelectorAll('#location-toggle .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#location-toggle .btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterLocation = btn.dataset.value;
            updatePareto();
        });
    });

    // Battery sliders
    const battMinSlider = document.getElementById('battery-min');
    const battMaxSlider = document.getElementById('battery-max');
    const battLabel = document.getElementById('battery-range-label');

    function updateBattLabel() {
        battLabel.textContent = `${battMinSlider.value} \u2013 ${battMaxSlider.value} kWh`;
    }

    battMinSlider.addEventListener('input', () => {
        filterBattMin = parseFloat(battMinSlider.value);
        if (filterBattMin > filterBattMax) {
            battMaxSlider.value = battMinSlider.value;
            filterBattMax = filterBattMin;
        }
        updateBattLabel();
        updatePareto();
    });

    battMaxSlider.addEventListener('input', () => {
        filterBattMax = parseFloat(battMaxSlider.value);
        if (filterBattMax < filterBattMin) {
            battMinSlider.value = battMaxSlider.value;
            filterBattMin = filterBattMax;
        }
        updateBattLabel();
        updatePareto();
    });

    // Tilt dropdown
    tiltSelect.addEventListener('change', () => {
        filterTilt = tiltSelect.value;
        updatePareto();
    });

    // === 2b: Parallel Coordinates ===
    function buildParcoords() {
        const traces = [{
            type: 'parcoords',
            line: {
                color: allData.map(r => r.NPV_Eur),
                colorscale: 'Viridis',
                showscale: true,
                colorbar: { title: 'NPV (EUR)' }
            },
            dimensions: [
                {
                    label: 'Location',
                    values: allData.map(r => r._location === 'porto' ? 0 : 1),
                    tickvals: [0, 1],
                    ticktext: ['Porto', 'Berlin']
                },
                {
                    label: 'Modules',
                    values: allData.map(r => r.Modules)
                },
                {
                    label: 'Battery (kWh)',
                    values: allData.map(r => r.Battery_kWh)
                },
                {
                    label: 'Tilt (\u00B0)',
                    values: allData.map(r => r.Tilt)
                },
                {
                    label: 'Grid Ind. (%)',
                    values: allData.map(r => r['Grid_Independence_%'])
                },
                {
                    label: 'NPV (EUR)',
                    values: allData.map(r => r.NPV_Eur)
                },
                {
                    label: 'ZEB Ratio',
                    values: allData.map(r => r.ZEB_Ratio)
                }
            ]
        }];

        const layout = {
            ...PLOT_DEFAULTS,
            height: 450,
            margin: { l: 60, r: 60, t: 30, b: 30 }
        };
        delete layout.showlegend;

        Plotly.newPlot('chart-parcoords', traces, layout, PLOT_CONFIG);
    }

    buildParcoords();

    // === 2c: 3D Scatter ===
    function build3D() {
        const porto = allData.filter(r => r._location === 'porto');
        const berlin = allData.filter(r => r._location === 'berlin');

        const traces = [
            {
                x: porto.map(r => r['Grid_Independence_%']),
                y: porto.map(r => r.NPV_Eur),
                z: porto.map(r => r.ZEB_Ratio),
                text: porto.map(r => `${r.Modules} mod, ${r.Battery_kWh} kWh`),
                name: 'Porto',
                type: 'scatter3d',
                mode: 'markers',
                marker: {
                    size: 5,
                    color: '#E8820C',
                    opacity: 0.85
                },
                hovertemplate: 'GI: %{x:.1f}%<br>NPV: %{y:,.0f}<br>ZEB: %{z:.2f}<br>%{text}<extra>Porto</extra>'
            },
            {
                x: berlin.map(r => r['Grid_Independence_%']),
                y: berlin.map(r => r.NPV_Eur),
                z: berlin.map(r => r.ZEB_Ratio),
                text: berlin.map(r => `${r.Modules} mod, ${r.Battery_kWh} kWh`),
                name: 'Berlin',
                type: 'scatter3d',
                mode: 'markers',
                marker: {
                    size: 5,
                    color: '#2196F3',
                    opacity: 0.85
                },
                hovertemplate: 'GI: %{x:.1f}%<br>NPV: %{y:,.0f}<br>ZEB: %{z:.2f}<br>%{text}<extra>Berlin</extra>'
            }
        ];

        const layout = {
            ...PLOT_DEFAULTS,
            height: 550,
            scene: {
                xaxis: { title: 'Grid Independence (%)' },
                yaxis: { title: 'NPV (EUR)' },
                zaxis: { title: 'ZEB Ratio' },
                camera: { eye: { x: 1.5, y: 1.5, z: 0.8 } }
            },
            margin: { l: 0, r: 0, t: 10, b: 10 }
        };

        Plotly.newPlot('chart-pareto-3d', traces, layout, PLOT_CONFIG);
    }

    build3D();
})();
