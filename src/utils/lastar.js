import { HeapLite } from "./lheap.js";

/**
 *
 * @param {number} u
 * @param {[number, number]} val
 * @param {{[key: number]: [number, number][]}} data
 */
export function graphAddEdge(u, val, data) {
  if (!(u in data)) {
    data[u] = [];
  }
  data[u].push(val);
}
export function graphUpdateEdge(u, val, data) {
  if (!(u in data)) {
    data[u] = [];
  }
  const idx = data[u].findIndex((p) => p[1] == val[1]);
  if (idx == -1) {
    data[u].push(val);
  } else {
    data[u][idx] = val;
  }
}
export function buildPathFromTrack(start, end, track, n) {
  const res = {};
  let curr = end;
  res[curr] = curr;
  for (let i = 0; i < n; i++) {
    if (curr == start) break;
    const prevCurr = track[curr];
    res[prevCurr] = curr;
    curr = prevCurr;
  }
  return res;
}

/**
 *
 * @param {number} start
 * @param {number} n
 * @param {{[key: number]: [number, number][]}} data
 */
export function ldijkstra(start, n, graph) {
  const track = {};
  const weights = [];
  for (let i = 0; i < n; i++) {
    weights.push(1e9);
  }
  weights[start] = 0;
  const heap = new HeapLite((lhs, rhs) => {
    if (Math.abs(lhs[0] - rhs[0]) < 1e-9) {
      return lhs[1] - rhs[1];
    }
    return lhs[0] - rhs[0];
  });
  heap.push([0, start]);
  while (!heap.empty()) {
    const [_, node] = heap.pop();
    for (const other of graph[node]) {
      const uWeight = other[0];
      const u = other[1];
      if (weights[node] + uWeight < weights[u]) {
        heap.remove([weights[u], u]);
        weights[u] = weights[node] + uWeight;
        track[u] = node;
        heap.push([weights[u], u]);
      }
    }
  }
  const res = {
    track, weights
  }
  return res;
}

class LAStarState {
  constructor(node, weight, heuristic) {
    this.node = node;
    this.weight = weight;
    this.heuristic = heuristic;
  }
}
/**
 *
 * @param {number} nodeStart
 * @param {number} nodeEnd
 * @param {number} n
 * @param {{[key: number]: [number, number][]}} data
 * @param {(lhs:number,rhs:number) => number} calcHeuristicFunc
 */
export function lastar(nodeStart, nodeEnd, n, graph, calcHeuristicFunc) {
  const track = {};
  const weights = [];
  for (let i = 0; i < n; i++) {
    weights.push(1e9);
  }
  weights[nodeStart] = 0;
  const heap = new HeapLite((lhs, rhs) => {
    const lhsW = lhs.heuristic + lhs.weight;
    const rhsW = rhs.heuristic + rhs.weight;
    if (Math.abs(lhsW - rhsW) < 1e-9) {
      return lhs.node - rhs.node;
    }
    return lhsW - rhsW;
  });

  const startHeuristic = calcHeuristicFunc(nodeStart, nodeEnd);
  heap.push(new LAStarState(nodeStart, weights[nodeStart], startHeuristic));
  while (!heap.empty()) {
    const state = heap.pop();
    if (state.node == nodeEnd) {
      break;
    }
    for (const uEdge of graph[state.node]) {
      const uw = uEdge[0];
      const u = uEdge[1];
      if (weights[state.node] + uw < weights[u]) {
        const heuristic = calcHeuristicFunc(state.node, nodeEnd);

        heap.remove(new LAStarState(u, weights[u], heuristic));
        weights[u] = weights[state.node] + uw;
        track[u] = state.node;
        heap.push(new LAStarState(u, weights[u], heuristic));
      }
    }
  }
  const res = {
    track, weights
  };
  return res;
}
