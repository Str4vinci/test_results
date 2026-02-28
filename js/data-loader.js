/**
 * CSV data loading utilities using PapaParse.
 */
const DataLoader = {
    cache: {},

    /**
     * Load and parse a CSV file. Returns a promise resolving to an array of objects.
     */
    async loadCSV(url) {
        if (this.cache[url]) return this.cache[url];

        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    this.cache[url] = results.data;
                    resolve(results.data);
                },
                error: (err) => reject(err)
            });
        });
    },

    /**
     * Load multiple CSVs in parallel. Returns object keyed by labels.
     */
    async loadMultiple(entries) {
        const results = {};
        await Promise.all(
            entries.map(async ({ label, url }) => {
                results[label] = await this.loadCSV(url);
            })
        );
        return results;
    },

    /**
     * Extract a column from parsed data as an array.
     */
    column(data, colName) {
        return data.map(row => row[colName]);
    }
};

// Shared Plotly layout defaults
const PLOT_DEFAULTS = {
    font: { family: "'Segoe UI', 'Roboto', sans-serif", size: 13, color: '#333' },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 60, r: 40, t: 80, b: 85 },
    hovermode: 'closest',
    showlegend: true,
    legend: {
        orientation: 'h',
        yanchor: 'top',
        y: -0.25,
        xanchor: 'center',
        x: 0.5,
        font: { size: 12 }
    }
};

const PLOT_CONFIG = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false
};

// Scenario color palette
const COLORS = {
    porto: '#E8820C',
    berlin: '#2196F3',
    berlin_de_costs: '#00897B',
    berlin_de_rlp: '#7B1FA2',
    berlin_de_full: '#C62828'
};

const SCENARIO_LABELS = {
    porto: 'Porto',
    berlin: 'Berlin (PT)',
    berlin_de_costs: 'Berlin (DE costs)',
    berlin_de_rlp: 'Berlin (DE load)',
    berlin_de_full: 'Berlin'
};

const SCENARIO_KEYS = ['porto', 'berlin', 'berlin_de_costs', 'berlin_de_rlp', 'berlin_de_full'];
