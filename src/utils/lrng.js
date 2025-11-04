export class LRNG {
  m_w = 123456789;
  m_z = 987654321;
  mask = 0xffffffff;

  constructor(seed) {
    this.m_w = (123456789 + seed) & this.mask;
    this.m_z = (987654321 - seed) & this.mask;
  }

  random() {
    this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
    this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
    let result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  }
}

export function getRandomInt(min, max, rng=Math) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(rng.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export function shuffle(array, rng=Math) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(rng.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

export function pickIndices(n,count,rng=Math) {
  const samples = [...Array(count)].map((_,i) => i);
  shuffle(samples, rng);
  return samples.slice(0,n);
}

export function pickFromArray(n, array, rng=Math) {
  const samples = [...array];
  shuffle(samples, rng);
  return samples.slice(0,n);
}

export function pickOneFromArray(array, rng=Math) {
  const idx = getRandomInt(0, array.length, rng);
  return array[idx];
}