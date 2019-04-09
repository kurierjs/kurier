# jsonapi-ts

> _We need a better name!_

This is a TypeScript framework to create APIs following the [1.1 Spec of JSONAPI](https://jsonapi.org/format/1.1/) + the [Operations proposal spec](https://github.com/json-api/json-api/blob/999e6df77b28549d6c37b163b73c8e9102400020/_format/1.1/index.md#operations).

## Features

- **Operation-driven API:** JSONAPI is transport-layer independent, so it can be used for HTTP, WebSockets or any transport protocol of your choice.
- **Declarative style for resource definition:** Every queryable object in JSONAPI is a resource, a representation of data that may come from any source, be it a database, an external API, etc. JSONAPI-TS defines these resources in a declarative style.
- **CRUD database operations:** Baked into JSONAPI-TS, there is an operation processor which takes care of basic CRUD actions by using [Knex](https://knexjs.org/). This allows the framework to support any database engine compatible with Knex. Also includes support for filtering fields by using common SQL operators, sorting and pagination.
- **Transport layer integrations:** JSONAPI-TS includes a middleware for [Koa](https://koajs.com) to automatically add HTTP endpoints for each declared resource and processor.
- **Relationships and sideloading:** Resources can be related with `belongsTo` / `hasMany` helpers on their declarations. JSONAPI-TS provides proper, compliant serialization to connect resources and even serve them all together on a single response.
- **Error handling:** The framework includes some basic error responses to handle cases equivalent to HTTP status codes 401 (Unauthorized), 403 (Forbidden), 404 (Not Found) and 500 (Internal Server Error).
- **User/Role presence authorization:** By building on top of the decorators syntax, JSONAPI-TS allows you to inject user detection on specific operations or whole processors. The framework uses JSON Web Tokens as a way of verifying if a user is valid for a given operation.
- **Extensibility:** Both resources and processors are open classes that you can extend to suit your use case. For example, do you need to serialize an existing, external API into JSONAPI format? Create a `MyExternalApiProcessor` extending from `OperationProcessor` and implement the necessary calls _et voilà!_.

## Getting started

> ℹ️ The following examples are written in TypeScript.

1. Install `jsonapi-ts` with `npm` or `yarn`:

   ```bash
   $ npm i @ebryn/jsonapi-ts
   ```

   ```bash
   $ yarn add @ebryn/jsonapi-ts
   ```

2. Create a Resource:

   ```ts
   // resources/author.ts
   import { Resource } from "@ebryn/jsonapi-ts";

   export default class Author extends Resource {
     static schema = {
       attributes: {
         firstName: String,
         lastName: String
       }
     };
   }
   ```

3. Create an Application and inject it into your server. For example, let's say you've installed Koa in your Node application and want to expose JSONAPI via HTTP:

   ```ts
   import {
     Application,
     jsonApiKoa as jsonApi,
     KnexProcessor
   } from "@ebryn/jsonapi-ts";
   import Koa from "koa";

   import Author from "./resources/author";

   const app = new Application({
     namespace: "api",
     types: [Author],
     defaultProcessor: new KnexProcessor(/* knex options */)
   });

   const api = new Koa();

   api.use(jsonApi(app));

   api.listen(3000);
   ```

4. Run the Node app, open a browser and navigate to `http://localhost:3000/api/authors`. You should get an empty response like this:

   ```json
   {
     "data": [],
     "included": []
   }
   ```

5. Add some data to the "authors" table and go back to the previous URL. You'll start seeing your data!

   ```json
   {
     "data": [
       {
         "id": 1,
         "type": "author",
         "attributes": {
           "firstName": "John",
           "lastName": "Katzenbach"
         }
       }
     ],
     "included": []
   }
   ```

## Resources

### What is a resource?

A resource can be understood as follows:

> Any information that can be named can be a resource: a document or image, a temporal service (e.g. “today’s weather in Los Angeles”), a collection of other resources, a non-virtual object (e.g. a person), and so on. In other words, (...) A resource is a conceptual mapping to a set of entities (...).

<p align="right"><sup><i><b>Source:</b> <a href="https://www.ics.uci.edu/~fielding/pubs/dissertation/fielding_dissertation.pdf">Architectural Styles and the Design of Network-based Software Architectures"; Fielding, R.; 2000; p. 88</a></i></sup></p>

A resource is comprised of:

#### A unique identifier

It distinguishes a given resource from another. Usually it manifests as auto-incremental integer numbers, [GUIDs or UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier).

#### A type

A type is a human-readable name that describes the kind of entity the resource represents.

#### A list of attributes

An attribute is something that helps describe different aspects of a resource. For example, if we're creating a _Book_ resource, some possible attributes would be its _title_, its _year of publication_ and its _price_.

#### A list of relationships

A resource can exist on its own or be expanded through relations with other resources. Following up on our _Book_ resource example, we could state that a book _belongs to_ a certain author. That _author_ could be described as a resource itself. On a reverse point of view, we could also state than an author _has many_ books.

### Declaring a resource

This is how our _Book_ resource would look like, without relationships:

```ts
// resources/book.ts
import { Resource } from "@ebryn/jsonapi-ts";

export default class Book extends Resource {
  // The *type* is usually inferred automatically from the resource's
  // class name. Nonetheless, if we need/want to, we can override it.
  static get type(): string {
    return "libraryBook";
  }

  // Every field we declare in a resource is contained in a *schema*.
  // A schema comprises attributes and relationships.
  static schema = {
    attributes: {
      // An attribute has a name and a primitive type.
      // Accepted types are String, Number and Boolean.
      title: String,
      yearOfPublication: Number,
      price: Number
    },
    relationships: {}
  };
}
```

### Accepted attribute types

The JSONAPI spec restricts any attribute value to "any valid JSON value".

However, JSONAPI-TS supports three primitive types for now: `String`, `Number` and `Boolean`. `null` is also a valid value.

Dates are supported in the [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format (`YYYY-MM-DDTHH:MM:SS.sss` + the time zone).

> ⚠️ If you need to store complex types like arrays, you might want to reconsider and think of those array items as different resources of the same type and relate them to the parent resource.

## Operations

### What is an operation?

An operation is an action that affects one or more resources.

Every operation is written in JSON, and contains the following properties:

- `op`: the type of action to execute _(see [Operation types](#Operation-Types) just below this section)_.
- `ref`: a reference to a resource or kind of resource.
  - `id`: the unique identifier of the affected resource.
  - `type`: the affected resource's type
- `data`: a Resource object to be written into the data store.
- `params`: a key/value object used to configure how resources should be fetched from the data store. See [the `get` operation](#get)

The JSONAPI spec defines four elemental operations:

- **get**: Retrieves a list of resources. Can be filtered by `id` or any defined `attribute`.
- **add**: Inserts a new resource in the data store.
- **remove**: Removes a resource from the data store.
- **update**: Edits one or more attributes of a given resource and saves the changes in the data store.

You can define your own operations as well. See the [Processors](#Processors) section below.

### The `get` operation

A `get` operation can retrieve:

- all resources of a given type:

  ```json
  // Get all books.

  {
    "op": "get",
    "ref": {
      "type": "book"
    }
  }
  ```

- a subset of resources of given type which satisfy a certain criteria:

  ```json
  // Get all books with a price greater than 100.

  {
    "op": "get",
    "ref": {
      "type": "book"
    },
    "params": {
      "filter": {
        "price": "gt:100"
      }
    }
  }
  ```

- a single, uniquely identified resource of a given type:

  ```json
  // Get all books with a price greater than 100.

  {
    "op": "get",
    "ref": {
      "type": "book",
      "id": "ef70e4a4-5016-467b-958d-449ead0ce08e"
    }
  }
  ```
