export class HeapLite {
  constructor(compare = (lhs, rhs) => lhs - rhs) {
    this.compare_ = compare;
    this.heap_ = [];
  }

  _left(i) {
    return 2 * i + 1;
  }
  _right(i) {
    return 2 * i + 2;
  }
  _parent(i) {
    return Math.floor((i - 1) / 2);
  }
  _less(i, j) {
    return this.compare_(i, j) < 0;
  }

  push(value) {
    this.heap_.push(value);
    this._heapifyUp(this.heap_.length - 1);
  }
  pushMany(...values) {
    for (const value of values) {
      this.push(value);
    }
  }
  peek() {
    return this.heap_[0];
  }
  empty() {
    return this.heap_.length == 0;
  }
  length() {
    return this.heap_.length;
  }
  pop() {
    const res = this.heap_[0];
    if (this.heap_.length > 1) {
      this.heap_[0] = this.heap_[this.heap_.length - 1];
      this.heap_.pop();
      this._heapifyDown(0);
    } else {
      this.heap_.pop();
    }
    return res;
  }

  _heapifyUp(i) {
    while (i > 0) {
      let parent = this._parent(i);
      if (this._less(this.heap_[i], this.heap_[parent])) {
        [this.heap_[i], this.heap_[parent]] = [
          this.heap_[parent],
          this.heap_[i],
        ];
        i = parent;
      } else {
        break;
      }
    }
  }
  _heapifyDown(i) {
    while (i < this.heap_.length) {
      const left = this._left(i);
      const right = this._right(i);
      if (left >= this.heap_.length) {
        break;
      }
      let smallestChild = left;
      if (right < this.heap_.length) {
        smallestChild = this._less(this.heap_[left], this.heap_[right])
          ? left
          : right;
      }

      if (this._less(this.heap_[smallestChild], this.heap_[i])) {
        [this.heap_[i], this.heap_[smallestChild]] = [
          this.heap_[smallestChild],
          this.heap_[i],
        ];
        i = smallestChild;
      } else {
        break;
      }
    }
  }
  remove(elem) {
    const idx = this.heap_.findIndex(
      (lhs) => Math.abs(this.compare_(lhs, elem)) < 1e-9
    );
    if (idx == -1) {
      return false;
    }
    this._remove(idx);
    return true;
  }
  _remove(i) {
    this.heap_[i] = this.heap_[this.heap_.length - 1];
    this.heap_.pop();
    this._heapifyDown(i);
  }
}

// function main() {
//     const heap = new HeapLite();
//     heap.pushMany(...[5, 2, 3, 10, 12, 0, -2])
//     heap.remove(3);
//     while(!heap.empty()) {
//         const elem = heap.pop();
//         console.log("elem: " + elem);
//     }
// }

// main();
