/**
 * Section 3: PV Orientation Optimization (Azimuth/Slope Heatmap + 3D Surface)
 */
(async function () {
    const data = await DataLoader.loadCSV('data/azislope/grid_search_data.csv');

    // Extract unique sorted azimuths and slopes
    const azimuths = [...new Set(data.map(r => r.Azimuth))].sort((a, b) => a - b);
    const slopes = [...new Set(data.map(r => r.Slope))].sort((a, b) => a - b);

    // Pivot into 2D matrix: z[slopeIdx][azimuthIdx]
    const zMatrix = [];
    const dataMap = {};
    data.forEach(r => {
        dataMap[`${r.Azimuth}_${r.Slope}`] = r.Metric;
    });

    slopes.forEach(s => {
        const row = [];
        azimuths.forEach(a => {
            row.push(dataMap[`${a}_${s}`] || null);
        });
        zMatrix.push(row);
    });

    // Find optimal point
    let bestNPV = -Infinity;
    let bestAz = 0, bestSlope = 0;
    data.forEach(r => {
        if (r.Metric > bestNPV) {
            bestNPV = r.Metric;
            bestAz = r.Azimuth;
            bestSlope = r.Slope;
        }
    });

    // === 3a: Heatmap ===
    const heatmapTraces = [
        {
            x: azimuths,
            y: slopes,
            z: zMatrix,
            type: 'heatmap',
            colorscale: 'YlOrRd',
            reversescale: false,
            colorbar: { title: 'NPV (EUR)', titleside: 'right' },
            hovertemplate: 'Azimuth: %{x}\u00B0<br>Slope: %{y}\u00B0<br>NPV: %{z:,.0f} EUR<extra></extra>'
        },
        // Optimal point marker
        {
            x: [bestAz],
            y: [bestSlope],
            mode: 'markers+text',
            type: 'scatter',
            marker: { size: 14, color: '#fff', symbol: 'star', line: { width: 2, color: '#333' } },
            text: [`Optimal: ${bestAz}\u00B0, ${bestSlope.toFixed(0)}\u00B0`],
            textposition: 'top center',
            textfont: { size: 11, color: '#333' },
            showlegend: false,
            hovertemplate: `Optimal<br>Azimuth: ${bestAz}\u00B0<br>Slope: ${bestSlope.toFixed(1)}\u00B0<br>NPV: ${bestNPV.toFixed(0)} EUR<extra></extra>`
        }
    ];

    const heatmapLayout = {
        ...PLOT_DEFAULTS,
        xaxis: { title: 'Azimuth (\u00B0)', gridcolor: '#eee' },
        yaxis: { title: 'Slope (\u00B0)', gridcolor: '#eee' },
        height: 500,
        showlegend: false
    };

    Plotly.newPlot('chart-heatmap', heatmapTraces, heatmapLayout, PLOT_CONFIG);

    // === 3b: 3D Surface ===
    const surfaceTrace = [{
        x: azimuths,
        y: slopes,
        z: zMatrix,
        type: 'surface',
        colorscale: 'YlOrRd',
        colorbar: { title: 'NPV (EUR)' },
        hovertemplate: 'Azimuth: %{x}\u00B0<br>Slope: %{y}\u00B0<br>NPV: %{z:,.0f} EUR<extra></extra>'
    }];

    const surfaceLayout = {
        ...PLOT_DEFAULTS,
        height: 550,
        scene: {
            xaxis: { title: 'Azimuth (\u00B0)' },
            yaxis: { title: 'Slope (\u00B0)' },
            zaxis: { title: 'NPV (EUR)' },
            camera: { eye: { x: 1.3, y: -1.5, z: 0.8 } }
        },
        margin: { l: 0, r: 0, t: 10, b: 10 },
        showlegend: false
    };

    Plotly.newPlot('chart-surface', surfaceTrace, surfaceLayout, PLOT_CONFIG);
})();
