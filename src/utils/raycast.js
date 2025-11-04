function cell2idx(cell, msize) {
  return cell[0] * msize[1] + cell[1];
}
function isCellInSize(cell, size) {
  return cell[0] >= 0 && cell[0] < size[0] && cell[1] >= 0 && cell[1] < size[1];
}
export function jraycast(
  vRayStart,
  vRayDir_,
  vecMap,
  mapSize,
  fMaxDistance = 8.0
) {
  const vRayDirLen = Math.sqrt(
    vRayDir_[0] * vRayDir_[0] + vRayDir_[1] * vRayDir_[1]
  );
  const vRayDir = vRayDir_.map((v) => (v === 0 ? 1e-5 : v / vRayDirLen));
  const drdc = vRayDir_[0] / vRayDir_[1];
  const dcdr = vRayDir_[1] / vRayDir_[0];
  const vRayUnitStepSize = [
    Math.sqrt(1 + dcdr * dcdr),
    Math.sqrt(1 + drdc * drdc),
  ];
  const vMapCheck = vRayStart.map((v) => Math.floor(v));
  const vRayLength1D = [0, 0];
  const vStep = [0, 0];

  if (vRayDir[1] < 0) {
    vStep[1] = -1;
    vRayLength1D[1] = (vRayStart[1] - vMapCheck[1]) * vRayUnitStepSize[1];
  } else {
    vStep[1] = 1;
    vRayLength1D[1] = (vMapCheck[1] + 1 - vRayStart[1]) * vRayUnitStepSize[1];
  }

  if (vRayDir[0] < 0) {
    vStep[0] = -1;
    vRayLength1D[0] = (vRayStart[0] - vMapCheck[0]) * vRayUnitStepSize[0];
  } else {
    vStep[0] = 1;
    vRayLength1D[0] = (vMapCheck[0] + 1 - vRayStart[0]) * vRayUnitStepSize[0];
  }

  let bTileFound = false;
  let fDistance = 0.0;
  let side = 0;
  while (!bTileFound && fDistance < fMaxDistance) {
    if (vRayLength1D[1] < vRayLength1D[0]) {
      vMapCheck[1] += vStep[1];
      fDistance = vRayLength1D[1];
      vRayLength1D[1] += vRayUnitStepSize[1];
      side = 1;
    } else {
      vMapCheck[0] += vStep[0];
      fDistance = vRayLength1D[0];
      vRayLength1D[0] += vRayUnitStepSize[0];
      side = 0;
    }

    if (
      !isCellInSize(vMapCheck, mapSize) ||
      // vecMap[cell2idx(vMapCheck, mapSize)]
      vecMap[vMapCheck[0]][vMapCheck[1]]
    ) {
      bTileFound = true;
    }
  }
  if (bTileFound) {
    const vIntersection = [
      vRayStart[0] + vRayDir[0] * fDistance,
      vRayStart[1] + vRayDir[1] * fDistance,
    ];
    const res = {
      intersection: vIntersection,
      cell: vMapCheck,
      side,
      distance: fDistance,
    };
    return res;
  }

  const res = {
    intersection: null,
    cell: vMapCheck,
    side,
    distance: fDistance,
  };
  return res;
}

export function jSpreadAngles(count=8, fov=Math.PI/2) {
    return [...new Array(count)].map((_, i) => fov/2-fov/count*i);
}

// export function jSpreadRays(vDir, count=8, fov=Math.PI/2) {
//     return jSpreadAngles(count, fov).map((angle) => vRotate(vDir, angle));
// }