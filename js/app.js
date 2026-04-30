const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const resultsArea = document.getElementById('results-area');
const dataList = document.getElementById('data-list');
const sliceCountLabel = document.getElementById('slice-count');
const downloadBtn = document.getElementById('download-btn');
const statusText = document.getElementById('status-text');
const statusMeta = document.getElementById('status-meta');
const progressBar = document.getElementById('progress-bar');
const toggleGrid = document.getElementById('toggle-grid');
const toggleSnap = document.getElementById('toggle-snap');
const rectOutputBtn = document.getElementById('rect-output-btn');
const rectInputBtn = document.getElementById('rect-input-btn');
const modeMoveBtn = document.getElementById('mode-move-btn');
const modeRotateBtn = document.getElementById('mode-rotate-btn');
const navBtn = document.getElementById('nav-btn');
const fitBtn = document.getElementById('fit-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const resetRotBtn = document.getElementById('reset-rot-btn');
const drawerToggleBtn = document.getElementById('drawer-toggle-btn');
const drawerBackdrop = document.getElementById('drawer-backdrop');
const sideDrawer = document.getElementById('side-drawer');
const drawerCloseBtn = document.getElementById('drawer-close-btn');
const screenFilter = document.getElementById('screen-filter');
const view3dBtn = document.getElementById('view-3d-btn');
const viewXmlBtn = document.getElementById('view-xml-btn');
const threeContainer = document.getElementById('three-container');
const xmlView = document.getElementById('xml-view');
const xmlCode = document.getElementById('xml-code');
const selCount = document.getElementById('sel-count');
const inspectorNone = document.getElementById('inspector-none');
const inspectorSingle = document.getElementById('inspector-single');
const inspectorMulti = document.getElementById('inspector-multi');
const inspectorName = document.getElementById('inspector-name');
const posxInput = document.getElementById('posx');
const posyInput = document.getElementById('posy');
const poszInput = document.getElementById('posz');
const rotxInput = document.getElementById('rotx');
const rotyInput = document.getElementById('roty');
const rotzInput = document.getElementById('rotz');
const gposxInput = document.getElementById('gposx');
const gposyInput = document.getElementById('gposy');
const gposzInput = document.getElementById('gposz');
const grotxInput = document.getElementById('grotx');
const grotyInput = document.getElementById('groty');
const grotzInput = document.getElementById('grotz');
const runTestsBtn = document.getElementById('run-tests-btn');
const testResults = document.getElementById('test-results');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

let extractedRects = [];
let activeWorker = null;
let currentSourceBaseName = '';
let extractedScreens = [];
let screenStateByName = new Map();
let lastImportedText = '';
let currentViewMode = '3d';
let currentRectMode = 'input';
let selectedNames = new Set();
let primarySelectedName = '';

applyTheme(true);

function applyTheme(isDark) {
    if (isDark) document.body.classList.remove('theme-light');
    else document.body.classList.add('theme-light');
    if (themeToggleBtn) themeToggleBtn.style.display = 'none';
}

function setButtonActive(el, active) {
    if (!el) return;
    el.classList.toggle('ring-2', !!active);
    el.classList.toggle('ring-white', !!active);
    el.classList.toggle('ring-inset', !!active);
}

function setNavUiEnabled(enabled) {
    navBtn.classList.toggle('bg-vj-panel', !!enabled);
    setButtonActive(navBtn, !!enabled);
    window.__VJ_THREE__?.setNavEnabled?.(!!enabled);
    statusText.textContent = enabled ? 'Navegación activada' : 'Navegación desactivada';
    setTimeout(() => { statusText.textContent = 'Listo'; }, 800);
}

navBtn.addEventListener('click', (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const enabled = !navBtn.classList.contains('bg-vj-panel');
    setNavUiEnabled(enabled);
});

window.addEventListener('three-ready', () => {
    window.__VJ_THREE__?.setNavSpeed?.(400);
    window.__VJ_THREE__?.setNavSensitivity?.(0.002);
    window.__VJ_THREE__?.setNavInvert?.({ x: false, y: false });
    setNavUiEnabled(false);
});

function openDrawer() {
    sideDrawer.classList.remove('translate-x-full');
}

function closeDrawer() {
    sideDrawer.classList.add('translate-x-full');
}

function isDrawerOpen() {
    return !sideDrawer.classList.contains('translate-x-full');
}

drawerToggleBtn.addEventListener('click', (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    openDrawer();
});
drawerCloseBtn.addEventListener('click', () => closeDrawer());
window.addEventListener('keydown', (e) => {
    if (e && e.key === 'Escape') closeDrawer();
});

document.addEventListener('pointerdown', (e) => {
    if (!isDrawerOpen()) return;
    const t = e.target;
    if (sideDrawer.contains(t) || drawerToggleBtn.contains(t)) return;
    closeDrawer();
}, { capture: true });

window.addEventListener('keydown', (e) => {
    if (!e) return;
    if ((e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) || e.isComposing) return;
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (isDrawerOpen()) closeDrawer();
        else openDrawer();
        statusText.textContent = isDrawerOpen() ? 'Panel abierto' : 'Panel cerrado';
        setTimeout(() => { statusText.textContent = 'Listo'; }, 800);
    }
    if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const enabled = !navBtn.classList.contains('bg-vj-panel');
        setNavUiEnabled(!enabled);
    }
});

function setViewMode(mode) {
    currentViewMode = mode === 'xml' ? 'xml' : '3d';
    const isXml = currentViewMode === 'xml';
    view3dBtn.classList.toggle('bg-vj-panel', !isXml);
    viewXmlBtn.classList.toggle('bg-vj-panel', isXml);
    setButtonActive(view3dBtn, !isXml);
    setButtonActive(viewXmlBtn, isXml);
    if (isXml) {
        threeContainer.classList.add('hidden');
        xmlView.classList.remove('hidden');
    } else {
        xmlView.classList.add('hidden');
        threeContainer.classList.remove('hidden');
        window.__VJ_THREE__?.resize();
    }
}

view3dBtn.addEventListener('click', () => setViewMode('3d'));
viewXmlBtn.addEventListener('click', () => setViewMode('xml'));
setViewMode('3d');

function setSelectionFrom3D(meta) {
    if (meta && Array.isArray(meta.selectedNames)) {
        selectedNames = new Set(meta.selectedNames);
        primarySelectedName = meta.primary || meta.selectedNames[0] || '';
        return;
    }
    if (meta && typeof meta.name === 'string') {
        selectedNames = new Set([meta.name]);
        primarySelectedName = meta.name;
    }
}

