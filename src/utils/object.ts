const isEmptyObject = (obj: object | undefined) => obj && Object.keys(obj).length === 0;

function isEquivalent(a: object, b: object) {
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (let key of aKeys) {
    if (!b.hasOwnProperty(key) || !isEquivalent(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

export { isEmptyObject, isEquivalent };
