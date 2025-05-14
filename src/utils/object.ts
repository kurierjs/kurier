const isEmptyObject = (obj: object | undefined) => obj && Object.keys(obj).length === 0;

export { isEmptyObject };