function updateInspector() {
    const list = Array.from(selectedNames);
    selCount.textContent = list.length ? `${list.length} seleccionadas` : '';
    if (!list.length) {
        inspectorNone.classList.remove('hidden');
        inspectorSingle.classList.add('hidden');
        inspectorMulti.classList.add('hidden');
        return;
    }
    if (list.length === 1) {
        inspectorNone.classList.add('hidden');
        inspectorSingle.classList.remove('hidden');
        inspectorMulti.classList.add('hidden');
        const name = primarySelectedName || list[0];
        inspectorName.textContent = name;
        const state = screenStateByName.get(name) || {};
        const loc = state.loc3D || extractedScreens.find(s => s.name === name)?.loc3D || { x: 0, y: 0, z: 0 };
        const rot = state.rot3D || { x: 0, y: 0, z: 0 };
        posxInput.value = String(toCsvNumber(loc.x));
        posyInput.value = String(toCsvNumber(loc.y));
        poszInput.value = String(toCsvNumber(loc.z));
        rotxInput.value = String(toCsvNumber(rot.x));
        rotyInput.value = String(toCsvNumber(rot.y));
        rotzInput.value = String(toCsvNumber(rot.z));
        return;
    }
    inspectorNone.classList.add('hidden');
    inspectorSingle.classList.add('hidden');
    inspectorMulti.classList.remove('hidden');
    const g = window.__VJ_THREE__?.getGroupTransform?.();
    if (g && g.pos) {
        gposxInput.value = String(toCsvNumber(g.pos.x));
        gposyInput.value = String(toCsvNumber(g.pos.y));
        gposzInput.value = String(toCsvNumber(g.pos.z));
    }
    if (g && g.rot) {
        grotxInput.value = String(toCsvNumber(g.rot.x));
        grotyInput.value = String(toCsvNumber(g.rot.y));
        grotzInput.value = String(toCsvNumber(g.rot.z));
    }
}

function applyInspectorTo3D() {
    if (selectedNames.size !== 1) return;
    const name = primarySelectedName || Array.from(selectedNames)[0];
    if (!name) return;
    const pos = {
        x: toCsvNumber(posxInput.value),
        y: toCsvNumber(posyInput.value),
        z: toCsvNumber(poszInput.value)
    };
    const rot = {
        x: toCsvNumber(rotxInput.value),
        y: toCsvNumber(rotyInput.value),
        z: toCsvNumber(rotzInput.value)
    };
    window.__VJ_THREE__?.setObjectTransform(name, { pos, rot });
}

function applyGroupInspectorTo3D() {
    if (selectedNames.size < 2) return;
    const pos = {
        x: toCsvNumber(gposxInput.value),
        y: toCsvNumber(gposyInput.value),
        z: toCsvNumber(gposzInput.value)
    };
    const rot = {
        x: toCsvNumber(grotxInput.value),
        y: toCsvNumber(grotyInput.value),
        z: toCsvNumber(grotzInput.value)
    };
    window.__VJ_THREE__?.setGroupTransform?.({ pos, rot });
}

[posxInput, posyInput, poszInput, rotxInput, rotyInput, rotzInput].forEach(el => {
    el.addEventListener('input', () => applyInspectorTo3D());
});

[gposxInput, gposyInput, gposzInput, grotxInput, grotyInput, grotzInput].forEach(el => {
    el.addEventListener('input', () => applyGroupInspectorTo3D());
});

document.getElementById('inspector-panel').querySelectorAll('button[data-step]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (selectedNames.size !== 1) return;
        const field = btn.getAttribute('data-field') || '';
        const step = toCsvNumber(btn.getAttribute('data-step'));
        const map = {
            posx: posxInput,
            posy: posyInput,
            posz: poszInput,
            rotx: rotxInput,
            roty: rotyInput,
            rotz: rotzInput
        };
        const input = map[field];
        if (!input) return;
        const cur = toCsvNumber(input.value);
        input.value = String(toCsvNumber(cur + step));
        applyInspectorTo3D();
    });
});

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-vj-cyan', 'bg-vj-panel');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-vj-cyan', 'bg-vj-panel');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-vj-cyan', 'bg-vj-panel');
    if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processFile(e.target.files[0]);
});

toggleGrid.addEventListener('change', () => {
    window.__VJ_THREE__?.setGridVisible(!!toggleGrid.checked);
});
toggleSnap.addEventListener('change', () => {
    window.__VJ_THREE__?.setSnapEnabled(!!toggleSnap.checked);
});

rectInputBtn.addEventListener('click', () => setRectModeUi('input'));
modeMoveBtn.addEventListener('click', () => {
    setTransformModeUi('translate');
});
modeRotateBtn.addEventListener('click', () => {
    setTransformModeUi('rotate');
});
fitBtn.addEventListener('click', () => {
    window.__VJ_THREE__?.frameAll();
});
undoBtn.addEventListener('click', (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    window.__VJ_THREE__?.undo();
    updateInspector();
});
redoBtn.addEventListener('click', (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    window.__VJ_THREE__?.redo();
    updateInspector();
});
resetRotBtn.addEventListener('click', () => {
    window.__VJ_THREE__?.resetViewRotation();
});

function updateHistoryButtons(meta) {
    const canUndo = !!(meta && meta.canUndo);
    const canRedo = !!(meta && meta.canRedo);
    undoBtn.disabled = !canUndo;
    redoBtn.disabled = !canRedo;
}

window.addEventListener('historychange', (e) => {
    updateHistoryButtons(e && e.detail ? e.detail : null);
});

