export default async function promiseHash(object = {}) {
  const promises = await Promise.all(
    Object.entries(object).map(async ([key, value]) => {
      return {
        key,
        value: await value
      };
    })
  );

  return promises.reduce((acc, { key, value }) => {
    return { ...acc, [key]: value };
  }, {});
}
