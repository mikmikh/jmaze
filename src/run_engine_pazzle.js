import { JEngine } from "./engine.js";
import { generateLevel, prepraeGrid } from "./generator.js";
import { LRNG } from "./utils/lrng.js";

function unflatten(grid, size) {
  const res = [];
  for (let r = 0; r < size[0]; r++) {
    const row = [];
    for (let c = 0; c < size[1]; c++) {
      row.push(grid[r * size[1] + c]);
    }
    res.push(row);
  }
  return res;
}

const CONFIG_DEFAULT = {
  msize: [32, 32],
  seed: 11,
  lockCount: 3,
  enemyCount: 4,
  items: { "&": 3, $: 3, "!": 1 },
};

const CONFIG_DEFAULT2 = {
  msize: [16, 16],
  seed: 11,
  lockCount: 1,
  enemyCount: 0,
  items: { "&": 1, $: 1, "!": 1 },
};

function levelFromConfig(conf) {
  const msize = conf.msize;
  const config = {
    rng: new LRNG(conf.seed),
    minSize: 6,
    margin: 0,
    idx: 0,
    edgeProb: 0.1,
    lockCount: conf.lockCount,
  };
  const { rooms, grid, paths, pazzle } = generateLevel(msize, config);
  // const grid2d = unflatten(grid, msize);
  const enemies = [...new Array(conf.enemyCount)].map(() => ({ char: "z" }));
  const items = [];
  Object.keys(conf.items).forEach((key) => {
    [...new Array(conf.items[key])].forEach(() => {
      items.push({ char: key });
    });
  });
  const pgrid = prepraeGrid(
    msize,
    rooms,
    paths,
    pazzle,
    enemies,
    items,
    config
  );
  const levelData = unflatten(pgrid, msize);
  return levelData;
}

function createLevel(i = 0) {
  let config = CONFIG_DEFAULT;
  if (i > 0) {
    config = JSON.parse(JSON.stringify(CONFIG_DEFAULT2));
    config.seed += i;
    config.enemyCount += Math.floor(i / 2);
    config.msize[0] += Math.floor(i / 2) * 2;
    config.msize[1] += Math.floor(i / 2) * 2;

    config.lockCount += Math.floor(i / 2);
    config.items["$"] += Math.floor(i / 2);
    config.items["&"] += Math.floor(i / 2);
    config.items["!"] += Math.floor(i / 2);

    config.msize = config.msize.map((v) => Math.min(48, v));
    config.lockCount = Math.min(9, config.lockCount);
    config.enemyCount = Math.min(16, config.enemyCount);
    config.items["$"] = Math.min(16, config.items["$"]);
    config.items["&"] = Math.min(16, config.items["$"]);
    config.items["!"] = Math.min(16, config.items["!"]);
  }
  const levelData = levelFromConfig(config);
  return levelData;
}

function checkIsMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function main() {
  const isMobile = checkIsMobile();
  const engine = new JEngine();

  let fs = false;
  if (isMobile || true) {
    const btnFs = document.getElementById("btn-fs");
    btnFs.addEventListener("click", () => {
      alert("Fullscreen");
      if (fs) {
        screen.orientation.unlock();
        fs = false;
      } else {
        document.body
          .requestFullscreen()
          .then(() => {
            fs = true;
          })
          .catch((err) => console.log(err));
      }
    });
  }

  const btnLevel = document.getElementById("btn-level");
  btnLevel.addEventListener("click", () => {
    const inputLevel = document.getElementById("input-level");
    const idx = Math.max(0, +inputLevel.value);
    loadLevel(idx);
  });
  let prevMinMapSize = engine.minMapSize;
  const fullSize = [100, 100];
  const btnMap = document.getElementById("btn-map");
  btnMap.addEventListener("click", () => {
    engine.minMapSize =
      engine.minMapSize === prevMinMapSize ? fullSize : prevMinMapSize;
    engine.renderMiniMap_();
  });

  function loadLevel(i) {
    const levelData = createLevel(i);
    engine.setUpLevel(levelData, `${i}`);
  }

  // engine.vsize = isMobile? [16,16] :[32, 32];
  // engine.minMapSize = isMobile? [16,16] :[32, 32];
  engine.setUpControls_();

  let level = 1;
  engine.onFinish = () => {
    level++;
    const levelData = createLevel(level);
    engine.setUpLevel(levelData, `${level}`);
  };

  // const levelData = [
  //   ["#", "#", "#", "#", "#", "#", "#", "#"],
  //   ["#", "&", "a", "#", "#", "#", ".", "#"],
  //   ["#", "S", ".", ".", "z", "A", ".", "#"],
  //   ["#", "$", "!", "#", "#", "#", "E", "#"],
  //   ["#", "#", "#", "#", "#", "#", "#", "#"],
  // ];
  const levelData = createLevel(level);

  engine.setUpLevel(levelData, `${level}`);
  window.je = engine;
}

main();
