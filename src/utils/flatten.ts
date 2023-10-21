// Thanks 30 seconds of code...
// https://github.com/30-seconds/30-seconds-of-code#flatten

export default function flatten(arr: unknown[], depth = 1) {
  return arr.reduce((a: unknown[], v) => a.concat(depth > 1 && Array.isArray(v) ? flatten(v, depth - 1) : v), []);
}
