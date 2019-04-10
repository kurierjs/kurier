const pick = (object = {}, list = []): {} => {
  return list.reduce((acc, key) => {
    const hasProperty = object.hasOwnProperty(key);
    return hasProperty ? { ...acc, [key]: object[key] } : acc;
  }, {});
};

export default pick;