window.addEventListener('keydown', (e) => {
    if (!e) return;
    if ((e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) || e.isComposing) return;
    const isCtrl = !!(e.ctrlKey || e.metaKey);
    if (!isCtrl) return;
    const key = String(e.key || '');
    if (key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        window.__VJ_THREE__?.undo();
        updateInspector();
    }
    if (key.toLowerCase() === 'y' || (key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        window.__VJ_THREE__?.redo();
        updateInspector();
    }
});

function setTransformModeUi(mode) {
    const isRotate = mode === 'rotate';
    modeMoveBtn.classList.toggle('bg-vj-panel', !isRotate);
    modeRotateBtn.classList.toggle('bg-vj-panel', isRotate);
    setButtonActive(modeMoveBtn, !isRotate);
    setButtonActive(modeRotateBtn, isRotate);
    window.__VJ_THREE__?.setTransformMode(mode);
}

setTransformModeUi('translate');

function setRectModeUi(mode) {
    const m = mode === 'input' ? 'input' : 'output';
    currentRectMode = m;
    rectOutputBtn.classList.toggle('bg-vj-panel', m === 'output');
    rectInputBtn.classList.toggle('bg-vj-panel', m === 'input');
    setButtonActive(rectOutputBtn, m === 'output');
    setButtonActive(rectInputBtn, m === 'input');
    window.__VJ_THREE__?.setRectMode(m);
    window.__VJ_THREE__?.frameAll();
}

setRectModeUi('input');

runTestsBtn.addEventListener('click', () => {
    const results = runTests();
    testResults.innerHTML = '';
    testResults.classList.remove('hidden');
    const frag = document.createDocumentFragment();
    for (const r of results) {
        const li = document.createElement('li');
        li.className = r.pass ? 'text-emerald-300' : 'text-red-300';
        li.textContent = r.pass ? `OK: ${r.name}` : `FAIL: ${r.name} — ${r.details}`;
        frag.appendChild(li);
    }
    testResults.appendChild(frag);
});

async function processFile(file) {
    if (!file || !file.name) {
        alert('Archivo inválido.');
        return;
    }

    const nameLower = file.name.toLowerCase();
    currentSourceBaseName = file.name.replace(/\.[^.]+$/, '');
    const format = nameLower.endsWith('.xml') ? 'xml' : (nameLower.endsWith('.json') ? 'json' : 'auto');
    if (format === 'auto') {
        alert('Selecciona un archivo .xml o .json válido.');
        return;
    }

    extractedRects = [];
    extractedScreens = [];
    screenStateByName = new Map();
    dataList.innerHTML = '';
    sliceCountLabel.textContent = '';
    statusMeta.textContent = '';
    setProgress(0, 'Leyendo archivo…');
    window.__VJ_THREE__?.setScreens([]);

    const t0 = performance.now();
    let text = '';
    try {
        text = await readFileAsTextLazy(file, (ratio) => setProgress(ratio, 'Leyendo archivo…'));
    } catch (e) {
        setProgress(0, 'Error al leer el archivo');
        alert(`No se pudo leer el archivo: ${e && e.message ? e.message : 'Error desconocido'}`);
        return;
    }
    const readMs = Math.round(performance.now() - t0);
    statusMeta.textContent = `${format.toUpperCase()} · ${(file.size / (1024 * 1024)).toFixed(2)}MB · read ${readMs}ms`;
    lastImportedText = text;
    xmlCode.innerHTML = highlightXml(lastImportedText);

    setProgress(0.05, 'Procesando coordenadas…');
    startWorkerParse({ text, format });
}

async function readFileAsTextLazy(file, onProgress) {
    const chunkSize = 1024 * 1024;
    const decoder = new TextDecoder('utf-8');
    const parts = [];
    let offset = 0;
    while (offset < file.size) {
        const slice = file.slice(offset, Math.min(offset + chunkSize, file.size));
        const buf = await slice.arrayBuffer();
        parts.push(decoder.decode(buf, { stream: true }));
        offset += chunkSize;
        if (onProgress) onProgress(Math.min(1, offset / file.size));
        await new Promise(requestAnimationFrame);
    }
    parts.push(decoder.decode());
    return parts.join('');
}

function startWorkerParse({ text, format }) {
    if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
    }
    activeWorker = createParserWorker();

    const parseStart = performance.now();
    let lastUiUpdate = 0;
    activeWorker.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg || !msg.type) return;
        if (msg.type === 'batch') {
            if (Array.isArray(msg.rects) && msg.rects.length) appendRects(msg.rects);
            const now = performance.now();
            if (now - lastUiUpdate > 60) {
                const ratio = msg.progressRatio ?? 0.1;
                setProgress(Math.min(0.95, 0.05 + ratio * 0.9), 'Procesando coordenadas…');
                lastUiUpdate = now;
            }
        }
        if (msg.type === 'done') {
            const ms = Math.round(performance.now() - parseStart);
            setProgress(1, extractedRects.length ? 'Completado' : 'Sin coordenadas');
            statusMeta.textContent = `${format.toUpperCase()} · rects ${extractedRects.length} · parse ${ms}ms`;
            if (extractedRects.length) {
                showResults();
            } else {
                const maybeHasRects = /<(?:\\s*InputRect|\\s*OutputRect)\\b/i.test(lastImportedText || '');
                if (format === 'xml' && maybeHasRects) {
                    try {
                        const fallbackRects = parseXmlSync(lastImportedText);
                        if (fallbackRects && fallbackRects.length) {
                            appendRects(fallbackRects);
                            showResults();
                            return;
                        }
                    } catch { }
                }
                window.__VJ_THREE__?.setScreens([]);
                alert('No se encontraron inputrect / outputrect en el archivo proporcionado.');
            }
        }
        if (msg.type === 'error') {
            setProgress(0, 'Error al procesar');
            alert(`Error al procesar: ${msg.message || 'Error desconocido'}`);
        }
    };
    activeWorker.onerror = (err) => {
        setProgress(0, 'Error al procesar');
        alert(`Worker error: ${err && err.message ? err.message : 'Error desconocido'}`);
    };

    activeWorker.postMessage({ type: 'parse', text, format });
}

function setProgress(ratio, label) {
    const r = Math.max(0, Math.min(1, ratio));
    progressBar.style.width = `${Math.round(r * 100)}%`;
    statusText.textContent = label || '';
}

function appendRects(rects) {
    for (const r of rects) {
        const nr = normalizeRect(r);
        extractedRects.push(nr);
    }
}

function showResults() {
    resultsArea.classList.remove('hidden');
    extractedScreens = buildScreensFromRects(extractedRects);
    sliceCountLabel.textContent = `${extractedScreens.length} pantallas`;
    selectedNames = new Set();
    primarySelectedName = '';
    renderScreensList(extractedScreens);
    window.__VJ_THREE__?.setProjectKey(currentSourceBaseName || '');
    window.__VJ_THREE__?.setScreens(extractedScreens);
    window.__VJ_THREE__?.setRectMode(currentRectMode);
    window.__VJ_THREE__?.setGridVisible(!!toggleGrid.checked);
    window.__VJ_THREE__?.setSnapEnabled(!!toggleSnap.checked);
    window.__VJ_THREE__?.frameAll();
    updateInspector();
}

