import { pickFromArray, pickOneFromArray } from "./lrng.js";

function addEdge(u, v, graph) {
  if (!(u in graph)) {
    graph[u] = new Set();
  }
  graph[u].add(v);
}


function placeLockKeysDfs(
  v,
  graph,
  verticesWithLocks,
  rng=Math,
  keyLockInfo = { lockIdx: 0, v2key: {}, v2lock: {}, start: 0, end: -1 },
  visitedSet = new Set()
) {
  //   console.log(v, graph, verticesWithLocks, keyLockInfo);
  // keyLockInfo.end = v; //NOTE: new
  if (keyLockInfo.end === -1) {
    keyLockInfo.end = v;
  }
  if (verticesWithLocks.indexOf(v) !== -1) {
    keyLockInfo.end = v;
    // place lock
    const lock = keyLockInfo.lockIdx++;
    keyLockInfo.v2lock[v] = lock;
    const visitedVertices = [...visitedSet];
    const visitedVerticesWithoutKey = visitedVertices.filter(
      (vert) => !(vert in keyLockInfo.v2key)
    );
    const vertexWithKey = pickOneFromArray(visitedVerticesWithoutKey, rng);
    keyLockInfo.v2key[vertexWithKey] = lock;
  }

  visitedSet.add(v);
  for (const u of graph[v]) {
    if (visitedSet.has(u)) {
      continue;
    }
    placeLockKeysDfs(u, graph, verticesWithLocks,rng, keyLockInfo, visitedSet);
  }
  return keyLockInfo;
}

function placeLockKeys(start, graph, verticesWithLocks,rng) {
  const keyLockInfo = { lockIdx: 0, v2key: {}, v2lock: {}, start, end: -1 };
  const res = placeLockKeysDfs(start, graph, verticesWithLocks, rng, keyLockInfo);
  return res;
}

export function generateLockKeyPazzle(n, edges, start, lockCount, rng = Math) {
  const graph = {};
  edges.forEach(([u, v]) => {
    addEdge(u, v, graph);
    addEdge(v, u, graph);
  });
  const vertices = [...Array(n)].map((_, i) => i);
  const verticesWithoutStart = vertices.filter((v) => v !== start);
  const verticesWithLocks = pickFromArray(lockCount, verticesWithoutStart, rng);

  const keyLockInfo = placeLockKeys(start, graph, verticesWithLocks,rng);
  const idx2lock = keyLockInfo.v2lock;
  const idx2key = keyLockInfo.v2key;
  return {idx2lock,idx2key,start:keyLockInfo.start,end:keyLockInfo.end};
}