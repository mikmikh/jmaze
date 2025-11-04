import { BSPNode } from "./utils/bsp.js";
import { LDSS } from "./utils/dss.js";
import {
  grid2Graph,
  idx2pos,
  pos2idx,
  roomsToGrid,
  weightGraph,
} from "./utils/graph.js";
import { buildPathFromTrack, lastar } from "./utils/lastar.js";
import { generateLockKeyPazzle } from "./utils/locks.js";
import { pickFromArray, pickOneFromArray } from "./utils/lrng.js";
import { lTriangulate } from "./utils/triangulate.js";

export const KEY_CHARS = Array.from("abcdfghij");
export const LOCK_CHARS = Array.from(KEY_CHARS).map((c) => c.toUpperCase());
export const ITEM_CHARS = "&!$";
export const CHARS = {
  WALL: "#",
  PATH: ".",
  EMPTY: " ",
  START: "S",
  EXIT: "E",
};


const DEFAULT_CONFIG = {
  rng: Math,
  minSize: 6,
  margin: 1,
  idx: 0,
  edgeProb: 0.1,
  lockCount: 3,
};

function nodeToRoom(node) {
  const { minSize, rng, margin } = node.config;
  const minRoomSize = minSize - margin * 2 - 1;
  const rsize = node.size.map(
    (s, i) =>
      minRoomSize +
      Math.floor((node.size[i] - margin * 2 - minRoomSize) * rng.random())
  );
  const rpos = node.size.map(
    (s, i) =>
      node.pos[i] +
      margin +
      Math.floor((node.size[i] - rsize[i] - margin * 2) * rng.random())
  );

  return { pos: rpos, size: rsize, id: node.idx };
}

function generateRooms(msize, config) {
  const root = new BSPNode([0, 0], msize, config);
  root.split();
  const leaves = root.getLeaves();
  const grid2d = [...new Array(msize[0])].map((r) =>
    [...new Array(msize[1])].map(() => 0)
  );
  const rooms = leaves.map((n) => nodeToRoom(n));
  return rooms;
}

export function generateLevel(msize = [16, 16], config = DEFAULT_CONFIG) {
  const { rng, edgeProb, lockCount } = config;
  const rooms = generateRooms(msize, config);
  console.log("rooms", rooms);

  // find connections
  const roomCenters = rooms.map(({ pos, size }) => [
    pos[0] + size[0] / 2,
    pos[1] + size[1] / 2,
  ]);
  const roomCenterPoints = roomCenters.map(([r, c]) => ({ x: c, y: r }));
  const edges = lTriangulate(roomCenterPoints);
  console.log("edges", edges);
  const dss = new LDSS(rooms.length);
  const selectedEdges = [];
  edges.forEach((edge) => {
    if (dss.find(edge[0]) !== dss.find(edge[1]) || rng.random() < edgeProb) {
      dss.union(edge[0], edge[1]);
      selectedEdges.push(edge);
    }
  });
  // console.log("edges", selectedEdges);

  // create grid
  const grid = roomsToGrid(rooms, msize);
  const graph = grid2Graph(msize);

  const heuristic = (lhs, rhs) => {
    const lhsPos = idx2pos(lhs, msize);
    const rhsPos = idx2pos(rhs, msize);
    const dist =
      Math.abs(lhsPos[0] - rhsPos[0]) ** 2 +
      Math.abs(lhsPos[1] - rhsPos[1]) ** 2;
    return dist;
  };
  const n = grid.length;
  const pathIdx = -1;
  const paths = selectedEdges.map((edge) => {
    const [lhsIdx, rhsIdx] = edge;
    const wgraph = weightGraph(lhsIdx + 1, rhsIdx + 1, graph, grid, msize, {
      [0]: true,
      [pathIdx]: true,
    });
    const startPos = roomCenters[lhsIdx].map((v) => Math.floor(v));
    const endPos = roomCenters[rhsIdx].map((v) => Math.floor(v));
    // console.log(startPos, endPos);
    const startIdx = pos2idx(startPos, msize);
    const endIdx = pos2idx(endPos, msize);
    // console.log(startIdx, endIdx);

    const { track } = lastar(startIdx, endIdx, n, wgraph, heuristic);
    // console.log("track", track);

    const tpath = buildPathFromTrack(startIdx, endIdx, track, n);
    // console.log(tpath);
    Object.keys(tpath).forEach((idx) => {
      grid[idx] = pathIdx;
    });
    const path = { idxs: Object.keys(tpath), edge };
    return path;
  });

  const pazzle = generateLockKeyPazzle(
    rooms.length,
    selectedEdges,
    0,
    lockCount,
    rng
  );
  console.log("pazzle", pazzle);

  return { rooms, grid, paths, pazzle };
}

