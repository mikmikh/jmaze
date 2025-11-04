


export class LDSS {
    constructor(count) {
        this.count = count;
        this.parent = {};
        this.rank = {};
        this.setUp();
    }
    setUp() {
        for (let i = 0; i < this.count; i++) {
            this.parent[i]=i;
            this.rank[i]=0;
        }
    }
    find(v) {
        if (v !== this.parent[v]) {
            this.parent[v] = this.find(this.parent[v]);
        }
        return this.parent[v];
    }
    union(a,b) {
        a = this.find(a);
        b = this.find(b);
        if (a === b) {
            return;
        }
        if (this.rank[a] < this.rank[b]) {
            this.parent[a]=b;
        } else if (this.rank[a] > this.rank[b]) {
            this.parent[b]=a;
        } else {
            this.parent[b]=a;
            this.rank[b]++;
        }
    }
};