function buildScreensFromRects(rects) {
    const groups = new Map();
    for (const r of rects) {
        const basePath = (r.path || '').replace(/\/(inputrect|outputrect)(\/.*)?$/i, '');
        const key = `${r.screen || ''}||${r.sliceUid || r.slice || basePath || ''}`;
        let g = groups.get(key);
        if (!g) {
            g = {
                name: r.slice || basePath || r.sliceUid || 'SinNombre',
                screen: r.screen || '',
                sliceUid: r.sliceUid || '',
                input: null,
                output: null
            };
            groups.set(key, g);
        }
        if (r.type === 'inputrect' && !g.input) g.input = r;
        if (r.type === 'outputrect' && !g.output) g.output = r;
    }

    const out = Array.from(groups.values());
    if (out.length === 1) {
        const only = out[0];
        const isWeakName = !only.name || only.name === 'SinNombre' || String(only.name).includes('/');
        if (isWeakName && currentSourceBaseName) only.name = currentSourceBaseName;
    }

    const screens = [];
    for (const g of out) {
        const inp = g.input;
        const outp = g.output;
        const outputRect = {
            x: toCsvNumber(outp ? outp.x : 0),
            y: toCsvNumber(outp ? outp.y : 0),
            w: toCsvNumber(outp ? outp.w : 0),
            h: toCsvNumber(outp ? outp.h : 0)
        };
        const inputRect = {
            x: toCsvNumber(inp ? inp.x : 0),
            y: toCsvNumber(inp ? inp.y : 0),
            w: toCsvNumber(inp ? inp.w : 0),
            h: toCsvNumber(inp ? inp.h : 0)
        };
        const ancho = outputRect.w || inputRect.w || 0;
        const alto = outputRect.h || inputRect.h || 0;
        const existing = screenStateByName.get(g.name);
        const loc3D = existing && existing.loc3D ? existing.loc3D : { x: 0, y: 0, z: 0 };
        const id = `${g.screen}||${g.name}`;
        screens.push({
            id,
            name: g.name,
            screen: g.screen,
            sliceUid: g.sliceUid,
            ancho,
            alto,
            outputRect,
            inputRect,
            loc3D
        });
    }
    return screens;
}

function renderScreensList(screens) {
    dataList.innerHTML = '';
    const frag = document.createDocumentFragment();
    const filter = (screenFilter && screenFilter.value ? screenFilter.value : '').trim().toLowerCase();
    for (const s of screens) {
        if (filter && !String(s.name || '').toLowerCase().includes(filter)) continue;
        const li = document.createElement('li');
        li.id = `screen-${cssSafeId(s.name)}`;
        li.setAttribute('data-name', s.name);
        const isSelected = selectedNames.has(s.name);
        const isPrimary = primarySelectedName === s.name;
        li.className = `bg-vj-panel2/60 p-2 rounded-lg border border-vj-border cursor-pointer hover:bg-vj-panel2/80 transition-colors ${isSelected ? 'ring-2 ring-vj-magenta' : ''}`;
        const loc = screenStateByName.get(s.name)?.loc3D || s.loc3D || { x: 0, y: 0, z: 0 };
        li.innerHTML = `
            <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <div class="text-sm text-gray-200 truncate font-medium">${escapeHtml(s.name)}</div>
                    <div class="text-xs text-gray-400 font-mono truncate">
                        ${formatNumber(s.ancho)}×${formatNumber(s.alto)} · X ${formatNumber(loc.x)} Y ${formatNumber(loc.y)} Z ${formatNumber(loc.z)}
                    </div>
                </div>
                <button data-focus="${escapeHtmlAttr(s.name)}" class="focus-screen-btn px-2 py-1 rounded-lg border border-vj-border bg-vj-panel hover:bg-vj-panel2 transition-colors text-xs text-white" title="Enfocar">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h3"/><path d="M20 7V4h-3"/><path d="M4 17v3h3"/><path d="M20 17v3h-3"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>
                </button>
            </div>
            <div class="hidden">
                <span id="posx-${cssSafeId(s.name)}">${formatNumber(loc.x)}</span>
                <span id="posy-${cssSafeId(s.name)}">${formatNumber(loc.y)}</span>
                <span id="posz-${cssSafeId(s.name)}">${formatNumber(loc.z)}</span>
            </div>
        `;
        frag.appendChild(li);
    }
    dataList.appendChild(frag);
    dataList.querySelectorAll('li[id^="screen-"]').forEach(li => {
        li.addEventListener('click', (e) => {
            const screenName = li.getAttribute('data-name') || '';
            if (!screenName) return;
            const isCtrl = !!(e && (e.ctrlKey || e.metaKey));
            if (isCtrl) {
                toggleSelection(screenName);
                window.__VJ_THREE__?.select(screenName, { toggle: true });
            } else {
                setSingleSelection(screenName);
                window.__VJ_THREE__?.select(screenName, { replace: true });
                window.__VJ_THREE__?.focus(screenName);
            }
            renderScreensList(extractedScreens);
            updateInspector();
        });
    });
    dataList.querySelectorAll('.focus-screen-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const name = btn.getAttribute('data-focus') || '';
            if (!name) return;
            setSingleSelection(name);
            window.__VJ_THREE__?.select(name, { replace: true });
            window.__VJ_THREE__?.focus(name);
            renderScreensList(extractedScreens);
            updateInspector();
        });
    });
}

function setSingleSelection(name) {
    selectedNames = new Set([name]);
    primarySelectedName = name;
}

function toggleSelection(name) {
    if (selectedNames.has(name)) {
        selectedNames.delete(name);
        if (primarySelectedName === name) primarySelectedName = selectedNames.values().next().value || '';
    } else {
        selectedNames.add(name);
        primarySelectedName = name;
    }
}

