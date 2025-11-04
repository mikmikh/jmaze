export function vEq(lhs, rhs) {
  return lhs.every((_, i) => lhs[i] === rhs[i]);
}
export function vAdd(lhs, rhs) {
  return lhs.map((_, i) => lhs[i] + rhs[i]);
}
export function sMul(vec, scalar) {
  return vec.map((v) => v * scalar);
}
export function vRotate(v, a) {
  const sin = Math.sin(a);
  const cos = Math.cos(a);
  return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos];
}