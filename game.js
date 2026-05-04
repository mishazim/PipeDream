// game.js — state machine, event wiring, and game loop

let graph          = null;
let currentLevelId = null;
let maxFlowAnswer  = null;
let sliderEls      = [];   // <div class="slider-wrap"> elements
let animFrameId    = null;

// ── Level launch ──────────────────────────────────────────────────────────────

function launchLevel(id) {
    const levelData = LEVELS.find(l => l.id === id);
    if (!levelData) return;

    currentLevelId = id;

    // Build flow graph and compute the true max-flow upfront
    graph = new FlowGraph(levelData);
    maxFlowAnswer = graph.computeMaxFlow();

    // Wire "Next Level" button
    const btnNext = document.getElementById('btn-next-level');
    btnNext.textContent = id < LEVELS.length ? 'Next Level →' : 'Main Menu';
    btnNext.onclick = () => {
        hideWinOverlay();
        if (id < LEVELS.length) launchLevel(id + 1);
        else showScreen('menu');
    };

    // Update top bar
    document.getElementById('game-level-label').textContent =
        `Level ${id} — ${levelData.name}`;

    hideWinOverlay();
    showScreen('game');

    // Slight delay so the screen transition finishes before sizing canvas
    requestAnimationFrame(() => {
        setupCanvas();
        createSliders(levelData);
        updateFlowDisplay();
        initDrops();
        startLoop(levelData);
    });
}

// ── Canvas setup ──────────────────────────────────────────────────────────────

function setupCanvas() {
    const wrap   = document.getElementById('game-canvas-wrap');
    const canvas = document.getElementById('game-canvas');
    canvas.width  = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
}

// ── Slider management ─────────────────────────────────────────────────────────

function createSliders(levelData) {
    removeSliders();
    const canvas = document.getElementById('game-canvas');
    const wrap   = document.getElementById('game-canvas-wrap');
    const mids   = getEdgeMidpoints(canvas, levelData);

    for (const edge of graph.edges) {
        const mid = mids.find(m => m.edgeId === edge.id);
        if (!mid) continue;

        const offY = (edge.sliderOffsetY || 0) * (canvas.height / LOGI_H);
        const offX = (edge.sliderOffsetX || 0) * (canvas.width  / LOGI_W);

        const div = document.createElement('div');
        div.className = 'slider-wrap';
        div.style.left = `${mid.mx + offX}px`;
        div.style.top  = `${mid.my + offY}px`;

        const lbl = document.createElement('div');
        lbl.className = 'slider-label';
        lbl.textContent = `${edge.flow}/${edge.cap}`;

        const slider = document.createElement('input');
        slider.type  = 'range';
        slider.min   = 0;
        slider.max   = edge.cap;
        slider.value = edge.flow;
        slider.className = 'pipe-slider';

        // Tint the slider track to reflect fill ratio
        const updateTrack = (val) => {
            const pct = edge.cap > 0 ? (val / edge.cap) * 100 : 0;
            slider.style.background =
                `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${pct}%, rgba(255,255,255,0.2) ${pct}%, rgba(255,255,255,0.2) 100%)`;
        };

        slider.addEventListener('input', () => {
            const val = parseInt(slider.value);
            graph.setFlow(edge.id, val);
            lbl.textContent = `${val}/${edge.cap}`;
            updateTrack(val);
            updateFlowDisplay();
        });

        updateTrack(edge.flow);
        div.appendChild(lbl);
        div.appendChild(slider);
        wrap.appendChild(div);
        sliderEls.push(div);
    }
}

function removeSliders() {
    sliderEls.forEach(el => el.remove());
    sliderEls = [];
}

function repositionSliders(levelData) {
    const canvas = document.getElementById('game-canvas');
    const mids   = getEdgeMidpoints(canvas, levelData);
    sliderEls.forEach((div, i) => {
        const edge = graph.edges[i];
        const mid  = mids.find(m => m.edgeId === edge?.id);
        if (!mid) return;
        const offY = (edge.sliderOffsetY || 0) * (canvas.height / LOGI_H);
        const offX = (edge.sliderOffsetX || 0) * (canvas.width  / LOGI_W);
        div.style.left = `${mid.mx + offX}px`;
        div.style.top  = `${mid.my + offY}px`;
    });
}

// ── Animation loop ────────────────────────────────────────────────────────────

function startLoop(levelData) {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    const canvas = document.getElementById('game-canvas');
    const tick = (ts) => {
        renderFrame(canvas, graph, levelData, ts);
        animFrameId = requestAnimationFrame(tick);
    };
    animFrameId = requestAnimationFrame(tick);
}

function stopLoop() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
}

// ── HUD updates ───────────────────────────────────────────────────────────────

function updateFlowDisplay() {
    if (!graph) return;
    const flow = graph.totalFlow();
    document.getElementById('flow-display').textContent = flow;
    // Keep max hidden until solved
    document.getElementById('max-display').textContent = '?';
}

function revealMaxFlow() {
    document.getElementById('max-display').textContent = maxFlowAnswer;
}

// ── Check-flow logic ──────────────────────────────────────────────────────────

function checkFlow() {
    if (!graph) return;

    if (!graph.allConserved()) {
        showToast('⚠️ Some nodes are imbalanced! Flow in must equal flow out.');
        return;
    }

    const flow = graph.totalFlow();

    if (flow < maxFlowAnswer) {
        showToast(`💧 Flow is balanced at ${flow}, but you can push more!`);
        revealMaxFlow();
        return;
    }

    // Player found the max flow
    revealMaxFlow();
    markLevelComplete(currentLevelId);
    showWinOverlay(flow);
}

// ── Win overlay ───────────────────────────────────────────────────────────────

function showWinOverlay(flow) {
    const overlay  = document.getElementById('win-overlay');
    const subtitle = document.getElementById('win-subtitle');
    subtitle.textContent = `Maximum flow of ${flow} — perfect! 🌊`;
    overlay.classList.add('show');
}

function hideWinOverlay() {
    document.getElementById('win-overlay').classList.remove('show');
}

// ── Persistence ───────────────────────────────────────────────────────────────

function markLevelComplete(id) {
    const completed = JSON.parse(localStorage.getItem('pipedream-completed') || '[]');
    if (!completed.includes(id)) {
        completed.push(id);
        localStorage.setItem('pipedream-completed', JSON.stringify(completed));
    }
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2700);
}

// ── Button event listeners ────────────────────────────────────────────────────

document.getElementById('btn-check').addEventListener('click', checkFlow);

document.getElementById('btn-reset-level').addEventListener('click', () => {
    if (!graph || currentLevelId === null) return;
    graph.reset();
    const levelData = LEVELS.find(l => l.id === currentLevelId);
    removeSliders();
    createSliders(levelData);
    updateFlowDisplay();
    document.getElementById('max-display').textContent = '?';
});

document.getElementById('btn-levels-back').addEventListener('click', () => {
    stopLoop();
    removeSliders();
    graph = null;
    showScreen('levels');
});

// ── Resize handling ───────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
    if (!document.getElementById('screen-game').classList.contains('active')) return;
    const levelData = LEVELS.find(l => l.id === currentLevelId);
    if (!levelData) return;
    setupCanvas();
    repositionSliders(levelData);
});
