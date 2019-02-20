### author/resource.ts

```ts
import { Resource } from "@ebryn/jsonapi-ts";

export default class Author extends Resource {
  public attributes: {
    name: string;
  };
}
```

### book/author.ts

```ts
import { Resource } from "@ebryn/jsonapi-ts";

export default class Book extends Resource {
  public attributes: {
    name: string;
  };

  public relationships: {
    author: {
      data: { id: string; type: "author" };
    };
  };
}
```

### book/processor.ts

```ts
import { KnexProcessor, Operation } from "@ebryn/jsonapi-ts";
import { relateOneToOne } from "../../utils/relate";
import { sideloadOneFrom } from "../../utils/sideload";
import Book from "./resource";

export default class BookProcessor extends KnexProcessor<Book> {
  public resourceClass = Book;

  public async get(op: Operation): Promise<Book[]> {
    // Get raw data first.
    const data = await super.get(op);

    // Move relationship foreign keys to relationship objects.
    // This would have to be done probably with "reflect-metadata"
    // targeting the resource definition.
    const dataWithRelationships = await Promise.all([
      ...relateOneToOne(data, {
        authorId: "author",
      })
    ]);

    // This calls processor.include() to buffer up any necessary includes.
    await sideloadOneFrom(dataWithRelationships, this);

    return dataWithRelationships as Book[];
  }
}
```

### utils/relate.ts

```ts
// Converts relationship ID fields into JSONAPI relationship objects.

import { Resource } from "@ebryn/jsonapi-ts";

export function relateOneToOne(
  data: Resource[],
  relationships: {
    [key: string]: string;
  }
) {
  return data.map(async resource => {
    const dataWithRelationships = { ...resource, relationships: {} };

    Object.keys(relationships).forEach(foreignKey => {
      const foreignType = relationships[foreignKey];

      if (resource.attributes[foreignKey]) {
        dataWithRelationships.relationships[foreignType] = {
          data: {
            id: resource.attributes[foreignKey],
            type: foreignType
          }
        };

        delete resource.attributes[foreignKey];
      }
    });

    return dataWithRelationships;
  });
}
```

### utils/sideload.ts

```ts
// Loads any resources defined by 1-1 relationships and buffers them with processor.include().

import { Operation, OperationProcessor, Resource } from "@ebryn/jsonapi-ts";

export function sideloadOneFrom(
  resources: Resource[],
  processor: OperationProcessor
) {
  return Promise.all(
    resources.map(async resource => {
      const foreignTypes = Object.keys(resource.relationships);

      if (!foreignTypes.length) {
        return;
      }

      return Promise.all(
        foreignTypes.map(async foreignType => {
          const [sideloadedResource] = await processor.app.executeOperations([
            {
              op: "get",
              ref: resource.relationships[foreignType].data
            } as Operation
          ]);

          processor.include(sideloadedResource.data as Resource[]);
        })
      );
    })
  );
}
```
