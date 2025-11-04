import { automatonStep } from "./automaton.js";
import {
  DIRECTION_CHARS,
  DIRECTIONS,
  ITEM_CHAR_ARR,
  KEY_CHAR_ARR,
  LEVEL_CHAR_NAMES,
  LEVEL_CHARS,
  LOCK_CHAR_ARR,
  MINIMAP_COLORS,
  SOLID_TILE_SET,
  SPRITE_TILE_SET,
} from "./constants.js";
import {
  createVColor,
  createView,
  renderItem,
  renderMapToView,
  renderMapToViewSprites2,
} from "./render.js";
import { posInside } from "./utils/graph.js";
import { vAdd } from "./utils/vec.js";

function findPosByValue(val, mdata, msize) {
  for (let r = 0; r < msize[0]; r++) {
    for (let c = 0; c < msize[1]; c++) {
      if (mdata[r][c] === val) {
        return [r, c];
      }
    }
  }
  return null;
}

function padVal(num, len = 2, val = "0") {
  num = `${num}`;
  if (num.length < len) {
    num = val.repeat(len - num.length) + num;
  }
  return num;
}

class JPlayer {
  constructor(pos, direction = 1) {
    this.pos = pos;
    this.direction = direction;
    this.hp = 100;
    this.maxHp = 100;
    this.items = [];// ["!"];
    this.itemIdx = 0;
  }
  changeDirection(offset) {
    this.direction = (4 + this.direction + offset) % 4;
  }
  getNextPosition() {
    const direction = DIRECTIONS[this.direction];
    const npos = vAdd(this.pos, direction);
    return npos;
  }
  hit(dmg) {
    this.hp = Math.max(0, this.hp - dmg);
  }
  heal(hp) {
    this.hp = Math.min(this.maxHp, this.hp + hp);
  }
  hasItem(item) {
    return this.items.indexOf(item) !== -1;
  }
  getItem() {
    if (this.itemIdx >= this.items.length) {
      return null;
    }
    return this.items[this.itemIdx];
  }
  addItem(item) {
    this.items.push(item);
    this.itemIdx = this.items.length - 1;
  }
  removeItem(idx = null) {
    if (idx === null) {
      idx = this.itemIdx;
    }
    this.items.splice(idx, 1);
    if (this.itemIdx >= idx) {
      this.itemIdx--;
      this.fixItemIdx_();
    }
  }
  scrollItem() {
    this.itemIdx++;
    this.fixItemIdx_();
  }
  fixItemIdx_() {
    this.itemIdx = Math.max(0, this.itemIdx);
    this.itemIdx = this.itemIdx % this.items.length;
  }
  toString() {
    return [
      `Pos: (${this.pos[0]},${this.pos[1]})`,
      `Hp: ${this.hp}/${this.maxHp}`,
      this.items
        .map((name, i) => (i === this.itemIdx ? `[${name}]` : name))
        .join(" "),
    ].join(" | ");
  }
}

export class JLevel {
  constructor() {
    this.data = null;
    this.rdata = null;
    this.sdata = null;
    this.msize = null;
    this.name = null;
  }
  init(data, name) {
    this.data = data;
    this.name = name;
    this.msize = [data.length, data[0].length];
    this.update();
  }
  isPosInside(pos) {
    return posInside(pos, this.msize);
  }
  getValAt(pos) {
    return this.data[pos[0]][pos[1]];
  }
  setValAt(pos, val) {
    this.data[pos[0]][pos[1]] = val;
  }
  getRAt(pos) {
    return this.rdata[pos[0]][pos[1]];
  }
  update() {
    // regenerate
    this.rdata = this.data.map((r) =>
      r.map((v) => (SOLID_TILE_SET.has(v) ? 1 : 0))
    );
    this.sdata = this.data.map((r) =>
      r.map((v) => (SPRITE_TILE_SET.has(v) ? 1 : 0))
    );
  }
  toData_(player, size_) {
    const size = [
      Math.min(size_[0], this.msize[0]),
      Math.min(size_[1], this.msize[1]),
    ];
    const ppos = player.pos;

    const hsize = [size[0] / 2, size[1] / 2].map((v) => Math.floor(v));
    const prefStart = [ppos[0] - hsize[0], ppos[1] - hsize[1]];
    const maxStart = [this.msize[0] - size[0], this.msize[1] - size[1]];
    const start = [
      Math.max(0, Math.min(prefStart[0], maxStart[0])),
      Math.max(0, Math.min(prefStart[1], maxStart[1])),
    ];
    const data_ = [];
    for (let r = 0; r < size[0]; r++) {
      const row = [];
      const ri = r + start[0];
      for (let c = 0; c < size[1]; c++) {
        const ci = c + start[1];
        const v = this.data[ri][ci];
        row.push(
          ri === ppos[0] && ci === ppos[1]
            ? DIRECTION_CHARS[player.direction]
            : v
        );
      }
      data_.push(row);
    }
    return data_;
  }
  toString(player, size_) {
    const data_ = this.toData_(player, size_);
    return data_.map((r) => r.join("")).join("\n");
  }
}

