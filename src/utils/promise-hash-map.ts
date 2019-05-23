const promiseHashMap = async (hash, callback) => {
  const keys = Object.keys(hash);
  const result = {};

  for (const key of keys) {
    result[key] = await callback(key);
  }

  return result;
};

export default promiseHashMap;
