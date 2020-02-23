import { Resource } from "../../../../src"

export const getFactoryObject =
  (array: any[], key: string = 'id') => (id: string | number): Resource =>
    array.find(object => object[key] == id);

export const getFactoryObjects =
  (array: any[], key: string = 'id') => (ids: (string | number)[]): Resource[] =>
    array.filter(object => ids.includes(object[key]))