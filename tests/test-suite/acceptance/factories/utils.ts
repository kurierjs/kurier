export const getFactoryObject = (array: any[], key: string = 'id') => (id: string | number): any =>
  array.find(object => object[key] == id)

export const getFactoryObjects = (array: any[], key: string = 'id') => (ids: (string | number)[]): any[] =>
  array.filter(object => ids.includes(object[key]))