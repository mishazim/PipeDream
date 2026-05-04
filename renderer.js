// renderer.js — canvas drawing for PipeDream

const LOGI_W = 1000; // logical coordinate space width
const LOGI_H = 600;  // logical coordinate space height
const NODE_R = 34;   // node circle radius in logical units

// Water-drop state managed here so it persists across frames
let _drops = [];
let _lastTs = 0;

function initDrops() {
    _drops = [];
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(hexA, hexB, t) {
    const [ar, ag, ab] = hexToRgb(hexA);
    const [br, bg, bb] = hexToRgb(hexB);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const b = Math.round(ab + (bb - ab) * t);
    return `rgb(${r},${g},${b})`;
}

// ── Scale helpers ─────────────────────────────────────────────────────────────

function sx(canvas, lx) { return lx * canvas.width  / LOGI_W; }
function sy(canvas, lh) { return lh * canvas.height / LOGI_H; }

function nodePositions(canvas, levelData) {
    const pos = {};
    for (const n of levelData.nodes) {
        pos[n.id] = { x: sx(canvas, n.x), y: sy(canvas, n.y) };
    }
    return pos;
}

// ── Edge drawing ──────────────────────────────────────────────────────────────

function drawEdge(ctx, edge, from, to, graph, nodeR) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Start and end points, pulled back from node centres
    const x1 = from.x + cos * (nodeR + 4);
    const y1 = from.y + sin * (nodeR + 4);
    const x2 = to.x   - cos * (nodeR + 16); // leave room for arrowhead
    const y2 = to.y   - sin * (nodeR + 16);

    const ratio = edge.cap > 0 ? edge.flow / edge.cap : 0;
    const pipeColor = lerpColor('#2d4a7a', '#38bdf8', ratio);
    const glowAlpha = ratio * 0.35;

    // Outer shadow / glow for active pipes
    if (ratio > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(56,189,248,${glowAlpha})`;
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.restore();
    }

    // Pipe shell (outer dark tube)
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    // Pipe fill (inner coloured channel)
    ctx.strokeStyle = pipeColor;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    // Pipe highlight (top shine)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Offset slightly perpendicular to give a rounded-tube look
    const px = -sin * 3, py = cos * 3;
    ctx.moveTo(x1 + px, y1 + py); ctx.lineTo(x2 + px, y2 + py);
    ctx.stroke();

    // Arrowhead
    const ax = to.x - cos * (nodeR + 2);
    const ay = to.y - sin * (nodeR + 2);
    const headLen = 13;
    const spread  = Math.PI / 6;
    ctx.fillStyle = ratio > 0 ? '#38bdf8' : '#2d4a7a';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - headLen * Math.cos(angle - spread), ay - headLen * Math.sin(angle - spread));
    ctx.lineTo(ax - headLen * Math.cos(angle + spread), ay - headLen * Math.sin(angle + spread));
    ctx.closePath();
    ctx.fill();

}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

// ── Node drawing ──────────────────────────────────────────────────────────────

function drawNode(ctx, node, pos, graph, nodeR, timestamp) {
    const { x, y } = pos;
    const conserved = graph.isConserved(node.id);

    // Pulse ring for imbalanced nodes
    if (!conserved) {
        const pulse = 0.5 + 0.5 * Math.sin(timestamp / 300);
        ctx.beginPath();
        ctx.arc(x, y, nodeR + 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251,113,133,${0.5 + 0.5 * pulse})`;
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Node fill gradient
    const grad = ctx.createRadialGradient(x - nodeR*0.3, y - nodeR*0.3, 2, x, y, nodeR);
    if (node.type === 'source') {
        grad.addColorStop(0, '#60a5fa');
        grad.addColorStop(1, '#1d4ed8');
    } else if (node.type === 'sink') {
        grad.addColorStop(0, '#34d399');
        grad.addColorStop(1, '#065f46');
    } else if (!conserved) {
        grad.addColorStop(0, '#fca5a5');
        grad.addColorStop(1, '#991b1b');
    } else {
        grad.addColorStop(0, '#e2e8f0');
        grad.addColorStop(1, '#94a3b8');
    }

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.arc(x, y, nodeR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();

    // Border
    ctx.beginPath();
    ctx.arc(x, y, nodeR, 0, Math.PI * 2);
    ctx.strokeStyle = node.type === 'source' ? '#93c5fd'
                    : node.type === 'sink'   ? '#6ee7b7'
                    : conserved              ? 'rgba(255,255,255,0.3)'
                    :                          '#fca5a5';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Shine highlight
    ctx.beginPath();
    ctx.arc(x - nodeR*0.28, y - nodeR*0.28, nodeR*0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();

    // Label
    ctx.font = `bold ${nodeR * 0.72}px Fredoka One, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = node.type === 'source' || node.type === 'sink' ? 'white' : '#1e293b';
    ctx.fillText(node.label, x, y + 1);

    // Net-flow annotation for intermediate nodes
    if (node.type === 'node') {
        const net = graph.netFlow(node.id);
        if (net !== 0) {
            const annotation = net > 0 ? `+${net}` : `${net}`;
            ctx.font = 'bold 11px Nunito, sans-serif';
            ctx.fillStyle = net > 0 ? '#fbbf24' : '#f87171';
            ctx.fillText(annotation, x, y + nodeR + 14);
        }
    }
}

// ── Water drops ───────────────────────────────────────────────────────────────

function updateDrops(graph, pos, dt) {
    // Spawn new drops for edges with flow
    for (const edge of graph.edges) {
        if (edge.flow === 0) continue;
        const density = edge.flow / edge.cap;
        if (Math.random() < density * 0.08) {
            _drops.push({
                edgeId: edge.id,
                t: 0,
                speed: 0.0006 + density * 0.0008,
                r: 3 + Math.random() * 3,
                alpha: 0.5 + Math.random() * 0.35,
            });
        }
    }

    // Update existing drops
    for (let i = _drops.length - 1; i >= 0; i--) {
        _drops[i].t += _drops[i].speed * dt;
        if (_drops[i].t >= 1) _drops.splice(i, 1);
    }

    // Cap to avoid memory creep
    if (_drops.length > 200) _drops.splice(0, _drops.length - 200);
}

function drawDrops(ctx, graph, pos) {
    for (const d of _drops) {
        const edge = graph.edges.find(e => e.id === d.edgeId);
        if (!edge || edge.flow === 0) continue;
        const from = pos[edge.from];
        const to   = pos[edge.to];
        if (!from || !to) continue;

        const x = from.x + (to.x - from.x) * d.t;
        const y = from.y + (to.y - from.y) * d.t;

        ctx.beginPath();
        ctx.arc(x, y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186,230,253,${d.alpha})`;
        ctx.fill();
    }
}

// ── Main render entry point ───────────────────────────────────────────────────

function renderFrame(canvas, graph, levelData, timestamp) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dt = timestamp - _lastTs;
    _lastTs = timestamp;

    const pos    = nodePositions(canvas, levelData);
    const nodeR  = sx(canvas, NODE_R);

    // Edges first (behind nodes)
    for (const edge of graph.edges) {
        drawEdge(ctx, edge, pos[edge.from], pos[edge.to], graph, nodeR);
    }

    // Water drops
    updateDrops(graph, pos, Math.min(dt, 100)); // clamp dt to avoid big jumps
    drawDrops(ctx, graph, pos);

    // Nodes on top
    for (const node of levelData.nodes) {
        drawNode(ctx, node, pos[node.id], graph, nodeR, timestamp);
    }
}

// Returns canvas-pixel midpoints for each edge (used by game.js to place sliders).
function getEdgeMidpoints(canvas, levelData) {
    const pos = nodePositions(canvas, levelData);
    return levelData.edges.map(e => {
        const from  = pos[e.from];
        const to    = pos[e.to];
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        return {
            edgeId: e.id,
            mx: (from.x + to.x) / 2,
            my: (from.y + to.y) / 2,
            angle,
        };
    });
}
