const pick = <R = Record<string, unknown>, T = Record<string, unknown>>(object: R, list: string[] = []): T => {
  return list.reduce((acc, key) => {
    const hasProperty = key in object;
    if (!hasProperty) return acc;
    acc[key] = object[key];
    return acc;
  }, {}) as T;
};

export default pick;
