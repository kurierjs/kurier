import { Resource, ResourceRelationships } from "../../../../src"

export const getFactoryObject =
  (array: any[], key: string = 'id') => (id: string | number): Resource =>
    array.find(object => object[key] == id);

export const getFactoryObjects =
  (array: any[], key: string = 'id') => (ids: (string | number)[]): Resource[] =>
    array.filter(object => ids.includes(object[key]))

    export const getExtraRelationships =
  (array: any[], relationshipName?:string, key: string = 'id',) =>
  (ids: (string | number)[], format:'Array'|'Object' ='Array'): ResourceRelationships => {
    const relationship = format==='Object'? {
      id:getFactoryObject(array, key)(ids[0]).id,
      type: getFactoryObject(array, key)(ids[0]).type
    } : getFactoryObjects(array, key)(ids).map(({id,type})=>({id,type}))

     return {
       [relationshipName]: {
         data: relationship
      }
    }
  }
