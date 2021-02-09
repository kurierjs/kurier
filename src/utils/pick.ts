const pick = <R = Record<string, unknown>, T = Record<string, unknown>>(object: R, list: string[] = []): T => {
  return list.reduce((acc, key) => {
    const hasProperty = key in object;
    return hasProperty ? { ...acc, [key]: object[key] } : acc;
  }, {}) as T;
};

export default pick;
