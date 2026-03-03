/**
 * Section 1: PV Orientation Optimization (Side-by-side Porto vs Berlin)
 */
(async function () {
    const baseDir = window.DATA_DIR || 'data/';
    const portoData = await DataLoader.loadCSV(baseDir + 'azislope/grid_search_porto.csv');
    const berlinData = await DataLoader.loadCSV(baseDir + 'azislope/grid_search_berlin.csv');

    function processGridSearch(data) {
        const azimuths = [...new Set(data.map(r => r.Azimuth))].sort((a, b) => a - b);
        const slopes = [...new Set(data.map(r => r.Slope))].sort((a, b) => a - b);

        const dataMap = {};
        data.forEach(r => {
            dataMap[`${r.Azimuth}_${r.Slope}`] = r.Metric;
        });

        const zMatrix = [];
        slopes.forEach(s => {
            const row = [];
            azimuths.forEach(a => {
                row.push(dataMap[`${a}_${s}`] || null);
            });
            zMatrix.push(row);
        });

        let bestNPV = -Infinity;
        let bestAz = 0, bestSlope = 0;
        data.forEach(r => {
            if (r.Metric > bestNPV) {
                bestNPV = r.Metric;
                bestAz = r.Azimuth;
                bestSlope = r.Slope;
            }
        });

        return { azimuths, slopes, zMatrix, bestNPV, bestAz, bestSlope };
    }

    const porto = processGridSearch(portoData);
    const berlin = processGridSearch(berlinData);

    function buildHeatmapTraces(d) {
        return [
            {
                x: d.azimuths,
                y: d.slopes,
                z: d.zMatrix,
                type: 'heatmap',
                colorscale: 'YlOrRd',
                reversescale: false,
                colorbar: { title: 'NPV (EUR)', titleside: 'right' },
                hovertemplate: 'Azimuth: %{x}\u00B0<br>Slope: %{y}\u00B0<br>NPV: %{z:,.0f} EUR<extra></extra>'
            },
            {
                x: [d.bestAz],
                y: [d.bestSlope],
                mode: 'markers+text',
                type: 'scatter',
                marker: { size: 14, color: '#fff', symbol: 'star', line: { width: 2, color: '#333' } },
                text: [`${d.bestAz.toFixed(0)}\u00B0, ${d.bestSlope.toFixed(0)}\u00B0`],
                textposition: 'top center',
                textfont: { size: 11, color: '#333' },
                showlegend: false,
                hovertemplate: `Optimal<br>Azimuth: ${d.bestAz}\u00B0<br>Slope: ${d.bestSlope.toFixed(1)}\u00B0<br>NPV: ${d.bestNPV.toFixed(0)} EUR<extra></extra>`
            }
        ];
    }

    const heatmapLayout = {
        ...PLOT_DEFAULTS,
        xaxis: { title: 'Azimuth (\u00B0)', gridcolor: '#eee' },
        yaxis: { title: 'Slope (\u00B0)', gridcolor: '#eee' },
        height: 450,
        margin: { l: 60, r: 20, t: 30, b: 60 },
        showlegend: false
    };

    Plotly.newPlot('chart-heatmap-porto', buildHeatmapTraces(porto), { ...heatmapLayout }, PLOT_CONFIG);
    Plotly.newPlot('chart-heatmap-berlin', buildHeatmapTraces(berlin), { ...heatmapLayout }, PLOT_CONFIG);

    // === 3D Surfaces ===
    function buildSurfaceTrace(d) {
        return [{
            x: d.azimuths,
            y: d.slopes,
            z: d.zMatrix,
            type: 'surface',
            colorscale: 'YlOrRd',
            colorbar: { title: 'NPV (EUR)' },
            hovertemplate: 'Azimuth: %{x}\u00B0<br>Slope: %{y}\u00B0<br>NPV: %{z:,.0f} EUR<extra></extra>'
        }];
    }

    const surfaceLayout = {
        ...PLOT_DEFAULTS,
        height: 450,
        scene: {
            xaxis: { title: 'Azimuth (\u00B0)' },
            yaxis: { title: 'Slope (\u00B0)' },
            zaxis: { title: 'NPV (EUR)' },
            camera: { eye: { x: 1.3, y: -1.5, z: 0.8 } }
        },
        margin: { l: 0, r: 0, t: 10, b: 10 },
        showlegend: false
    };

    Plotly.newPlot('chart-surface-porto', buildSurfaceTrace(porto), { ...surfaceLayout }, PLOT_CONFIG);
    Plotly.newPlot('chart-surface-berlin', buildSurfaceTrace(berlin), { ...surfaceLayout }, PLOT_CONFIG);
})();
