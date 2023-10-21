const promiseHashMap = async (hash: Record<string, unknown>, callback: (key: string | number) => Promise<unknown>) => {
  const keys = Object.keys(hash);
  const result = {};

  for (const key of keys) {
    result[key] = await callback(key);
  }

  return result;
};

export default promiseHashMap;