export function prepraeGrid(
  msize,
  rooms,
  paths,
  pazzle,
  enemies = [],
  items = [],
  config
) {
  const { rng } = config;
  const res = [...new Array(msize[0] * msize[1])].map(() => CHARS.EMPTY);
  paths.forEach(({ idxs, edge }) => {
    idxs.forEach((idx) => {
      res[idx] = CHARS.PATH;
    });
  });
  const margin = 1;
  rooms.forEach(({ pos, size }, i) => {
    for (let r = 0; r < size[0]; r++) {
      for (let c = 0; c < size[1]; c++) {
        const idx = pos2idx([pos[0] + r, pos[1] + c], msize);
        if (res[idx] === CHARS.PATH && pazzle.idx2lock[i] !== undefined) {
          // lock
          res[idx] = LOCK_CHARS[pazzle.idx2lock[i]];
        } else {
          res[idx] = res[idx] === CHARS.PATH ? CHARS.PATH : CHARS.WALL;
        }
      }
    }

    for (let r = 0 + margin; r < size[0] - margin; r++) {
      for (let c = 0 + margin; c < size[1] - margin; c++) {
        const idx = pos2idx([pos[0] + r, pos[1] + c], msize);
        res[idx] = CHARS.EMPTY;
      }
    }
    // debug
    // res[pos2idx([pos[0] + margin, pos[1] + margin], msize)] = i;

    //
    if (pazzle.idx2key[i] !== undefined) {
      res[pos2idx([pos[0] + margin + 1, pos[1] + margin], msize)] =
        KEY_CHARS[pazzle.idx2key[i]];
    }
  });
  const roomMetas = [];
  const objectInfos = {};
  rooms.forEach((room, ri) => {
    const idxs = getEmptyIdxs(room, res, msize, margin);
    if (pazzle.start === ri) {
      const ridx = Math.floor(rng.random() * idxs.length);
      const gidx = idxs[ridx];
      idxs.splice(ridx, 1);
      res[gidx] = CHARS.START;
      objectInfos[CHARS.START] = gidx;
    }
    if (pazzle.end === ri) {
      const ridx = Math.floor(rng.random() * idxs.length);
      const gidx = idxs[ridx];
      idxs.splice(ridx, 1);
      res[gidx] = CHARS.EXIT;
      objectInfos[CHARS.EXIT] = gidx;
    }
    const meta = {
      idxs: idxs,
      objects: [],
    };
    roomMetas.push(meta);
  });
  {
    items.forEach((item) => {
      const roomsWithEmptySpaces = [];
      roomMetas.forEach((rm, ri) => {
        if (rm.idxs.length > 0) {
          roomsWithEmptySpaces.push(ri);
        }
      });
      // pick room
      const roomIdx = pickOneFromArray(roomsWithEmptySpaces, rng);
      const roomMeta = roomMetas[roomIdx];
      const ridx = Math.floor(rng.random() * roomMeta.idxs.length);
      const gidx = roomMeta.idxs[ridx];
      roomMeta.idxs.splice(ridx, 1);
      item.roomIdx = roomIdx;
      item.idx = gidx;
      res[gidx] = item.char;
    });
    console.log("items", items);
  }
  {
    enemies.forEach((enemy) => {
      const roomsWithEmptySpaces = [];
      roomMetas.forEach((rm, ri) => {
        if (rm.idxs.length > 0 && pazzle.start !== ri) {
          roomsWithEmptySpaces.push(ri);
        }
      });
      // pick room
      const roomIdx = pickOneFromArray(roomsWithEmptySpaces, rng);
      const roomMeta = roomMetas[roomIdx];
      const ridx = Math.floor(rng.random() * roomMeta.idxs.length);
      const gidx = roomMeta.idxs[ridx];
      roomMeta.idxs.splice(ridx, 1);
      enemy.roomIdx = roomIdx;
      enemy.idx = gidx;
      res[gidx] = enemy.char;
    });
    console.log("items", items);
  }

  // fill with path
  rooms.forEach(({ pos, size }, i) => {
    for (let r = 0 + margin; r < size[0] - margin; r++) {
      for (let c = 0 + margin; c < size[1] - margin; c++) {
        const idx = pos2idx([pos[0] + r, pos[1] + c], msize);
        if (res[idx] === CHARS.EMPTY) {
          res[idx] = CHARS.PATH;
        }
      }
    }
  });

  return res;
}

function getEmptyIdxs(room, grid, msize, margin = 0) {
  const { pos, size } = room;
  const res = [];
  for (let r = 0 + margin; r < size[0] - margin; r++) {
    for (let c = 0 + margin; c < size[1] - margin; c++) {
      const idx = pos2idx([pos[0] + r, pos[1] + c], msize);
      if (grid[idx] === CHARS.EMPTY) {
        res.push(idx);
      }
    }
  }
  return res;
}

// function gridIteration(player, grid, msize) {
//   // find cells to update
//   const dist = 3;
//   for (let r_ = 0; r_ < dist; r_++) {
//     for (let c_ = 0; c_ < dist; c++) {
//       const 
//     }
//   }
// }
