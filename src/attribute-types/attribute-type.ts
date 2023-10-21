import { ApplicationAttributeInstantiatedTypeClass, ApplicationAttributeTypeOptions } from "../types";
import { capitalize } from "../utils/string";

export default function AttributeType<StoredDataType = string, JsonDataType = StoredDataType>(
  name: string,
  options: ApplicationAttributeTypeOptions<StoredDataType, JsonDataType>,
) {
  const { jsonType, serialize, deserialize } = options;
  let attributeClass: NewableFunction;

  if (jsonType === Object) {
    attributeClass = class ThisAttributeTypeDefinition implements ApplicationAttributeInstantiatedTypeClass {
      isSensitive: boolean = options.isSensitive || false;
      serialize(value: StoredDataType): JsonDataType {
        return value as unknown as JsonDataType;
      }
      deserialize(value: JsonDataType): StoredDataType {
        return value as unknown as StoredDataType;
      }
    };
  } else {
    attributeClass = class ThisAttributeTypeDefinition
      extends jsonType
      implements ApplicationAttributeInstantiatedTypeClass
    {
      isSensitive: boolean = options.isSensitive || false;
      serialize(value: StoredDataType): JsonDataType {
        return value as unknown as JsonDataType;
      }
      deserialize(value: JsonDataType): StoredDataType {
        return value as unknown as StoredDataType;
      }
    };
  }

  if (serialize) {
    attributeClass.prototype.serialize = serialize.bind(attributeClass.prototype);
  }

  if (deserialize) {
    attributeClass.prototype.deserialize = deserialize.bind(attributeClass.prototype);
  }

  Object.defineProperty(attributeClass, "name", { value: `${capitalize(name)}` });

  return attributeClass;
}
