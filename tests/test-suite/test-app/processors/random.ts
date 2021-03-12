import Random from "../resources/random";
import { OperationProcessor, HasId, Operation } from "../kurier";
import { JsonApiErrors } from "../kurier";

const randomDataGenerator = {
  number: () => ({ randomNumber: Math.random() }),
  string: () => ({ randomString: parseInt(Math.random().toString().split(".")[1]).toString(16) }),
  date: () => ({ randomDate: new Date(1602518929 + Math.random() * 10000000000000).toJSON() })
}

export default class RandomProcessor<ResourceT extends Random> extends OperationProcessor<ResourceT> {
  static resourceClass = Random;

  async get(op: Operation): Promise<HasId | HasId[]> {
    if (op.ref.id in randomDataGenerator) {
      return {
        id: op.ref.id,
        ...randomDataGenerator[op.ref.id]()
      }
    } else {
      throw JsonApiErrors.BadRequest(`Allowed random data generators: ${Object.keys(randomDataGenerator).join(", ")}`);
    }
  }
}
