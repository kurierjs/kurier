import pick from "./pick";

const unpick = (object = {}, list = []): {} => {
  return pick(object, Object.keys(object).filter(key => !list.includes(key)));
};

export default unpick;
