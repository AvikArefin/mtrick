/**
 * Modular Chart Exporter for MTRICK
 * Provides Light-mode 4K PNG and SVG export with aspect ratio selection,
 * configurable font sizes (title, axis labels/ticks, legends),
 * solid black axis labels/ticks, interactive plot color editing, and explicit white backgrounds.
 */
const ChartExporter = (function () {
    let activeChartId = null;
    let exportChartInstance = null;
    let customXLabel = '';
    let customYLabel = '';
    let customSeriesColors = [];
    let exportAspectRatio = 'auto'; // 'auto' | '16:9' | '4:3' | '1:1' | '2:1'

    // Font size settings (base values in px)
    let fontSizeTitle = 16;
    let fontSizeAxisTitle = 14;
    let fontSizeAxisTicks = 11;
    let fontSizeLegend = 12;

    function initModalHTML() {
        if (document.getElementById('export-modal')) return;
        const modalHTML = `
        <div id="export-modal" class="export-modal-backdrop">
            <div class="export-modal-content">
                <div class="export-modal-header">
                    <h3>Export High Quality Chart</h3>
                    <button class="export-close-btn" id="export-close-btn">&times;</button>
                </div>
                <div class="export-modal-body">
                    <div class="export-controls-panel">
                        <div class="export-form-group">
                            <label>X-Axis Label</label>
                            <input type="text" id="export-x-label" class="export-input" placeholder="e.g. Epochs / Steps">
                        </div>
                        <div class="export-form-group">
                            <label>Y-Axis Label</label>
                            <input type="text" id="export-y-label" class="export-input" placeholder="e.g. Loss / Accuracy">
                        </div>
                        <div class="export-form-group">
                            <label>Aspect Ratio</label>
                            <select id="export-aspect-select" class="export-select">
                                <option value="auto">Auto / Original</option>
                                <option value="16:9">16:9 (Widescreen)</option>
                                <option value="4:3">4:3 (Standard)</option>
                                <option value="1:1">1:1 (Square)</option>
                                <option value="2:1">2:1 (Panorama)</option>
                            </select>
                        </div>
                        <div class="export-form-group">
                            <label>Font Sizes (px)</label>
                            <div class="export-font-presets" style="display: flex; gap: 6px; margin-bottom: 8px;">
                                <button type="button" class="export-font-preset-btn active" data-scale="1.0">100%</button>
                                <button type="button" class="export-font-preset-btn" data-scale="1.25">125%</button>
                                <button type="button" class="export-font-preset-btn" data-scale="1.5">150%</button>
                                <button type="button" class="export-font-preset-btn" data-scale="2.0">200%</button>
                            </div>
                            <div class="export-font-grid">
                                <div class="export-font-item">
                                    <label>Plot Title</label>
                                    <input type="number" id="export-font-title" class="export-input" value="16" min="6" max="72">
                                </div>
                                <div class="export-font-item">
                                    <label>Legend</label>
                                    <input type="number" id="export-font-legend" class="export-input" value="12" min="6" max="72">
                                </div>
                                <div class="export-font-item">
                                    <label>Axis Titles (X/Y)</label>
                                    <input type="number" id="export-font-axis-title" class="export-input" value="14" min="6" max="72">
                                </div>
                                <div class="export-font-item">
                                    <label>Axis Values (X/Y)</label>
                                    <input type="number" id="export-font-axis-ticks" class="export-input" value="11" min="6" max="72">
                                </div>
                            </div>
                        </div>
                        <div class="export-form-group">
                            <label>Plot Series Colors</label>
                            <div id="export-series-colors-list" class="export-colors-list"></div>
                        </div>
                    </div>
                    <div class="export-preview-panel">
                        <div class="export-preview-header">Preview (Solid White Background)</div>
                        <div id="export-preview-container" class="export-preview-container">
                            <canvas id="export-preview-canvas"></canvas>
                        </div>
                    </div>
                </div>
                <div class="export-modal-footer">
                    <button id="export-png-btn" class="export-action-btn primary-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download PNG (4K)
                    </button>
                    <button id="export-svg-btn" class="export-action-btn secondary-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download SVG
                    </button>
                    <button id="export-cancel-btn" class="export-action-btn cancel-btn">Cancel</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('export-close-btn').addEventListener('click', closeModal);
        document.getElementById('export-cancel-btn').addEventListener('click', closeModal);
        document.getElementById('export-modal').addEventListener('click', (e) => {
            if (e.target.id === 'export-modal') closeModal();
        });

        document.getElementById('export-x-label').addEventListener('input', (e) => {
            customXLabel = e.target.value;
            updatePreview();
        });
        document.getElementById('export-y-label').addEventListener('input', (e) => {
            customYLabel = e.target.value;
            updatePreview();
        });
        document.getElementById('export-aspect-select').addEventListener('change', (e) => {
            exportAspectRatio = e.target.value;
            updatePreview();
        });

        // Font size inputs
        document.getElementById('export-font-title').addEventListener('input', (e) => {
            fontSizeTitle = Math.max(6, parseInt(e.target.value) || 16);
            updatePreview();
        });
        document.getElementById('export-font-legend').addEventListener('input', (e) => {
            fontSizeLegend = Math.max(6, parseInt(e.target.value) || 12);
            updatePreview();
        });
        document.getElementById('export-font-axis-title').addEventListener('input', (e) => {
            fontSizeAxisTitle = Math.max(6, parseInt(e.target.value) || 14);
            updatePreview();
        });
        document.getElementById('export-font-axis-ticks').addEventListener('input', (e) => {
            fontSizeAxisTicks = Math.max(6, parseInt(e.target.value) || 11);
            updatePreview();
        });

        // Font size scale preset buttons
        document.querySelectorAll('.export-font-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const scale = parseFloat(e.target.getAttribute('data-scale')) || 1.0;
                fontSizeTitle = Math.round(16 * scale);
                fontSizeAxisTitle = Math.round(14 * scale);
                fontSizeAxisTicks = Math.round(11 * scale);
                fontSizeLegend = Math.round(12 * scale);

                document.getElementById('export-font-title').value = fontSizeTitle;
                document.getElementById('export-font-axis-title').value = fontSizeAxisTitle;
                document.getElementById('export-font-axis-ticks').value = fontSizeAxisTicks;
                document.getElementById('export-font-legend').value = fontSizeLegend;

                document.querySelectorAll('.export-font-preset-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                updatePreview();
            });
        });

        document.getElementById('export-png-btn').addEventListener('click', exportPNG4K);
        document.getElementById('export-svg-btn').addEventListener('click', exportSVG);
    }

    function openExportModal(chartId) {
        initModalHTML();
        activeChartId = chartId;
        const srcChart = chartInstances[chartId];
        const config = chartConfigs[chartId];
        if (!srcChart || !config) return;

        const xTitle = (srcChart.options.scales.x && srcChart.options.scales.x.title && srcChart.options.scales.x.title.text) || '';
        const yTitle = (srcChart.options.scales.y && srcChart.options.scales.y.title && srcChart.options.scales.y.title.text) || '';

        customXLabel = xTitle || (config.type.includes('line') ? 'Epoch' : '');
        customYLabel = yTitle || '';

        document.getElementById('export-x-label').value = customXLabel;
        document.getElementById('export-y-label').value = customYLabel;

        exportAspectRatio = 'auto';
        document.getElementById('export-aspect-select').value = exportAspectRatio;

        // Reset font sizes to baseline
        fontSizeTitle = 16;
        fontSizeAxisTitle = 14;
        fontSizeAxisTicks = 11;
        fontSizeLegend = 12;

        document.getElementById('export-font-title').value = fontSizeTitle;
        document.getElementById('export-font-axis-title').value = fontSizeAxisTitle;
        document.getElementById('export-font-axis-ticks').value = fontSizeAxisTicks;
        document.getElementById('export-font-legend').value = fontSizeLegend;

        document.querySelectorAll('.export-font-preset-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-scale') === '1.0');
        });

        // Series colors
        customSeriesColors = srcChart.data.datasets.map(ds => ds.borderColor || ds.backgroundColor || '#3b82f6');
        const colorsListEl = document.getElementById('export-series-colors-list');
        colorsListEl.innerHTML = '';

        if (srcChart.config.type === 'matrix') {
            colorsListEl.innerHTML = '<div style="font-size:0.85em; color:var(--text-muted);">Matrix heatmap cell styling automatically maps count intensities.</div>';
        } else {
            srcChart.data.datasets.forEach((ds, idx) => {
                const item = document.createElement('div');
                item.className = 'export-color-item';
                const colorVal = (typeof customSeriesColors[idx] === 'string' && customSeriesColors[idx].startsWith('#'))
                    ? customSeriesColors[idx].slice(0, 7)
                    : '#3b82f6';

                item.innerHTML = `
                    <input type="color" class="export-color-picker" data-idx="${idx}" value="${colorVal}">
                    <span class="export-color-label">${ds.label || 'Series ' + (idx + 1)}</span>
                `;
                item.querySelector('.export-color-picker').addEventListener('input', (e) => {
                    const i = parseInt(e.target.getAttribute('data-idx'));
                    customSeriesColors[i] = e.target.value;
                    updatePreview();
                });
                colorsListEl.appendChild(item);
            });
        }

        document.getElementById('export-modal').classList.add('open');
        updatePreview();
    }

    function closeModal() {
        const modal = document.getElementById('export-modal');
        if (modal) modal.classList.remove('open');
        if (exportChartInstance) {
            exportChartInstance.destroy();
            exportChartInstance = null;
        }
    }

    function getAspectRatioValue() {
        if (exportAspectRatio === '16:9') return 9 / 16;
        if (exportAspectRatio === '4:3') return 3 / 4;
        if (exportAspectRatio === '1:1') return 1.0;
        if (exportAspectRatio === '2:1') return 1 / 2;

        // Auto / Original
        const srcCanvas = activeChartId ? document.getElementById(`canvas_${activeChartId}`) : null;
        if (srcCanvas && srcCanvas.width > 0) {
            return srcCanvas.height / srcCanvas.width;
        }
        return 0.6;
    }

    function getThemeColors() {
        return { bg: '#ffffff', text: '#000000', tick: '#000000', grid: '#e2e8f0', heatmapBorder: '#ffffff' };
    }

    const whiteCanvasPlugin = {
        id: 'export_white_canvas_bg',
        beforeDraw: (chart) => {
            const { ctx, width, height } = chart;
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    };

    function buildChartConfig(scaleFactor = 1) {
        const srcChart = chartInstances[activeChartId];
        const config = chartConfigs[activeChartId];
        if (!srcChart || !config) return null;

        const colors = getThemeColors();
        const fontFam = Chart.defaults.font.family || "'Fira Code', monospace";
        const isMatrix = srcChart.config.type === 'matrix';

        // Deep clone datasets
        const datasets = srcChart.data.datasets.map((ds, i) => {
            const clonedDs = { ...ds };

            if (!isMatrix) {
                const c = customSeriesColors[i] || ds.borderColor || '#3b82f6';
                const isRaw = ds.label && ds.label.includes('Raw');
                const colorHex = isRaw ? (c + '40') : c;
                clonedDs.borderColor = colorHex;
                if (typeof ds.backgroundColor === 'string') {
                    clonedDs.backgroundColor = colorHex;
                }
            } else {
                clonedDs.borderColor = colors.heatmapBorder;
            }

            if (scaleFactor !== 1) {
                if (clonedDs.borderWidth) clonedDs.borderWidth = Math.max(1, Math.round(clonedDs.borderWidth * scaleFactor));
                if (clonedDs.pointRadius) clonedDs.pointRadius = Math.round(clonedDs.pointRadius * scaleFactor);
            }
            return clonedDs;
        });

        // Clone options structure
        const options = JSON.parse(JSON.stringify(srcChart.options));

        // Preserve functional properties from original chart options
        if (srcChart.options.plugins && srcChart.options.plugins.legend && srcChart.options.plugins.legend.labels && srcChart.options.plugins.legend.labels.generateLabels) {
            if (!options.plugins) options.plugins = {};
            if (!options.plugins.legend) options.plugins.legend = {};
            if (!options.plugins.legend.labels) options.plugins.legend.labels = {};

            options.plugins.legend.labels.generateLabels = function (chart) {
                const labels = srcChart.options.plugins.legend.labels.generateLabels(chart);
                return labels.map(l => ({ ...l, fontColor: '#000000' }));
            };
        }

        options.responsive = false;
        options.animation = false;
        options.color = colors.text;

        if (!options.plugins) options.plugins = {};
        if (!options.plugins.title) options.plugins.title = {};
        options.plugins.title.display = true;
        options.plugins.title.text = config.title;
        options.plugins.title.color = colors.text;
        options.plugins.title.font = { family: fontFam, size: Math.round(fontSizeTitle * scaleFactor), weight: 'normal' };

        if (options.plugins.legend && options.plugins.legend.labels) {
            options.plugins.legend.labels.color = colors.text;
            options.plugins.legend.labels.font = { family: fontFam, size: Math.round(fontSizeLegend * scaleFactor), weight: 'normal' };
            options.plugins.legend.labels.padding = Math.round((fontSizeLegend + 3) * scaleFactor);
        }

        if (!options.scales) options.scales = {};
        if (!options.scales.x) options.scales.x = {};
        if (!options.scales.y) options.scales.y = {};

        options.scales.x.ticks = { ...options.scales.x.ticks, color: colors.tick, font: { family: fontFam, size: Math.round(fontSizeAxisTicks * scaleFactor), weight: 'normal' } };
        options.scales.x.grid = { ...options.scales.x.grid, color: colors.grid, lineWidth: Math.max(1, Math.round(1 * scaleFactor)) };
        options.scales.x.title = {
            display: !!customXLabel,
            text: customXLabel,
            color: colors.text,
            font: { family: fontFam, size: Math.round(fontSizeAxisTitle * scaleFactor), weight: 'normal' },
            padding: { top: Math.round(10 * scaleFactor) }
        };

        options.scales.y.ticks = { ...options.scales.y.ticks, color: colors.tick, font: { family: fontFam, size: Math.round(fontSizeAxisTicks * scaleFactor), weight: 'normal' } };
        options.scales.y.grid = { ...options.scales.y.grid, color: colors.grid, lineWidth: Math.max(1, Math.round(1 * scaleFactor)) };
        options.scales.y.title = {
            display: !!customYLabel,
            text: customYLabel,
            color: colors.text,
            font: { family: fontFam, size: Math.round(fontSizeAxisTitle * scaleFactor), weight: 'normal' },
            padding: { bottom: Math.round(10 * scaleFactor) }
        };

        if (scaleFactor !== 1) {
            options.layout = { padding: Math.round(15 * scaleFactor) };
        }

        return {
            type: srcChart.config.type,
            data: { datasets },
            options: options,
            plugins: [whiteCanvasPlugin]
        };
    }

    function updatePreview() {
        if (!activeChartId) return;
        const canvas = document.getElementById('export-preview-canvas');
        const container = document.getElementById('export-preview-container');
        if (!canvas || !container) return;

        container.style.backgroundColor = '#ffffff';

        if (exportChartInstance) {
            exportChartInstance.destroy();
            exportChartInstance = null;
        }

        const chartConfig = buildChartConfig(1);
        if (!chartConfig) return;

        const w = container.clientWidth - 20;
        const aspect = getAspectRatioValue();
        const h = Math.max(220, Math.round(w * aspect));

        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        exportChartInstance = new Chart(ctx, chartConfig);
    }

    function exportPNG4K() {
        const srcChart = chartInstances[activeChartId];
        const config = chartConfigs[activeChartId];
        if (!srcChart || !config) return;

        const targetWidth = 3840; // 4K Resolution
        const aspect = getAspectRatioValue();
        const targetHeight = Math.round(targetWidth * aspect);

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = targetWidth;
        offscreenCanvas.height = targetHeight;

        const scaleFactor = targetWidth / 800;
        const chartConfig = buildChartConfig(scaleFactor);

        const ctx = offscreenCanvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const tempChart = new Chart(ctx, chartConfig);

        const dataURL = offscreenCanvas.toDataURL('image/png', 1.0);
        tempChart.destroy();

        const link = document.createElement('a');
        link.download = `${config.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_4K.png`;
        link.href = dataURL;
        link.click();
    }

    function exportSVG() {
        const srcChart = chartInstances[activeChartId];
        const config = chartConfigs[activeChartId];
        if (!srcChart || !config) return;

        const width = 1200;
        const aspect = getAspectRatioValue();
        const height = Math.round(width * aspect);

        const colors = getThemeColors();
        const fontFam = Chart.defaults.font.family || "sans-serif";

        const svgTitleSize = Math.round(fontSizeTitle * 1.375);
        const svgAxisTitleSize = Math.round(fontSizeAxisTitle * 1.15);
        const svgAxisTickSize = Math.round(fontSizeAxisTicks * 1.1);
        const svgLegendSize = Math.round(fontSizeLegend * 1.15);

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

        // Solid White Background
        svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;

        // Title
        svg += `<text x="${width / 2}" y="40" fill="${colors.text}" font-family="${fontFam}" font-size="${svgTitleSize}" font-weight="normal" text-anchor="middle">${escapeXML(config.title)}</text>`;

        const padLeft = 90;
        const padRight = 40;
        const padTop = 80;
        const padBottom = 80;
        const plotWidth = width - padLeft - padRight;
        const plotHeight = height - padTop - padBottom;

        // Axis Labels
        if (customXLabel) {
            svg += `<text x="${padLeft + plotWidth / 2}" y="${height - 20}" fill="${colors.text}" font-family="${fontFam}" font-size="${svgAxisTitleSize}" font-weight="normal" text-anchor="middle">${escapeXML(customXLabel)}</text>`;
        }
        if (customYLabel) {
            svg += `<text x="25" y="${padTop + plotHeight / 2}" fill="${colors.text}" font-family="${fontFam}" font-size="${svgAxisTitleSize}" font-weight="normal" text-anchor="middle" transform="rotate(-90 25 ${padTop + plotHeight / 2})">${escapeXML(customYLabel)}</text>`;
        }

        const isMatrix = srcChart.config.type === 'matrix';

        if (isMatrix) {
            const matrixData = (srcChart.data.datasets[0] && srcChart.data.datasets[0].data) || [];
            const xLabels = [...new Set(matrixData.map(d => d.x))];
            const yLabels = [...new Set(matrixData.map(d => d.y))];
            const maxVal = Math.max(...matrixData.map(d => d.v || 0), 1);

            const cellW = plotWidth / (xLabels.length || 1);
            const cellH = plotHeight / (yLabels.length || 1);

            xLabels.forEach((label, i) => {
                const px = padLeft + i * cellW + cellW / 2;
                svg += `<text x="${px}" y="${height - padBottom + 20}" fill="${colors.tick}" font-family="${fontFam}" font-size="${svgAxisTickSize}" text-anchor="middle">${escapeXML(String(label))}</text>`;
            });

            yLabels.forEach((label, i) => {
                const py = padTop + i * cellH + cellH / 2;
                svg += `<text x="${padLeft - 10}" y="${py + 4}" fill="${colors.tick}" font-family="${fontFam}" font-size="${svgAxisTickSize}" text-anchor="end">${escapeXML(String(label))}</text>`;
            });

            matrixData.forEach(d => {
                const xi = xLabels.indexOf(d.x);
                const yi = yLabels.indexOf(d.y);
                if (xi !== -1 && yi !== -1) {
                    const rx = padLeft + xi * cellW + 2;
                    const ry = padTop + yi * cellH + 2;
                    const rw = cellW - 4;
                    const rh = cellH - 4;
                    const alpha = 0.15 + 0.85 * (d.v / maxVal);
                    svg += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="rgba(59, 130, 246, ${alpha.toFixed(2)})" stroke="${colors.grid}" stroke-width="1"/>`;
                    svg += `<text x="${rx + rw / 2}" y="${ry + rh / 2 + 5}" fill="${colors.text}" font-family="${fontFam}" font-size="${Math.round(svgAxisTickSize * 1.1)}" text-anchor="middle">${d.v}</text>`;
                }
            });
        } else {
            // Legend in SVG
            if (srcChart.options.plugins && srcChart.options.plugins.legend && srcChart.options.plugins.legend.display !== false) {
                let currentX = padLeft;
                const legendY = padTop - 20;
                srcChart.data.datasets.forEach((ds, idx) => {
                    if (!ds.label) return;
                    const color = customSeriesColors[idx] || ds.borderColor || '#3b82f6';
                    svg += `<rect x="${currentX}" y="${legendY - svgLegendSize + 2}" width="${svgLegendSize}" height="${svgLegendSize}" fill="${color}"/>`;
                    currentX += svgLegendSize + 6;
                    svg += `<text x="${currentX}" y="${legendY}" fill="${colors.text}" font-family="${fontFam}" font-size="${svgLegendSize}">${escapeXML(ds.label)}</text>`;
                    currentX += (ds.label.length * (svgLegendSize * 0.6)) + 20;
                });
            }

            // Find range
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            srcChart.data.datasets.forEach(ds => {
                (ds.data || []).forEach(p => {
                    if (p.x !== undefined && p.y !== undefined) {
                        if (p.x < minX) minX = p.x;
                        if (p.x > maxX) maxX = p.x;
                        if (p.y < minY) minY = p.y;
                        if (p.y > maxY) maxY = p.y;
                    }
                });
            });

            if (!isFinite(minX) || !isFinite(maxX)) { minX = 0; maxX = 1; }
            if (!isFinite(minY) || !isFinite(maxY)) { minY = 0; maxY = 1; }
            if (minX === maxX) maxX = minX + 1;
            if (minY === maxY) maxY = minY + 1;

            const yMargin = (maxY - minY) * 0.05;
            minY -= yMargin;
            maxY += yMargin;

            const isLog = srcChart.options.scales.y && srcChart.options.scales.y.type === 'logarithmic';

            const mapX = (val) => padLeft + ((val - minX) / (maxX - minX)) * plotWidth;
            const mapY = (val) => {
                if (isLog && val > 0 && minY > 0) {
                    const logMin = Math.log10(minY);
                    const logMax = Math.log10(maxY);
                    return padTop + plotHeight - ((Math.log10(val) - logMin) / (logMax - logMin)) * plotHeight;
                }
                return padTop + plotHeight - ((val - minY) / (maxY - minY)) * plotHeight;
            };

            // Grid & Ticks
            for (let i = 0; i <= 5; i++) {
                const ratio = i / 5;
                const yVal = minY + ratio * (maxY - minY);
                const py = mapY(yVal);
                svg += `<line x1="${padLeft}" y1="${py}" x2="${width - padRight}" y2="${py}" stroke="${colors.grid}" stroke-width="1"/>`;
                svg += `<text x="${padLeft - 10}" y="${py + 4}" fill="${colors.tick}" font-family="${fontFam}" font-size="${svgAxisTickSize}" text-anchor="end">${yVal.toFixed(2)}</text>`;

                const xVal = minX + ratio * (maxX - minX);
                const px = mapX(xVal);
                svg += `<line x1="${px}" y1="${padTop}" x2="${px}" y2="${height - padBottom}" stroke="${colors.grid}" stroke-width="1"/>`;
                svg += `<text x="${px}" y="${height - padBottom + 20}" fill="${colors.tick}" font-family="${fontFam}" font-size="${svgAxisTickSize}" text-anchor="middle">${xVal.toFixed(1)}</text>`;
            }

            // Plot Datasets
            srcChart.data.datasets.forEach((ds, idx) => {
                const color = customSeriesColors[idx] || ds.borderColor || '#3b82f6';
                const points = ds.data || [];
                if (points.length === 0) return;

                const strokeDash = ds.borderDash && ds.borderDash.length > 0 ? `stroke-dasharray="${ds.borderDash.join(',')}"` : '';

                let pathD = '';
                points.forEach((p, pIdx) => {
                    if (p.x === undefined || p.y === undefined) return;
                    const px = mapX(p.x);
                    const py = mapY(p.y);
                    pathD += (pIdx === 0 ? 'M' : 'L') + ` ${px.toFixed(2)} ${py.toFixed(2)}`;
                });

                if (pathD) {
                    svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${ds.borderWidth || 2}" ${strokeDash}/>`;
                }
            });
        }

        svg += `</svg>`;

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${config.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }

    function escapeXML(str) {
        return (str || '').replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    return {
        openExportModal
    };
})();
