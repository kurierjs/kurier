const promiseHashMap = async (hash, callback) => {
  const keys = Object.keys(hash);
  const promises = await Promise.all(
    keys.map(async key => {
      return {
        key,
        value: await callback(key)
      };
    })
  );

  return promises.reduce((accum, { key, value }) => {
    return { ...accum, [key]: value };
  }, {});
};

export default promiseHashMap;
