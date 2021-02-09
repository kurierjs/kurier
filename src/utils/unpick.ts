import pick from "./pick";

const unpick = <R = Record<string, unknown>, T = Record<string, unknown>>(object: R, list: string[] = []): T => {
  return pick(object, Object.keys(object).filter(key => !list.includes(key)));
};

export default unpick;
