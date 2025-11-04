
export class BSPNode {
    // rng, minSize, margin, idx
  constructor(pos, size, config) {
    this.pos = pos;
    this.size = size;
    this.left = null;
    this.right = null;

    this.config = config;
    this.idx = config.idx++;
  }
  canSplit_(idx) {
    return this.size[idx] >= this.config.minSize * 2;
  }
  canBecomeLeaf() {
    return this.size[0] < this.config.minSize * 3 && this.size[1] < this.config.minSize * 3;
  }
  splitByIdx_(idx) {
    const { minSize, rng } = this.config;
    const gap = this.size[idx] - minSize * 2;
    const point = minSize + Math.floor(rng.random() * gap);
    const lpos = [this.pos[0], this.pos[1]];
    const lsize = [this.size[0], this.size[1]];
    lsize[idx] = point;
    const rpos = [this.pos[0], this.pos[1]];
    rpos[idx] += point;
    const rsize = [this.size[0], this.size[1]];
    rsize[idx] = this.size[idx] - point;

    this.left = new BSPNode(lpos, lsize, this.config);
    this.right = new BSPNode(rpos, rsize, this.config);
  }
  split() {
    const { rng } = this.config;
    if (this.canBecomeLeaf() && rng.random() < 0.5) {
        return;
    }
    const splitIdxs = [];
    if (this.canSplit_(0)) {
      splitIdxs.push(0);
    }
    if (this.canSplit_(1)) {
      splitIdxs.push(1);
    }
    if (!splitIdxs.length) {
      return;
    }
    const ridx = Math.floor(rng.random() * splitIdxs.length);
    this.splitByIdx_(splitIdxs[ridx]);

    this.left && this.left.split();
    this.right && this.right.split();
  }
  getLeaves(res = []) {
    if (!this.left && !this.right) {
      res.push(this);
      return res;
    }
    this.left.getLeaves(res);
    this.right.getLeaves(res);
    return res;
  }
  getRandomLeaf() {
    if (!this.left && !this.right) {
        return this;
    }
    const {rng} = this.config;
    return rng.random() < 0.5 ? this.left.getRandomLeaf() : this.right.getRandomLeaf();
  }
  getLeavesToConnect(res = []) {
    if (!this.left && !this.right) {
      return res;
    }
    const lhs = this.left.getRandomLeaf();
    const rhs = this.right.getRandomLeaf();
    res.push([lhs,rhs]);
  }
}

function nodeToRoom(node) {
  const { minSize, rng, margin } = node.config;
  const minRoomSize = minSize - margin *2 -1;
  const rsize = node.size.map(
    (s, i) =>
      minRoomSize +
      Math.floor((node.size[i] - margin * 2 - minRoomSize) * rng.random())
  );
  const rpos = node.size.map(
    (s, i) =>
      node.pos[i]+margin + Math.floor((node.size[i] - rsize[i] - margin * 2) * rng.random())
  );

  return {pos:rpos,size:rsize};
}