function cssSafeId(s) {
    return String(s || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function escapeHtmlAttr(unsafe) {
    return escapeHtml(unsafe).replace(/"/g, '&quot;');
}

window.onScreenMove3D = (name, pos) => {
    if (!name) return;
    const x = toCsvNumber(pos && pos.x);
    const y = toCsvNumber(pos && pos.y);
    const z = toCsvNumber(pos && pos.z);
    const prev = screenStateByName.get(name) || {};
    screenStateByName.set(name, { ...prev, loc3D: { x, y, z } });
    const sx = document.getElementById(`posx-${cssSafeId(name)}`);
    const sy = document.getElementById(`posy-${cssSafeId(name)}`);
    const sz = document.getElementById(`posz-${cssSafeId(name)}`);
    if (sx) sx.textContent = formatNumber(x);
    if (sy) sy.textContent = formatNumber(y);
    if (sz) sz.textContent = formatNumber(z);
    if (selectedNames.size === 1 && (primarySelectedName === name || selectedNames.has(name))) updateInspector();
};

window.onScreenRotate3D = (name, rotDeg) => {
    if (!name) return;
    const x = toCsvNumber(rotDeg && rotDeg.x);
    const y = toCsvNumber(rotDeg && rotDeg.y);
    const z = toCsvNumber(rotDeg && rotDeg.z);
    const prev = screenStateByName.get(name) || {};
    screenStateByName.set(name, { ...prev, rot3D: { x, y, z } });
    if (selectedNames.size === 1 && (primarySelectedName === name || selectedNames.has(name))) updateInspector();
};

window.onScreenSelect3D = (name, meta) => {
    if (!name) return;
    setSelectionFrom3D({ ...meta, name });
    if (!meta || !Array.isArray(meta.selectedNames)) {
        const isToggle = !!(meta && meta.toggle);
        if (isToggle) toggleSelection(name);
        else setSingleSelection(name);
    }
    renderScreensList(extractedScreens);
    updateInspector();
};

if (screenFilter) {
    screenFilter.addEventListener('input', () => {
        renderScreensList(extractedScreens);
    });
}

downloadBtn.addEventListener('click', (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (!extractedScreens.length) return;

    let canvasW = 1920, canvasH = 1080;
    const canvasMatch = lastImportedText.match(/<CurrentCompositionTextureSize\s+width=["']?(\d+)["']?\s+height=["']?(\d+)["']?/i);
    if (canvasMatch) {
        canvasW = Number(canvasMatch[1]);
        canvasH = Number(canvasMatch[2]);
    }

    const ndiCache = new Map();
    const screenRegex = /<Screen\s+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Screen>/gi;
    let sm;
    while ((sm = screenRegex.exec(lastImportedText)) !== null) {
        const screenName = sm[1];
        const screenContent = sm[2];
        const devMatchStr = screenContent.match(/<OutputDevice[A-Za-z]+([^>]+)>/i);
        if (devMatchStr) {
            const wMatch = devMatchStr[1].match(/\bwidth=["'](\d+)["']/i);
            const hMatch = devMatchStr[1].match(/\bheight=["'](\d+)["']/i);
            if (wMatch && hMatch) {
                ndiCache.set(screenName, { w: Number(wMatch[1]), h: Number(hMatch[1]) });
            }
        }
    }

    let csvContent = "---,Screen,Out_W,Out_H,Out_X,Out_Y,NDI_W,NDI_H,Canvas_W,Canvas_H,In_X,In_Y,In_W,In_H,Loc3D_X,Loc3D_Y,Loc3D_Z,Rot_P,Rot_Y,Rot_R,ID_Interno,Mapping_Mode\n";
    for (const s of extractedScreens) {
        const state = screenStateByName.get(s.name) || {};
        const loc = state.loc3D || s.loc3D || { x: 0, y: 0, z: 0 };
        const unrealX = toCsvNumber(loc.x);
        const unrealY = toCsvNumber(loc.z);
        const unrealZ = toCsvNumber(loc.y);
        const rot = state.rot3D || { x: 0, y: 0, z: 0 };
        const rotP = toCsvNumber(rot.z);
        const rotY = toCsvNumber(rot.y);
        const rotR = toCsvNumber(rot.x);
        
        const ndi = ndiCache.get(s.screen) || { w: canvasW, h: canvasH };
        const idInterno = s.sliceUid || '0';

        const row = [
            escapeCSV(s.name),
            escapeCSV(s.screen),
            toCsvNumber(s.outputRect?.w ?? 0),
            toCsvNumber(s.outputRect?.h ?? 0),
            toCsvNumber(s.outputRect?.x ?? 0),
            toCsvNumber(s.outputRect?.y ?? 0),
            toCsvNumber(ndi.w),
            toCsvNumber(ndi.h),
            toCsvNumber(canvasW),
            toCsvNumber(canvasH),
            toCsvNumber(s.inputRect?.x ?? 0),
            toCsvNumber(s.inputRect?.y ?? 0),
            toCsvNumber(s.inputRect?.w ?? 0),
            toCsvNumber(s.inputRect?.h ?? 0),
            unrealX,
            unrealY,
            unrealZ,
            rotP,
            rotY,
            rotR,
            idInterno,
            "Plano"
        ];
        csvContent += row.join(",") + "\n";
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${currentSourceBaseName || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

function toCsvNumber(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    const r = Math.round(v * 1000) / 1000;
    if (Object.is(r, -0)) return 0;
    return r;
}

function formatNumber(n) {
    if (!Number.isFinite(n)) return 'NaN';
    const rounded = Math.round(n * 1000) / 1000;
    return String(rounded);
}

function normalizeRect(r) {
    const x0 = Number(r.x);
    const y0 = Number(r.y);
    const w0 = Number(r.w);
    const h0 = Number(r.h);
    let x = x0, y = y0, w = w0, h = h0;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
        x = Number.isFinite(x) ? x : 0;
        y = Number.isFinite(y) ? y : 0;
        w = Number.isFinite(w) ? w : 0;
        h = Number.isFinite(h) ? h : 0;
    }
    if (w < 0) {
        x = x + w;
        w = Math.abs(w);
    }
    if (h < 0) {
        y = y + h;
        h = Math.abs(h);
    }
    return {
        type: r.type === 'outputrect' ? 'outputrect' : 'inputrect',
        x,
        y,
        w,
        h,
        screen: r.screen || '',
        slice: r.slice || '',
        sliceUid: r.sliceUid || '',
        path: r.path || ''
    };
}

function computeGlobalBounds(rects) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of rects) {
        const x1 = r.x;
        const y1 = r.y;
        const x2 = r.x + r.w;
        const y2 = r.y + r.h;
        if (x1 < minX) minX = x1;
        if (y1 < minY) minY = y1;
        if (x2 > maxX) maxX = x2;
        if (y2 > maxY) maxY = y2;
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
    const w = Math.max(1e-9, maxX - minX);
    const h = Math.max(1e-9, maxY - minY);
    return { minX, minY, maxX, maxY, w, h };
}

function computeTransform(bounds, canvasW, canvasH, fillRatio) {
    const safeFill = Math.max(0.05, Math.min(0.98, fillRatio || 0.9));
    const scale = Math.min((canvasW * safeFill) / bounds.w, (canvasH * safeFill) / bounds.h);
    const offsetX = (canvasW - bounds.w * scale) / 2 - bounds.minX * scale;
    const offsetY = (canvasH - bounds.h * scale) / 2 - bounds.minY * scale;
    return { scale, offsetX, offsetY };
}

function escapeCSV(val) {
    if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
}

function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function highlightXml(text) {
    const src = escapeHtml(text || '');
    const tagRe = /(&lt;\/?)([A-Za-z0-9:_-]+)([^&]*?)(\/?&gt;)/g;
    const attrRe = /([A-Za-z0-9:_-]+)=(&quot;[^&]*?&quot;)/g;
    return src
        .replace(tagRe, (m, p1, name, attrs, p2) => {
            const attrsOut = (attrs || '').replace(attrRe, (mm, k, v) => {
                return `<span class="text-vj-cyan">${k}</span>=<span class="text-vj-magenta">${v}</span>`;
            });
            return `<span class="text-gray-500">${p1}</span><span class="text-vj-neonBlue">${name}</span>${attrsOut}<span class="text-gray-500">${p2}</span>`;
        });
}

window.onInvalidTransform = (msg) => {
    statusText.textContent = msg || 'Transformación inválida';
    setTimeout(() => {
        statusText.textContent = 'Listo';
    }, 2000);
};

window.addEventListener('resize', () => {
    window.__VJ_THREE__?.resize();
});

function createParserWorker() {
    const workerSource = `
        const toLower = (s) => (typeof s === 'string' ? s.toLowerCase() : '');

        function normalizeRect(r) {
            const x0 = Number(r.x);
            const y0 = Number(r.y);
            const w0 = Number(r.w);
            const h0 = Number(r.h);
            let x = x0, y = y0, w = w0, h = h0;
            if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
                x = Number.isFinite(x) ? x : 0;
                y = Number.isFinite(y) ? y : 0;
                w = Number.isFinite(w) ? w : 0;
                h = Number.isFinite(h) ? h : 0;
            }
            if (w < 0) { x = x + w; w = Math.abs(w); }
            if (h < 0) { y = y + h; h = Math.abs(h); }
            return {
                type: r.type === 'outputrect' ? 'outputrect' : 'inputrect',
                x, y, w, h,
                screen: r.screen || '',
                slice: r.slice || '',
                sliceUid: r.sliceUid || '',
                path: r.path || ''
            };
        }

        function boundsFromPoints(points) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of points) {
                if (!p) continue;
                const x = Number(p.x);
                const y = Number(p.y);
                if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
            if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
            return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        }

        function extractRectFromXmlElement(el) {
            const verts = el.querySelectorAll ? el.querySelectorAll('v') : [];
            if (verts && verts.length) {
                const pts = [];
                for (const v of verts) pts.push({ x: v.getAttribute('x'), y: v.getAttribute('y') });
                const b = boundsFromPoints(pts);
                if (b) return b;
            }

            const attrCandidates = [
                ['x', 'y', 'w', 'h'],
                ['x', 'y', 'width', 'height'],
                ['left', 'top', 'width', 'height']
            ];
            for (const [ax, ay, aw, ah] of attrCandidates) {
                const x = el.getAttribute ? el.getAttribute(ax) : null;
                const y = el.getAttribute ? el.getAttribute(ay) : null;
                const w = el.getAttribute ? el.getAttribute(aw) : null;
                const h = el.getAttribute ? el.getAttribute(ah) : null;
                if (x != null && y != null && w != null && h != null) return { x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
            }

            const childText = (tag) => {
                const n = el.querySelector ? el.querySelector(tag) : null;
                return n && n.textContent != null ? n.textContent : null;
            };
            const cx = childText('x') ?? childText('X');
            const cy = childText('y') ?? childText('Y');
            const cw = childText('w') ?? childText('W') ?? childText('width') ?? childText('Width');
            const ch = childText('h') ?? childText('H') ?? childText('height') ?? childText('Height');
            if (cx != null && cy != null && cw != null && ch != null) return { x: Number(cx), y: Number(cy), w: Number(cw), h: Number(ch) };
            return null;
        }

        function parseXml(text, emitBatch) {
            const batch = [];
            const FLUSH_EVERY = 250;

            const parseAttrs = (s) => {
                const m = Object.create(null);
                if (!s) return m;
                const re = /([A-Za-z0-9:_-]+)\\s*=\\s*(['\\"])\\s*([^'\\"]*)\\2/g;
                let mm;
                while ((mm = re.exec(s))) {
                    m[toLower(mm[1])] = mm[3];
                }
                return m;
            };

            const rectFromAttrs = (attrs) => {
                const x = attrs.x ?? attrs.left;
                const y = attrs.y ?? attrs.top;
                const w = attrs.w ?? attrs.width;
                const h = attrs.h ?? attrs.height;
                if (x == null || y == null || w == null || h == null) return null;
                return { x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
            };

            const boundsFromVTags = (inner) => {
                const re = /<\\s*v\\b([^>]*)>/gi;
                let mm;
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                let count = 0;
                while ((mm = re.exec(inner))) {
                    const attrs = parseAttrs(mm[1]);
                    const x = Number(attrs.x);
                    const y = Number(attrs.y);
                    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
                    count++;
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
                if (!count) return null;
                return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
            };

            const tagRe = /<\\s*(\\/)?\\s*([A-Za-z0-9:_-]+)([^>]*?)(\\/?)\\s*>/g;
            const stack = [{ tag: '#root', screen: '', slice: '', path: '', paramsCommon: false, rectType: '', rectStart: -1, rectAttrs: null }];
            let lastEmitAt = 0;
            let mm;

            while ((mm = tagRe.exec(text))) {
                const isClose = !!mm[1];
                const rawTag = mm[2] || '';
                const tag = toLower(rawTag);
                const rawAttrs = mm[3] || '';
                const isSelfClose = !!mm[4];
                const tagStart = mm.index;
                const tagEnd = tagRe.lastIndex;

                if (!isClose) {
                    const parent = stack[stack.length - 1] || stack[0];
                    const attrs = parseAttrs(rawAttrs);
                    let screen = parent.screen;
                    let slice = parent.slice;
                    let paramsCommon = parent.paramsCommon;
                    let sliceUid = parent.sliceUid || '';

                    if (tag === 'screen') {
                        const n = attrs.name;
                        if (n) screen = String(n);
                    }
                    if (tag === 'slice') {
                        slice = '';
                        sliceUid = attrs.uniqueid ? String(attrs.uniqueid) : '';
                        const n = attrs.name;
                        if (n) slice = String(n);
                    }
                    if (tag === 'params') {
                        paramsCommon = toLower(attrs.name || '') === 'common';
                    }
                    if (tag === 'param' && parent.paramsCommon) {
                        const pn = toLower(attrs.name || '');
                        if (pn === 'name') {
                            const v = attrs.value;
                            if (v) {
                                slice = String(v);
                                for (let i = stack.length - 1; i >= 0; i--) {
                                    if (stack[i].tag === 'slice') {
                                        stack[i].slice = slice;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    const path = parent.path ? (parent.path + '/' + tag) : tag;
                    const item = {
                        tag,
                        screen,
                        slice,
                        path,
                        paramsCommon,
                        sliceUid,
                        rectType: (tag === 'inputrect' || tag === 'outputrect') ? tag : '',
                        rectStart: (tag === 'inputrect' || tag === 'outputrect') ? tagEnd : -1,
                        rectAttrs: (tag === 'inputrect' || tag === 'outputrect') ? attrs : null
                    };
                    stack.push(item);

                    if (isSelfClose) {
                        if (item.rectType) {
                            const b = rectFromAttrs(item.rectAttrs);
                            if (b) batch.push(normalizeRect({ type: item.rectType, x: b.x, y: b.y, w: b.w, h: b.h, screen: item.screen, slice: item.slice, sliceUid: item.sliceUid, path: item.path }));
                        }
                        stack.pop();
                    }
                } else {
                    let foundIndex = -1;
                    for (let i = stack.length - 1; i >= 0; i--) {
                        if (stack[i].tag === tag) { foundIndex = i; break; }
                    }
                    if (foundIndex === -1) continue;
                    const closing = stack[foundIndex];
                    stack.length = foundIndex;

                    if (closing.rectType && closing.rectStart >= 0) {
                        const inner = text.slice(closing.rectStart, tagStart);
                        let b = boundsFromVTags(inner);
                        if (!b) b = rectFromAttrs(closing.rectAttrs || Object.create(null));
                        if (b) batch.push(normalizeRect({ type: closing.rectType, x: b.x, y: b.y, w: b.w, h: b.h, screen: closing.screen, slice: closing.slice, sliceUid: closing.sliceUid, path: closing.path }));
                    }
                }

                if (batch.length >= FLUSH_EVERY) {
                    emitBatch(batch.splice(0, batch.length), tagEnd / Math.max(1, text.length));
                    lastEmitAt = tagEnd;
                } else if (tagEnd - lastEmitAt > 800000) {
                    emitBatch([], tagEnd / Math.max(1, text.length));
                    lastEmitAt = tagEnd;
                }
            }

            if (batch.length) emitBatch(batch.splice(0, batch.length), 1);
        }

        function extractRectFromObject(obj) {
            if (!obj || typeof obj !== 'object') return null;
            const get = (k) => obj[k] ?? obj[k.toLowerCase()] ?? obj[k.toUpperCase()];
            const vx = get('x');
            const vy = get('y');
            const vw = get('w') ?? get('width');
            const vh = get('h') ?? get('height');
            if (vx != null && vy != null && vw != null && vh != null) return { x: Number(vx), y: Number(vy), w: Number(vw), h: Number(vh) };

            const verts = get('v') ?? get('verts') ?? get('vertices') ?? get('points');
            if (Array.isArray(verts) && verts.length) {
                const b = boundsFromPoints(verts);
                if (b) return b;
            }
            return null;
        }

        function parseJson(text, emitBatch) {
            const root = JSON.parse(text);
            const stack = [{ value: root, screen: '', slice: '', path: '$' }];
            const batch = [];
            let processed = 0;
            const FLUSH_EVERY = 250;
            const YIELD_EVERY = 5000;
            while (stack.length) {
                const cur = stack.pop();
                const value = cur.value;
                if (!value || typeof value !== 'object') continue;
                processed++;

                let screen = cur.screen;
                let slice = cur.slice;

                if (!Array.isArray(value)) {
                    const sn = value.screen ?? value.Screen ?? value.name ?? value.Name;
                    if (typeof sn === 'string' && sn.length && toLower(cur.path).includes('screen')) screen = sn;
                    const sl = value.slice ?? value.Slice ?? value.name ?? value.Name;
                    if (typeof sl === 'string' && sl.length && toLower(cur.path).includes('slice')) slice = sl;
                }

                if (Array.isArray(value)) {
                    for (let i = value.length - 1; i >= 0; i--) stack.push({ value: value[i], screen, slice, path: cur.path + '[' + i + ']' });
                } else {
                    for (const key of Object.keys(value)) {
                        const kLower = toLower(key);
                        const v = value[key];
                        const nextPath = cur.path + '.' + kLower;
                        if (kLower === 'inputrect' || kLower === 'outputrect') {
                            const b = extractRectFromObject(v);
                            if (b) batch.push(normalizeRect({ type: kLower, x: b.x, y: b.y, w: b.w, h: b.h, screen, slice, path: nextPath }));
                            if (batch.length >= FLUSH_EVERY) emitBatch(batch.splice(0, batch.length), 0.25);
                        }
                        if (v && typeof v === 'object') stack.push({ value: v, screen, slice, path: nextPath });
                    }
                }

                if (processed % YIELD_EVERY === 0) emitBatch(batch.splice(0, batch.length), 0.5);
            }
            if (batch.length) emitBatch(batch.splice(0, batch.length), 1);
        }

        function sniffFormat(text, declared) {
            if (declared && declared !== 'auto') return declared;
            const t = String(text || '').trim();
            if (!t) return 'auto';
            if (t.startsWith('<')) return 'xml';
            if (t.startsWith('{') || t.startsWith('[')) return 'json';
            return 'auto';
        }

        self.onmessage = (ev) => {
            const msg = ev.data || {};
            if (msg.type !== 'parse') return;
            const text = msg.text || '';
            const format = sniffFormat(text, msg.format || 'auto');
            try {
                const emitBatch = (rects, progressRatio) => {
                    self.postMessage({ type: 'batch', rects: rects || [], progressRatio });
                };
                if (format === 'xml') parseXml(text, emitBatch);
                else if (format === 'json') parseJson(text, emitBatch);
                else throw new Error('Formato no reconocido');
                self.postMessage({ type: 'done' });
            } catch (e) {
                self.postMessage({ type: 'error', message: e && e.message ? e.message : 'Error desconocido' });
            }
        };
    `;

    const blob = new Blob([workerSource], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    return new Worker(url);
}

function runTests() {
    const results = [];
    const assert = (name, cond, details) => results.push({ name, pass: !!cond, details: cond ? '' : (details || '') });

    const xml1 = `
        <Root>
            <Screen name="Main">
                <Slice>
                    <Params name="Common">
                        <Param name="Name" value="A"/>
                    </Params>
                    <InputRect>
                        <v x="-10" y="0"/><v x="10" y="0"/><v x="10" y="20"/><v x="-10" y="20"/>
                    </InputRect>
                    <OutputRect>
                        <v x="100" y="200"/><v x="300" y="200"/><v x="300" y="260"/><v x="100" y="260"/>
                    </OutputRect>
                </Slice>
            </Screen>
        </Root>
    `;

    const xmlParsed = parseXmlSync(xml1);
    assert('XML: detecta 2 rects (input/output)', xmlParsed.length === 2, `esperado 2, obtenido ${xmlParsed.length}`);
    const xmlIn = xmlParsed.find(r => r.type === 'inputrect');
    const xmlOut = xmlParsed.find(r => r.type === 'outputrect');
    assert('XML: bounds inputrect (negativas)', xmlIn && xmlIn.x === -10 && xmlIn.y === 0 && xmlIn.w === 20 && xmlIn.h === 20, JSON.stringify(xmlIn || {}));
    assert('XML: bounds outputrect', xmlOut && xmlOut.x === 100 && xmlOut.y === 200 && xmlOut.w === 200 && xmlOut.h === 60, JSON.stringify(xmlOut || {}));

    const json1 = JSON.stringify({
        screens: [
            {
                name: "S1",
                slices: [
                    { name: "X", inputrect: { x: -5000, y: -5000, w: 100, h: 100 }, outputrect: { x: 20000, y: 15000, w: 10, h: 10 } }
                ]
            }
        ]
    });
    const jsonParsed = parseJsonSync(json1);
    assert('JSON: detecta 2 rects (input/output)', jsonParsed.length === 2, `esperado 2, obtenido ${jsonParsed.length}`);

    const bounds = computeGlobalBounds(jsonParsed.map(normalizeRect));
    const tf = computeTransform(bounds, 1000, 500, 0.9);
    const corners = [];
    for (const r of jsonParsed.map(normalizeRect)) corners.push([r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]);
    const marginX = 1000 * 0.05 + 1;
    const marginY = 500 * 0.05 + 1;
    let inside = true;
    for (const [x, y] of corners) {
        const cx = x * tf.scale + tf.offsetX;
        const cy = y * tf.scale + tf.offsetY;
        if (cx < marginX || cx > 1000 - marginX || cy < marginY || cy > 500 - marginY) {
            inside = false;
            break;
        }
    }
    assert('Auto-escalado: ocupa ~90% y centra (extremos)', inside, inside ? '' : 'puntos fuera del área útil');

    const badXml = '<Root><Unclosed></Root>';
    let badXmlOk = false;
    try { parseXmlSync(badXml); } catch { badXmlOk = true; }
    assert('Validación: XML inválido se rechaza', badXmlOk, 'no lanzó error');

    const badJson = '{"a":}';
    let badJsonOk = false;
    try { parseJsonSync(badJson); } catch { badJsonOk = true; }
    assert('Validación: JSON inválido se rechaza', badJsonOk, 'no lanzó error');

    return results;
}

function parseXmlSync(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error('XML inválido');
    const rects = [];
    const root = doc.documentElement;
    const stack = [{ node: root, screen: '', slice: '', path: root ? root.tagName.toLowerCase() : '' }];
    while (stack.length) {
        const cur = stack.pop();
        const node = cur.node;
        if (!node || node.nodeType !== 1) continue;
        const tag = (node.tagName || '').toLowerCase();
        let screen = cur.screen;
        let slice = cur.slice;
        const path = cur.path || tag;
        if (tag === 'screen') {
            const n = node.getAttribute('name') || node.getAttribute('Name') || '';
            if (n) screen = n;
        }
        if (tag === 'slice') {
            let sn = '';
            const maybeParams = node.querySelector('Params[name="Common"] Param[name="Name"]');
            if (maybeParams) sn = maybeParams.getAttribute('value') || '';
            if (!sn) sn = node.getAttribute('name') || node.getAttribute('Name') || '';
            if (sn) slice = sn;
        }
        if (tag === 'inputrect' || tag === 'outputrect') {
            const b = extractRectFromXmlElSync(node);
            if (b) rects.push(normalizeRect({ type: tag, ...b, screen, slice, path }));
        }
        const children = node.children || [];
        for (let i = children.length - 1; i >= 0; i--) {
            const ch = children[i];
            const chTag = (ch.tagName || '').toLowerCase();
            stack.push({ node: ch, screen, slice, path: path ? (path + '/' + chTag) : chTag });
        }
    }
    return rects;
}

function extractRectFromXmlElSync(el) {
    const verts = el.querySelectorAll('v');
    if (verts && verts.length) {
        const pts = Array.from(verts).map(v => ({ x: v.getAttribute('x'), y: v.getAttribute('y') }));
        const b = boundsFromPointsSync(pts);
        if (b) return b;
    }
    const x = el.getAttribute('x');
    const y = el.getAttribute('y');
    const w = el.getAttribute('w') ?? el.getAttribute('width');
    const h = el.getAttribute('h') ?? el.getAttribute('height');
    if (x != null && y != null && w != null && h != null) return { x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
    return null;
}

function boundsFromPointsSync(points) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
        const x = Number(p.x);
        const y = Number(p.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function parseJsonSync(text) {
    const root = JSON.parse(text);
    const rects = [];
    const stack = [{ value: root, screen: '', slice: '', path: '$' }];
    while (stack.length) {
        const cur = stack.pop();
        const value = cur.value;
        if (!value || typeof value !== 'object') continue;
        let screen = cur.screen;
        let slice = cur.slice;
        if (!Array.isArray(value)) {
            const sn = value.screen ?? value.Screen ?? value.name ?? value.Name;
            if (typeof sn === 'string' && sn.length && cur.path.toLowerCase().includes('screen')) screen = sn;
            const sl = value.slice ?? value.Slice ?? value.name ?? value.Name;
            if (typeof sl === 'string' && sl.length && cur.path.toLowerCase().includes('slice')) slice = sl;
        }
        if (Array.isArray(value)) {
            for (let i = value.length - 1; i >= 0; i--) stack.push({ value: value[i], screen, slice, path: cur.path + '[' + i + ']' });
        } else {
            for (const key of Object.keys(value)) {
                const k = key.toLowerCase();
                const v = value[key];
                const nextPath = cur.path + '.' + k;
                if (k === 'inputrect' || k === 'outputrect') {
                    const b = extractRectFromObjectSync(v);
                    if (b) rects.push(normalizeRect({ type: k, ...b, screen, slice, path: nextPath }));
                }
                if (v && typeof v === 'object') stack.push({ value: v, screen, slice, path: nextPath });
            }
        }
    }
    return rects;
}

function extractRectFromObjectSync(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const x = obj.x ?? obj.X;
    const y = obj.y ?? obj.Y;
    const w = obj.w ?? obj.W ?? obj.width ?? obj.Width;
    const h = obj.h ?? obj.H ?? obj.height ?? obj.Height;
    if (x != null && y != null && w != null && h != null) return { x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
    const verts = obj.v ?? obj.verts ?? obj.vertices ?? obj.points;
    if (Array.isArray(verts)) {
        const b = boundsFromPointsSync(verts);
        if (b) return b;
    }
    return null;
}

/**
 * Ejecuta pruebas unitarias simples (sin dependencias) para utilidades y wiring básico.
 * @returns {{pass: boolean, name: string, details?: string}[]}
 */
window.runUnitTests = () => {
    const results = [];
    const assert = (name, cond, details) => results.push({ name, pass: !!cond, details: cond ? '' : (details || '') });
    assert('toCsvNumber: -0 -> 0', String(toCsvNumber(-0)) === '0', String(toCsvNumber(-0)));
    assert('cssSafeId: sanitiza', cssSafeId('A B/C') === 'A_B_C', cssSafeId('A B/C'));
    const highlighted = highlightXml('<Root a="1"></Root>');
    assert('highlightXml: contiene spans', highlighted.includes('text-vj-neonBlue'), highlighted.slice(0, 80));
    const api = window.__VJ_THREE__;
    if (api && typeof api.canUndo === 'function' && typeof api.canRedo === 'function') {
        assert('Historial: canUndo/canRedo existen', true);
    } else {
        assert('Historial: API disponible', false, 'window.__VJ_THREE__ no disponible');
    }
    return results;
};
