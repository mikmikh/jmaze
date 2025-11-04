import { SPIRTE_PATTERNS, SPRITE_COLORS } from "./constants.js";
import { posInside } from "./utils/graph.js";
import { jraycast, jSpreadAngles } from "./utils/raycast.js";
import { vAdd, vRotate } from "./utils/vec.js";

export const RENDER_CHARS =
  "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,\"^`'.";
// export const RENDER_CHARS = "░▒▓█";

export function createView(vsize) {
  return [...new Array(vsize[0])].map((r) =>
    [...new Array(vsize[1])].map(() => " ")
  );
}
export function createVColor(vsize) {
  return [...new Array(vsize[0])].map((r) =>
    [...new Array(vsize[1])].map(() => null)
  );
}
export function renderMapToView(
  vpos,
  vdir,
  view,
  vsize,
  mdata,
  msize,
  fov = Math.PI / 2,
  fMaxDistance = 8.0,
  vcolor=null,
) {
  const vRayAngles = jSpreadAngles(vsize[1], fov);
  const rinfos = [];
  vRayAngles.forEach((angle) => {
    const vRayDir = vRotate(vdir, angle);
    const raycastInfo = jraycast(vpos, vRayDir, mdata, msize, fMaxDistance);
    const perpAngle = Math.PI / 2 - Math.abs(angle);
    const perpDistance = raycastInfo.distance * Math.sin(perpAngle);
    const rinfo = { ...raycastInfo, angle, vRayDir, perpDistance };
    rinfos.push(rinfo);
  });

  rinfos.forEach(({ perpDistance }, c) => {
    const depth = (fMaxDistance - perpDistance) / fMaxDistance;
    const depthColor = Math.floor(depth*255);
    const charIdx = Math.floor(RENDER_CHARS.length * depth);
    const rows = vsize[0];
    const h = depth * rows;
    const margin = (rows - h) / 2 - 0.001;
    for (let r = 0; r < rows; r++) {
      if (r >= margin && r < rows - margin) {
        view[r][c] = RENDER_CHARS[charIdx];
        if (vcolor) {
          vcolor[r][c] = `rgb(${depthColor},${depthColor},${depthColor})`;
        }
      }
    }
  });
  return rinfos;
}

export function renderMapToViewSprites(
  vpos,
  vdir,
  view,
  vsize,
  vecMap,
  mdata,
  sdata,
  msize,
  fMaxDistance,
) {
  let fDistance = 1;
  const pcell = vpos.map((v) => Math.floor(v));
  const viewCells = [];
  let scell = null;
  let mcell = null;
  while (fDistance < fMaxDistance) {
    const ccell = [
      pcell[0] + vdir[0] * fDistance,
      pcell[1] + vdir[1] * fDistance,
    ].map((v) => Math.floor(v));
    if (!posInside(ccell, msize)) {
      break;
    }
    if (sdata[ccell[0]][ccell[1]]) {
      scell = ccell;
      break;
    }
    if (mdata[ccell[0]][ccell[1]]) {
      mcell = ccell;
      break;
    }

    fDistance++;
  }
  const [rows, cols] = vsize;
  const vcenter = [rows / 2, cols / 2].map((v) => Math.floor(v));
  if (scell) {
    const depth = (fMaxDistance - fDistance) / fMaxDistance;
    
    const radius = (depth * rows) / 3;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = Math.sqrt((rows / 2 - r + 2) ** 2 + (cols / 2 - c) ** 2);
        if (dist < radius) {
          view[r][c] = "█";
        }
      }
    }
  }
  // if (mcell) {
  //   view[vcenter[0]][vcenter[1]] = vecMap[mcell[0]][mcell[1]];
  // }
  // if (scell) {
  //   view[vcenter[0]][vcenter[1]] = vecMap[scell[0]][scell[1]];
  // }
}

