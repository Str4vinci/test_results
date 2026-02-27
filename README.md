# PV+Battery System Analysis: Porto vs Berlin

Interactive dashboard for visualizing photovoltaic and battery energy storage simulation results from PhD research.

## Live Site

Visit: [https://str4vinci.github.io/github_page_test/](https://str4vinci.github.io/github_page_test/)

## Features

- **Porto vs Berlin Comparison**: 20-year performance, economics, and battery degradation across 5 scenarios
- **NSGA-II Pareto Fronts**: Interactive filtering of multi-objective optimization results
- **PV Orientation Optimization**: Azimuth/slope heatmap and 3D surface

## Tech Stack

Pure static site: HTML + CSS + vanilla JS. No build step required.

- [Plotly.js](https://plotly.com/javascript/) for interactive charts
- [PapaParse](https://www.papaparse.com/) for CSV parsing
- GitHub Pages for hosting

## Local Development

Open `index.html` in a browser. Due to CORS restrictions on `file://`, use a local server:

```bash
python -m http.server 8000
# Then open http://localhost:8000
```
