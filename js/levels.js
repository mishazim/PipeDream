// levels.js — level definitions for PipeDream
// Coordinates are on a 1000×600 logical grid; renderer scales to canvas size.
// Node types: 'source' | 'sink' | 'node'

const LEVELS = [

  // ── Level 1: Straight Shot ────────────────────────────────────────────────
  // Single path. Learn what a pipe slider does.
  {
    id: 1, name: 'Straight Shot', difficulty: 1, maxFlow: 5,
    nodes: [
      { id: 'S', label: 'S', type: 'source', x: 130, y: 300 },
      { id: 'A', label: 'A', type: 'node',   x: 500, y: 300 },
      { id: 'T', label: 'T', type: 'sink',   x: 870, y: 300 },
    ],
    edges: [
      { id: 'e0', from: 'S', to: 'A', cap: 5 },
      { id: 'e1', from: 'A', to: 'T', cap: 5 },
    ],
  },

  // ── Level 2: Fork in the Road ─────────────────────────────────────────────
  // Two parallel paths — both can carry water simultaneously.
  {
    id: 2, name: 'Fork in the Road', difficulty: 1, maxFlow: 8,
    nodes: [
      { id: 'S', label: 'S', type: 'source', x: 130, y: 300 },
      { id: 'A', label: 'A', type: 'node',   x: 500, y: 160 },
      { id: 'B', label: 'B', type: 'node',   x: 500, y: 440 },
      { id: 'T', label: 'T', type: 'sink',   x: 870, y: 300 },
    ],
    edges: [
      { id: 'e0', from: 'S', to: 'A', cap: 3 },
      { id: 'e1', from: 'S', to: 'B', cap: 5 },
      { id: 'e2', from: 'A', to: 'T', cap: 3 },
      { id: 'e3', from: 'B', to: 'T', cap: 5 },
    ],
  },

  // ── Level 3: The Bottleneck ───────────────────────────────────────────────
  // A wide main path narrows to a tiny pipe. A secondary trickle helps.
  {
    id: 3, name: 'The Bottleneck', difficulty: 2, maxFlow: 5,
    nodes: [
      { id: 'S', label: 'S', type: 'source', x: 130, y: 300 },
      { id: 'A', label: 'A', type: 'node',   x: 390, y: 180 },
      { id: 'B', label: 'B', type: 'node',   x: 620, y: 180 },
      { id: 'C', label: 'C', type: 'node',   x: 390, y: 430 },
      { id: 'T', label: 'T', type: 'sink',   x: 870, y: 300 },
    ],
    edges: [
      { id: 'e0', from: 'S', to: 'A', cap: 8 },
      { id: 'e1', from: 'A', to: 'B', cap: 3 },
      { id: 'e2', from: 'B', to: 'T', cap: 8 },
      { id: 'e3', from: 'S', to: 'C', cap: 2 },
      { id: 'e4', from: 'C', to: 'T', cap: 2 },
    ],
  },

  // ── Level 4: The Diamond ──────────────────────────────────────────────────
  // A→B cross-edge lets excess flow from A reach B's high-capacity output.
  {
    id: 4, name: 'The Diamond', difficulty: 2, maxFlow: 7,
    nodes: [
      { id: 'S', label: 'S', type: 'source', x: 130, y: 300 },
      { id: 'A', label: 'A', type: 'node',   x: 430, y: 160 },
      { id: 'B', label: 'B', type: 'node',   x: 430, y: 440 },
      { id: 'T', label: 'T', type: 'sink',   x: 870, y: 300 },
    ],
    edges: [
      { id: 'e0', from: 'S', to: 'A', cap: 3 },
      { id: 'e1', from: 'S', to: 'B', cap: 4 },
      { id: 'e2', from: 'A', to: 'T', cap: 2 },
      { id: 'e3', from: 'B', to: 'T', cap: 5 },
      { id: 'e4', from: 'A', to: 'B', cap: 2 },
    ],
  },

  // ── Level 5: Gathering Streams ────────────────────────────────────────────
  // Two input streams join at a central hub before draining to the sink.
  {
    id: 5, name: 'Gathering Streams', difficulty: 3, maxFlow: 7,
    nodes: [
      { id: 'S', label: 'S', type: 'source', x: 130, y: 300 },
      { id: 'A', label: 'A', type: 'node',   x: 370, y: 160 },
      { id: 'B', label: 'B', type: 'node',   x: 370, y: 440 },
      { id: 'C', label: 'C', type: 'node',   x: 630, y: 300 },
      { id: 'T', label: 'T', type: 'sink',   x: 870, y: 300 },
    ],
    edges: [
      { id: 'e0', from: 'S', to: 'A', cap: 3 },
      { id: 'e1', from: 'S', to: 'B', cap: 4 },
      { id: 'e2', from: 'A', to: 'C', cap: 3 },
      { id: 'e3', from: 'B', to: 'C', cap: 2 },
      { id: 'e4', from: 'A', to: 'T', cap: 1 },
      { id: 'e5', from: 'B', to: 'T', cap: 2 },
      { id: 'e6', from: 'C', to: 'T', cap: 4 },
    ],
  },

  // ── Level 6: The Crossroads ───────────────────────────────────────────────
  // Two sources fan into two collectors. Bottleneck is on the output side.
  {
    id: 6, name: 'The Crossroads', difficulty: 3, maxFlow: 8,
    nodes: [
      { id: 'S', label: 'S', type: 'source', x: 130, y: 300 },
      { id: 'A', label: 'A', type: 'node',   x: 360, y: 160 },
      { id: 'B', label: 'B', type: 'node',   x: 360, y: 440 },
      { id: 'C', label: 'C', type: 'node',   x: 640, y: 160 },
      { id: 'D', label: 'D', type: 'node',   x: 640, y: 440 },
      { id: 'T', label: 'T', type: 'sink',   x: 870, y: 300 },
    ],
    edges: [
      { id: 'e0', from: 'S', to: 'A', cap: 5 },
      { id: 'e1', from: 'S', to: 'B', cap: 4 },
      { id: 'e2', from: 'A', to: 'C', cap: 3 },
      { id: 'e3', from: 'A', to: 'D', cap: 3, sliderOffsetY: -38 },
      { id: 'e4', from: 'B', to: 'C', cap: 2, sliderOffsetY:  38 },
      { id: 'e5', from: 'B', to: 'D', cap: 3 },
      { id: 'e6', from: 'C', to: 'T', cap: 4 },
      { id: 'e7', from: 'D', to: 'T', cap: 4 },
    ],
  },

  // ── Level 7: The Maze ─────────────────────────────────────────────────────
  // Seven nodes. D is shared — balance A→D and B→D carefully.
  {
    id: 7, name: 'The Maze', difficulty: 4, maxFlow: 9,
    nodes: [
      { id: 'S', label: 'S', type: 'source', x: 100, y: 300 },
      { id: 'A', label: 'A', type: 'node',   x: 310, y: 160 },
      { id: 'B', label: 'B', type: 'node',   x: 310, y: 440 },
      { id: 'C', label: 'C', type: 'node',   x: 540, y: 90  },
      { id: 'D', label: 'D', type: 'node',   x: 540, y: 300 },
      { id: 'E', label: 'E', type: 'node',   x: 540, y: 510 },
      { id: 'T', label: 'T', type: 'sink',   x: 880, y: 300 },
    ],
    edges: [
      { id: 'e0', from: 'S', to: 'A', cap: 5 },
      { id: 'e1', from: 'S', to: 'B', cap: 4 },
      { id: 'e2', from: 'A', to: 'C', cap: 3 },
      { id: 'e3', from: 'A', to: 'D', cap: 2 },
      { id: 'e4', from: 'B', to: 'D', cap: 2 },
      { id: 'e5', from: 'B', to: 'E', cap: 2 },
      { id: 'e6', from: 'C', to: 'T', cap: 3 },
      { id: 'e7', from: 'D', to: 'T', cap: 4 },
      { id: 'e8', from: 'E', to: 'T', cap: 2 },
    ],
  },

  // ── Level 8: Grand Finale ─────────────────────────────────────────────────
  // Three inputs fan into three outputs through six intermediate nodes.
  // Optimal: D=4, E=4, F=4 → total flow 12.
  {
    id: 8, name: 'Grand Finale', difficulty: 5, maxFlow: 12,
    nodes: [
      { id: 'S', label: 'S', type: 'source', x: 90,  y: 300 },
      { id: 'A', label: 'A', type: 'node',   x: 290, y: 160 },
      { id: 'B', label: 'B', type: 'node',   x: 290, y: 300 },
      { id: 'C', label: 'C', type: 'node',   x: 290, y: 440 },
      { id: 'D', label: 'D', type: 'node',   x: 560, y: 160 },
      { id: 'E', label: 'E', type: 'node',   x: 560, y: 300 },
      { id: 'F', label: 'F', type: 'node',   x: 560, y: 440 },
      { id: 'T', label: 'T', type: 'sink',   x: 880, y: 300 },
    ],
    edges: [
      { id: 'e0',  from: 'S', to: 'A', cap: 5 },
      { id: 'e1',  from: 'S', to: 'B', cap: 4 },
      { id: 'e2',  from: 'S', to: 'C', cap: 3 },
      { id: 'e3',  from: 'A', to: 'D', cap: 4 },
      { id: 'e4',  from: 'A', to: 'E', cap: 3, sliderOffsetY: -38 },
      { id: 'e5',  from: 'B', to: 'D', cap: 3, sliderOffsetY:  38 },
      { id: 'e6',  from: 'B', to: 'F', cap: 4, sliderOffsetY: -38 },
      { id: 'e7',  from: 'C', to: 'E', cap: 2, sliderOffsetY:  38 },
      { id: 'e8',  from: 'C', to: 'F', cap: 3 },
      { id: 'e9',  from: 'D', to: 'T', cap: 5 },
      { id: 'e10', from: 'E', to: 'T', cap: 4 },
      { id: 'e11', from: 'F', to: 'T', cap: 5 },
    ],
  },

];
