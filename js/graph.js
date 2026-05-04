// graph.js — flow model and Edmonds-Karp max-flow solver

class FlowGraph {
    constructor(levelData) {
        this.nodes = levelData.nodes.map(n => ({ ...n }));
        this.edges = levelData.edges.map(e => ({ ...e, flow: 0 }));
        this._sourceId = this.nodes.find(n => n.type === 'source').id;
        this._sinkId   = this.nodes.find(n => n.type === 'sink').id;
    }

    setFlow(edgeId, value) {
        const edge = this.edges.find(e => e.id === edgeId);
        if (edge) edge.flow = Math.max(0, Math.min(Math.round(value), edge.cap));
    }

    reset() {
        this.edges.forEach(e => e.flow = 0);
    }

    // Net flow INTO a node: positive means more arriving than leaving.
    // For source this will be negative (it pushes out), sink positive.
    netFlow(nodeId) {
        let net = 0;
        for (const e of this.edges) {
            if (e.to   === nodeId) net += e.flow;
            if (e.from === nodeId) net -= e.flow;
        }
        return net;
    }

    // A node is conserved if it is source/sink OR its net flow is 0.
    isConserved(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node || node.type === 'source' || node.type === 'sink') return true;
        return this.netFlow(nodeId) === 0;
    }

    allConserved() {
        return this.nodes.every(n => this.isConserved(n.id));
    }

    // Total flow delivered to the sink.
    totalFlow() {
        return this.netFlow(this._sinkId);
    }

    // Edmonds-Karp algorithm (BFS-based Ford-Fulkerson) on a fresh capacity copy.
    // Returns the true maximum flow for the level's graph.
    computeMaxFlow() {
        const ids = this.nodes.map(n => n.id);

        // Aggregate parallel edges into a capacity map
        const cap = {};
        for (const u of ids) { cap[u] = {}; for (const v of ids) cap[u][v] = 0; }
        for (const e of this.edges) cap[e.from][e.to] += e.cap;

        const bfsPath = () => {
            const prev = {};
            const visited = new Set([this._sourceId]);
            const queue = [this._sourceId];
            while (queue.length) {
                const u = queue.shift();
                for (const v of ids) {
                    if (!visited.has(v) && cap[u][v] > 0) {
                        prev[v] = u;
                        if (v === this._sinkId) return prev;
                        visited.add(v);
                        queue.push(v);
                    }
                }
            }
            return null;
        };

        let maxFlow = 0;
        let prev;
        while ((prev = bfsPath()) !== null) {
            // Find bottleneck along the path
            let bottleneck = Infinity;
            let v = this._sinkId;
            while (v !== this._sourceId) {
                const u = prev[v];
                bottleneck = Math.min(bottleneck, cap[u][v]);
                v = u;
            }
            // Update residual capacities
            v = this._sinkId;
            while (v !== this._sourceId) {
                const u = prev[v];
                cap[u][v] -= bottleneck;
                cap[v][u] += bottleneck;
                v = u;
            }
            maxFlow += bottleneck;
        }
        return maxFlow;
    }
}
