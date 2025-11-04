export function pos2idx(pos, msize) {
  return pos[0] * msize[1] + pos[1];
}
export function idx2pos(idx, msize) {
  return [Math.floor(idx/msize[1]), idx%msize[1]];
}
export function posInside(pos, msize) {
  return pos[0] >= 0 && pos[0] < msize[0] && pos[1] >= 0 && pos[1] < msize[1];
}

export function roomsToGrid(rooms, msize) {
  const res = [...new Array(msize[0] * msize[1])].map(() => 0);
  rooms.forEach(({ pos, size }, i) => {
    for (let r = 0; r < size[0]; r++) {
      for (let c = 0; c < size[1]; c++) {
        const idx = pos2idx([pos[0]+r,pos[1]+ c], msize);
        res[idx] = i + 1;
      }
    }
  });
  return res;
}

export function grid2Graph(msize) {
  const offsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  const graph = {};
  for (let r = 0; r < msize[0]; r++) {
    for (let c = 0; c < msize[1]; c++) {
      const idx = pos2idx([r, c], msize);
      offsets.forEach(([roff, coff]) => {
        const npos = [r + roff, c + coff];
        const nidx = pos2idx(npos, msize);
        if (!posInside(npos, msize)) {
          return;
        }
        if (!(idx in graph)) {
          graph[idx] = [];
        }
        graph[idx].push(nidx);
      });
    }
  }
  return graph;
}

export function weightGraph(lhsIdx, rhsIdx, graph, grid, msize, allowed) {
  const res = {};
  Object.keys(graph).forEach((idx) => {
    const idxVal = grid[idx];
    res[idx] = [];
    graph[idx].forEach((nidx) => {
      const nidxVal = grid[nidx];
      let weight = 10;
      // if empty => 0
      // if lhsIdx or rhsIdx => 0
      // else 10
      if (allowed[nidxVal]) {
        weight = 0;
      } else if (nidxVal === lhsIdx || nidxVal === rhsIdx) {

      }
      res[idx].push([weight, nidx]);
    });
  });
  return res;
}
