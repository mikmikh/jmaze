import { idx2pos, pos2idx, posInside } from "./utils/graph.js";

function bfs(pos, mdata, msize, maxDist) {
  const offsets = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  const queue = [[0, pos]];
  const visited = new Set();
  const track = {};
  const order = [];
  while (queue.length > 0) {
    const [cdist, cpos] = queue.shift();
    const cidx = pos2idx(cpos, msize);
    if (visited.has(cidx)) {
      continue;
    }
    order.push(cidx);
    visited.add(cidx);
    if (cdist + 1 > maxDist) {
        continue;
    }
    for (const [roff, coff] of offsets) {
      const npos = [cpos[0] + roff, cpos[1] + coff];
      const nidx = pos2idx(npos, msize);
      if (
        posInside(npos, msize) &&
        !visited.has(nidx) &&
        !mdata[npos[0]][npos[1]]
      ) {
        queue.push([cdist + 1, npos]);
        track[nidx] = cidx;
      }
    }
  }
  return { order, track };
}
export function automatonStep(player, vecMap,mdata, msize, maxDist = 3) {
  const { order, track } = bfs(player.pos, mdata, msize, maxDist);
  console.log(order, track);
  const pidx = pos2idx(player.pos, msize);
  order.forEach((cidx) => {
    if (!track[cidx]) {
      return;
    }
    const nidx = track[cidx];
    const cpos = idx2pos(cidx, msize);
    const npos = idx2pos(nidx, msize);
    if (vecMap[cpos[0]][cpos[1]] === "z" && pidx !== nidx) {
      const tmp = vecMap[cpos[0]][cpos[1]];
      vecMap[cpos[0]][cpos[1]] = vecMap[npos[0]][npos[1]];
      vecMap[npos[0]][npos[1]] = tmp;
    }
  });
}