// const SPIRTES = {
//   // z: [`.█.█.`, `.....`, `█...█`, `.███.`],
//   z:  [
//     ['.','.','.','.','.'],
//     ['.','█','.','█','.'],
//     ['.','█','.','█','.'],
//     ['.','.','.','.','.'],
//     ['█','.','.','.','█'],
//     ['.','█','█','█','.'],
//   ],
//   S: [`.███.`, `█....`, `.███.`, `....█`, `.███.`],
//   A: [`.███.`, `█...█`, `█████`, `██A██`, `█████`],
//   "?": [
//     `.███.`,
//     `█...█`,
//     `...█.`,
//     `..█..`,
//     `..█..`],
// };
export function renderMapToViewSprites2(
  vpos,
  vdir,
  view,
  vsize,
  vecMap,
  mdata,
  sdata,
  msize,
  fMaxDistance,
  vcolor = null,
) {
  let fDistance = 1;
  const pcell = vpos.map((v) => Math.floor(v));
  const viewCells = [];
  let scell = null;
  let mcell = null;
  while (fDistance < fMaxDistance) {
    const ccell = [
      pcell[0] + vdir[0] * fDistance,
      pcell[1] + vdir[1] * fDistance,
    ].map((v) => Math.floor(v));
    if (!posInside(ccell, msize)) {
      break;
    }
    if (sdata[ccell[0]][ccell[1]]) {
      scell = ccell;
      break;
    }
    if (mdata[ccell[0]][ccell[1]]) {
      mcell = ccell;
      break;
    }

    fDistance++;
  }
  const [rows, cols] = vsize;
  const vcenter = [rows / 2, cols / 2].map((v) => Math.floor(v));
  const vcenterSprite = [rows / 2, cols / 2].map((v) => Math.floor(v));
  if (scell) {
    const depth = (fMaxDistance - fDistance) / fMaxDistance;
    vcenterSprite[0] += Math.floor(rows/4*depth);
    // const spriteSize = vsize.map((v) => Math.floor(((v * depth) / 3) * 2));
    // const spriteSize = vsize.map((v) => Math.floor(v * depth*2/3));

    const vecMapVal = vecMap[scell[0]][scell[1]];
    const pattern = SPIRTE_PATTERNS[vecMapVal] ?? SPIRTE_PATTERNS["?"];
    const patternSize = [pattern.length, pattern[0].length];
    const ratio = patternSize[0] / patternSize[1];
    const spriteSizeF = [
      (vsize[0] * depth * 2) / 3,
      ((vsize[0] * depth * 2) / 3) * ratio,
    ];
    const spriteSize = spriteSizeF.map((v) => Math.floor(v));
    const spriteStart = vcenterSprite.map((v, i) =>
      Math.floor(v - spriteSize[i] / 2)
    );

    for (let r = 0; r < spriteSize[0]; r++) {
      for (let c = 0; c < spriteSize[1]; c++) {
        const vpos = [spriteStart[0] + r, spriteStart[1] + c];
        const spritePos = [
          Math.floor((r / spriteSize[0]) * patternSize[0]),
          Math.floor((c / spriteSize[1]) * patternSize[1]),
        ];
        const spriteValue = pattern[spritePos[0]][spritePos[1]];
        if (spriteValue !== ".") {
          view[vpos[0]][vpos[1]] = spriteValue; //"█";
          if (vcolor && SPRITE_COLORS[vecMapVal]) {
            vcolor[vpos[0]][vpos[1]] = SPRITE_COLORS[vecMapVal];
          }
        }
      }
    }
  }
  // if (mcell) {
  //   view[vcenter[0]][vcenter[1]] = vecMap[mcell[0]][mcell[1]];
  // }
  // if (scell) {
  //   view[vcenter[0]][vcenter[1]] = vecMap[scell[0]][scell[1]];
  // }
}

export function renderItem(itemChar, view, vsize, vcolor = null, frac=3) {
  const pattern = SPIRTE_PATTERNS[itemChar] ?? SPIRTE_PATTERNS["?"];
  const patternSize = [pattern.length, pattern[0].length];
  const ratio = patternSize[0] / patternSize[1];
  const spriteSizeF = [vsize[0] / frac, (vsize[0] / frac) * ratio];
  const spriteSize = spriteSizeF.map((v) => Math.floor(v));
  const spriteStart = [vsize[0] - spriteSize[0], vsize[1] - spriteSize[1]];
  const spriteColor = SPRITE_COLORS[itemChar];
  for (let r = 0; r < spriteSize[0]; r++) {
    for (let c = 0; c < spriteSize[1]; c++) {
      const vpos = [spriteStart[0] + r, spriteStart[1] + c];
      const spritePos = [
        Math.floor((r / spriteSize[0]) * patternSize[0]),
        Math.floor((c / spriteSize[1]) * patternSize[1]),
      ];
      const spriteValue = pattern[spritePos[0]][spritePos[1]];
      if (spriteValue !== ".") {
        view[vpos[0]][vpos[1]] = spriteValue;
        if (vcolor && spriteColor) {
          vcolor[vpos[0]][vpos[1]] = spriteColor;
        }
      }
    }
  }
}
// export function renderMapToViewSprites(vpos,vdir,view,vsize,mdata,msize,rinfos) {
//     const srinfos = [];
//     rinfos.forEach(({vRayDir, distance, angle}, i) => {
//         const raycastInfo = jraycast(vpos, vRayDir, mdata,msize,distance);
//         const perpAngle = Math.PI/2-Math.abs(angle);
//         const perpDistance = raycastInfo.distance * Math.sin(perpAngle);
//         const srinfo = {
//             ...raycastInfo,
//             perpDistance,
//         }
//         srinfos.push(srinfo);
//     });

//     srinfos.forEach(({cell}, c) => {
//         const depth = (fMaxDistance-distance)/fMaxDistance;
//         const charIdx = Math.floor(RENDER_CHARS.length*depth);
//         const cols = vsize[0];
//         const h = depth * cols;
//         const margin = (cols-h)/2-0.001;
//         for (let r = 0; r < cols;r++) {
//             if (r >= margin && r < cols-margin) {
//                 view[r][c] = RENDER_CHARS[charIdx];
//             }
//         }
//     });
//     return raycastInfos;
// }

// export function renderMapToViewSprites(vpos,vdir,view,vsize,mdata,msize,fov=Math.PI/2,rri=) {
//     const vRayAngles = jSpreadAngles(vsize[1], fov);
//     const raycastInfos = [];
//     vRayAngles.forEach((angle,i) => {
//         const vRayDir = vRotate(vdir, angle);
//         const raycastInfo = jraycast(vpos, vRayDir, mdata,msize,fMaxDistance);
//         const perpAngle = Math.PI/2-Math.abs(angle);
//         const perpDistance = raycastInfo.distance * Math.sin(perpAngle);
//         raycastInfo.distance = perpDistance;
//         raycastInfos.push(raycastInfo);
//     });

//     raycastInfos.forEach(({distance}, c) => {
//         const depth = (fMaxDistance-distance)/fMaxDistance;
//         const charIdx = Math.floor(RENDER_CHARS.length*depth);
//         const cols = vsize[0];
//         const h = depth * cols;
//         const margin = (cols-h)/2-0.001;
//         for (let r = 0; r < cols;r++) {
//             if (r >= margin && r < cols-margin) {
//                 view[r][c] = RENDER_CHARS[charIdx];
//             }
//         }
//     });
//     return view;
// }
