import { Resource, ResourceRelationships } from "../../../../src";

export const getFactoryObject =
  (array: any[], key = "id") =>
  (id: string | number): Resource =>
    array.find((object) => object[key] == id);

export const getFactoryObjects =
  (array: any[], key = "id") =>
  (ids: (string | number)[]): Resource[] =>
    array.filter((object) => ids.includes(object[key]));

export const getExtraRelationships =
  (array: any[], relationshipName?: string, key = "id") =>
  (ids: (string | number)[], format: "Array" | "Object" = "Array"): ResourceRelationships => {
    if (format === "Object") {
      return {
        [relationshipName!]: {
          data: {
            id: getFactoryObject(array, key)(ids[0]).id as string,
            type: getFactoryObject(array, key)(ids[0]).type,
          },
        },
      };
    }

    return {
      [relationshipName!]: {
        data: getFactoryObjects(array, key)(ids).map(({ id, type }) => ({ id, type } as { id: string; type: string })),
      },
    };
  };