export class JEngine {
  constructor() {
    this.level = new JLevel();
    this.player = new JPlayer([1, 1]);
    this.messages = [];
    this.vsize = [16, 16];
    this.fMaxDistance = 8.0;
    this.minMapSize = [16, 16];
    this.statsInfo = {
      timer: 0,
      interval: null,
      maxScore: 0,
    };
    this.onWin = null;
    this.onLose = null;
    this.turnInterpolation = 6;
  }
  // controls
  setUpControls_() {
    const handlers = {
      w: () => this.handleMoveForward_(),
      a: () => this.handleTurnDirection_(-1),
      d: () => this.handleTurnDirection_(1),
      s: () => this.handleTurnDirection_(2),
      e: () => this.handleInteract_(),
      q: () => this.handleScrollItem_(),
    };
    document.addEventListener("keydown", (e) => {
      
      const key = e.key.toLocaleLowerCase();
      if (key in handlers) {
        e.preventDefault();
        handlers[key]();
      }
    });

    const btn_forward = document.getElementById("btn-forward");
    const btn_left = document.getElementById("btn-left");
    const btn_right = document.getElementById("btn-right");
    const btn_turn = document.getElementById("btn-turn");
    const btn_interact = document.getElementById("btn-interact");
    const btn_scroll = document.getElementById("btn-scroll");
    btn_forward.addEventListener("click", () => handlers["w"]());
    btn_left.addEventListener("click", () => handlers["a"]());
    btn_right.addEventListener("click", () => handlers["d"]());
    btn_turn.addEventListener("click", () => handlers["s"]());
    btn_interact.addEventListener("click", () => handlers["e"]());
    btn_scroll.addEventListener("click", () => handlers["q"]());
  }
  setUpStats_() {
    if (this.statsInfo.interval) {
      clearInterval(this.statsInfo.interval);
    }
    this.statsInfo.timer = 0;
    this.statsInfo.interval = setInterval(() => {
      this.statsInfo.timer++;
      this.renderStats();
    }, 1000);
  }
  handleMoveForward_() {
    const npos = this.player.getNextPosition();
    if (!this.level.isPosInside(npos)) {
      this.addMessage(`Cannot move here`);
      return;
    }
    const rval = this.level.getRAt(npos);
    if (rval) {
      this.addMessage(`Cannot move here`);
      return;
    }
    const val = this.level.getValAt(npos);
    if (val === "z") {
      this.addMessage(`The path is blocked by enemy`);
      return;
    }
    this.player.pos = npos;
    this.update();
    this.render();
  }
  handleTurnDirection_(offset) {
    const startDirection = this.player.direction;
    this.player.changeDirection(offset);
    const endDirection  = this.player.direction;
    this.update();
    // this.render();
    this._interpolateDirection(startDirection,endDirection, this.turnInterpolation);
  }
  _interpolateDirection(startDirection, endDirection, count=2) {
    const dir0 = DIRECTIONS[startDirection];
    const dir1 = DIRECTIONS[endDirection];
    const directions = [...new Array(count)].map((_,i)=>((i+1)/(count))).map((f) => [dir0[0]*(1-f)+dir1[0]*f, dir0[1]*(1-f)+dir1[1]*f])
    let i = 0;
    const renderTurn = () => {
      if (i >= directions.length) {
        this.player.dir_ = null;
        this.render();
        return;
      }
      this.player.dir_ = directions[i++];
      this.renderFirstPersonView_();
      setTimeout(renderTurn, 200/count);
    }
    setTimeout(renderTurn, 200/count);
  }
  handleInteract_() {
    const npos = this.player.getNextPosition();
    if (!this.level.isPosInside(npos)) {
      this.addMessage(`Cannot interact here`);
      return;
    }
    const val = this.level.getValAt(npos);
    // check if lock
    // check if item
    // check if enemy
    // check if START/EXIT
    if (LOCK_CHAR_ARR.includes(val)) {
      // check have a key
      if (this.player.hasItem(val.toLocaleLowerCase())) {
        this.level.setValAt(npos, LEVEL_CHARS.PATH);
        this.addMessage(`Opened ${LEVEL_CHAR_NAMES[val] ?? val}`);
      } else {
        this.addMessage(`The door is locked with ${LEVEL_CHAR_NAMES[val] ?? val}`);
      }
    } else if (KEY_CHAR_ARR.includes(val) || ITEM_CHAR_ARR.includes(val)) {
      this.player.addItem(val);
      this.level.setValAt(npos, LEVEL_CHARS.PATH);
      this.addMessage(`Found ${LEVEL_CHAR_NAMES[val] ?? val}`);
    } else if (val === LEVEL_CHARS.ENEMY) {
      this.level.setValAt(npos, LEVEL_CHARS.PATH);
      this.addMessage(`Defeated ${LEVEL_CHAR_NAMES[val] ?? val}`);
    } else if (this.tryUseItem_()) {
    } else if (val === LEVEL_CHARS.START) {
      this.addMessage(`This is ${LEVEL_CHAR_NAMES[val] ?? val}`);
    } else if (val === LEVEL_CHARS.EXIT) {
      this.handleLevelFinished();
    } else {
      this.addMessage(`Cannot interact here`);
    }
    this.update();
    this.render();
  }
  handleLevelFinished() {
    const t = this.statsInfo.timer;
    const timeStr = `${padVal(Math.floor(t / 60))}:${padVal(t % 60)}`;
    const score = this.player.items.filter(
      (item) => item === LEVEL_CHARS.MONEY
    ).length;
    const maxScore = this.statsInfo.maxScore;

    this.addMessage(`Level Finished!\nTime: ${timeStr}\nScore: ${score}\\${maxScore}`);
    this.onWin?.();
  }
  tryUseItem_() {
    const item = this.player.getItem();
    if (!item) {
      return false;
    }
    if (item === "&") {
      this.player.heal(20);
      this.player.removeItem();
      this.addMessage(`Used ${LEVEL_CHAR_NAMES[item] ?? item}`);
      this.renderStats();
      return true;
    } else if (item === LEVEL_CHARS.SWORD) {
      const dir = DIRECTIONS[this.player.direction];
      const npos = vAdd(vAdd(this.player.pos, dir), dir);
      if (!this.level.isPosInside(npos)) {
        this.addMessage(`Cannot interact here`);
        return;
      }
      const val = this.level.getValAt(npos);
      if (val === LEVEL_CHARS.ENEMY) {
        this.level.setValAt(npos, LEVEL_CHARS.PATH);
        this.addMessage(`Defeated ${LEVEL_CHAR_NAMES[val] ?? val}`);
        this.player.removeItem();
        this.update();
        this.render();
        return true;
      }
    }
    return false;
  }
  handleScrollItem_() {
    this.player.scrollItem();
    this.renderStats();
    this.render();
  }
  addMessage(text) {
    this.messages.push(text);
    if (this.messages.length > 10) {
      this.messages.shift();
    }
    const logEl = document.getElementById("messages");
    logEl.innerHTML = this.messages.join("<br/>");
    logEl.scrollTop = logEl.scrollHeight;
  }
  // load level
  setUpLevel(data, levelName) {
    this.level = new JLevel();
    this.level.init(data, levelName);
    const pos = findPosByValue(
      LEVEL_CHARS.START,
      this.level.data,
      this.level.msize
    );
    this.player = new JPlayer(pos);
    this.statsInfo.maxScore = this.level.data.flat().filter(
      (item) => item === LEVEL_CHARS.MONEY
    ).length;
    this.render();
    this.renderStats();
    this.setUpStats_();
  }
  // update
  update() {
    // update automaton
    automatonStep(
      this.player,
      this.level.data,
      this.level.rdata,
      this.level.msize,
      3
    );
    this.handleEvents();
    this.level.update();
  }
  handleEvents() {
    const ppos = this.player.pos;
    
    for (const direction of DIRECTIONS) {
      const npos = [ppos[0] + direction[0], ppos[1] + direction[1]];

      if (!this.level.isPosInside(npos)) {
        continue;
      }
      const val = this.level.getValAt(npos);
      if (val === LEVEL_CHARS.ENEMY) {
        this.player.hit(20);
        this.addMessage(`Taken 20dmg from ${LEVEL_CHAR_NAMES[val] ?? val}`);
        this.effect("glitch");
        if (this.player.hp <= 0) {
          this.addMessage(`Game over, restarting...`);
          this.onLose?.();
        }
      }
    }
    if (this.level.getValAt(ppos) === LEVEL_CHARS.EXIT) {
      this.handleLevelFinished();
    }
    // pick items
    const pval = this.level.getValAt(ppos);
    if (KEY_CHAR_ARR.includes(pval) || ITEM_CHAR_ARR.includes(pval)) {
      this.player.addItem(pval);
      this.level.setValAt(ppos, LEVEL_CHARS.PATH);
      this.addMessage(`Found ${LEVEL_CHAR_NAMES[pval] ?? pval}`);
    }
  }
  // render
  render() {
    // render minimap
    this.renderMiniMap_();
    // render fp
    const fpv = this.renderFirstPersonView_();

    // this.renderGrid_(fpv);
  }
  renderMiniMap_() {
    // const minimapEl = document.getElementById("minimap");
    // minimapEl.textContent = this.level.toString(this.player, this.minMapSize);

    const data = this.level.toData_(this.player, this.minMapSize);
    const dsize = [data.length, data[0].length];
    const minimapEl = document.getElementById("minimap-color");
    minimapEl.innerHTML = "";
    minimapEl.style = `
    grid-template-rows: repeat(${dsize[0]}, 1fr);
    grid-template-columns: repeat(${dsize[1]}, 1fr);
    `;
    data.forEach((r, ri) => {
      r.forEach((v, ci) => {
        const span = document.createElement("span");
        if (MINIMAP_COLORS[v]) {
          span.style.color = MINIMAP_COLORS[v];
        }

        span.textContent = v;
        minimapEl.appendChild(span);
      });
    });
  }
  renderFirstPersonView_() {
    const view = createView(this.vsize);
    const vcolor = createVColor(this.vsize);
    const vpos = this.player.pos.map((v) => v + 0.5);
    const vdir = this.player.dir_ ?? DIRECTIONS[this.player.direction];
    renderMapToView(
      vpos,
      vdir,
      view,
      this.vsize,
      this.level.rdata,
      this.level.msize,
      Math.PI / 2,
      this.fMaxDistance,
      vcolor,
    );
    renderMapToViewSprites2(
      vpos,
      vdir,
      view,
      this.vsize,
      this.level.data,
      this.level.rdata,
      this.level.sdata,
      this.level.msize,
      this.fMaxDistance,
      vcolor
    );
    const selectedItem = this.player.getItem();
    if (selectedItem) {
      renderItem(selectedItem, view, this.vsize, vcolor);
    }
    // const viewEl = document.getElementById("view");
    // viewEl.textContent = view.map((r) => r.join("")).join("\n");

    this.renderGrid_(view, vcolor);

    // solid
    // sprites
    // items
    return view;
  }
  renderGrid_(fpv,vcolor=null) {
    const viewEl = document.getElementById("view-color");
    viewEl.innerHTML = "";
    viewEl.style = `
    grid-template-rows: repeat(${this.vsize[0]}, 1fr);
    grid-template-columns: repeat(${this.vsize[1]}, 1fr);
    `;
    fpv.forEach((r, ri) => {
      r.forEach((v, ci) => {
        const span = document.createElement("span");
        if (vcolor && vcolor[ri][ci]) {
          span.style.color = vcolor[ri][ci];
        }
        span.textContent = v;
        viewEl.appendChild(span);
      });
    });
  }
  renderStats() {
    const t = this.statsInfo.timer;
    const parts = [
      `Lvl:${this.level.name}`,
      `Time: ${padVal(Math.floor(t / 60))}:${padVal(t % 60)}`,
      this.player.toString(),
    ];
    const statsEl = document.getElementById("stats");
    statsEl.textContent = parts.join(" || ");
  }

  // Effects
  effect(name, viewId='view-color') {
    const view = document.getElementById(viewId);
    view.classList.add(name);
    setInterval(() => {
      view.classList.remove(name);
    }, 500);
  }
}
