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

## Data flow

This diagram represents how a full request/response cycle works with JSONAPI-TS:

<img src="./docs/data-flow.svg">

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
  // Get a single book.

  {
    "op": "get",
    "ref": {
      "type": "book",
      "id": "ef70e4a4-5016-467b-958d-449ead0ce08e"
    }
  }
  ```

The following filter operations are supported:

| Operator | Comparison type                                                              |
| -------- | ---------------------------------------------------------------------------- |
| `eq`     | Equals                                                                       |
| `ne`     | Not equals                                                                   |
| `lt`     | Less than                                                                    |
| `gt`     | Greater than                                                                 |
| `le`     | Less than or equal                                                           |
| `ge`     | Greater than or equal                                                        |
| `like`   | `like:%foo%`: Contains<br>`like:foo%`: Starts with<br>`like:%foo`: Ends with |
| `in`     | Value is in a list of possible values                                        |
| `nin`    | Value is not in a list of possible values                                    |

Results can also be sorted, paginated or partially retrieved using `params.sort`, `params.page` and `params.fields` respectively:

```json
// Get the first 5 books' name, sorted by name.

{
  "op": "get",
  "ref": {
    "type": "book"
  },
  "params": {
    "sort": ["name"],
    "fields": ["name"],
    "page": {
      "number": 0,
      "size": 5
    }
  }
}
```

Also, if the resource being retrieved is related to other resources, it's possible to sideload the related resources using `params.include`:

```json
// Get all books and their respective authors.

{
  "op": "get",
  "ref": {
    "type": "book"
  },
  "params": {
    "include": ["author"]
  }
}
```

The response, if successful, will be a list of one or more resources, mathing the specified parameters.

### The `add` operation

An `add` operation represents the intent of writing a new resource of a given type into the data store.

```json
// Add a new book. Notice that by default, you don't need
// to provide an ID. JSONAPI-TS can generate it automatically.
// Also, we're relating this new resource to an existing
// "author" resource.

{
  "op": "add",
  "ref": {
    "type": "book"
  },
  "data": {
    "type": "book",
    "attributes": {
      "title": "Learning JSONAPI",
      "yearPublished": 2019,
      "price": 100.0
    },
    "relationships": {
      "author": {
        "data": {
          "type": "author",
          "id": "888a7106-c797-4b22-b31e-0244483cf108"
        }
      }
    }
  }
}
```

The response, if successful, will be a single resource object, with either a generated `id` or the `id` provided in the operation.

### The `update` operation

An `update` operation represents the intent of changing some or all of the data for an existing resource of a given type from the data store.

```json
// Increase the price of "Learning JSONAPI" to 200.

{
  "op": "update",
  "ref": {
    "type": "book",
    "id": "ef70e4a4-5016-467b-958d-449ead0ce08e"
  },
  "data": {
    "type": "book",
    "id": "ef70e4a4-5016-467b-958d-449ead0ce08e",
    "attributes": {
      "price": 200.0
    }
  }
}
```

The response, if successful, will be a single resource object, reflecting the changes the `update` operation requested.

### The `delete` operation

A `delete` operation represents the intent to destroy an existing resources in the data store.

```json
// Remove the "Learning JSONAPI" book.

{
  "op": "remove",
  "ref": {
    "type": "book",
    "id": "ef70e4a4-5016-467b-958d-449ead0ce08e"
  }
}
```

The response, if successful, will be `typeof void`.

## Transport layers

JSONAPI-TS is built following a decoupled, modular approach, providing somewhat opinionated methodologies regarding how to make the API usable to consumers.

### jsonApiKoa

Currently we support integrating with [Koa](https://koajs.com) by providing a `jsonApiKoa` middleware, that can be imported and piped through your Koa server, along with other middlewares.

#### Usage

As seen in the [Getting started](#getting-started) section, once your [JSONAPI application](#The-JSONAPI-application) is instantiated, you can simply do:

```ts
// Assume `api` is a Koa server,
// `app` is a JSONAPI application instance.

api.use(jsonApiKoa(app));
```

#### Converting operations into HTTP endpoints

The `jsonApiKoa` middleware takes care of mapping the fundamental operation types (`get`, `add`, `update`, `remove`) into valid HTTP verbs and endpoints.

This is the basic pattern for any endpoint:

```
<verb> /:type[/:id][?params...]
```

Any operation payload is parsed as follows:

| Operation property | HTTP property | Comments                                                                                                                               |
| ------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `op`               | HTTP verb     | `get` => `GET`<br>`add` => `POST`<br>`update` => `PUT`<br>`remove` => `DELETE`                                                         |
| `data`, `included` | HTTP body     | Any resources are returned into the response body.                                                                                     |
| `ref.type`         | `:type`       | Type is inflected into its plural form, so `book` becomes `books`.                                                                     |
| `ref.id`           | `:id`         | ID is used to affect a single resource.                                                                                                |
| `params.*`         | `?params...`  | Everything related to filters, sorting, pagination,<br>partial resource retrieval and sideloading<br>is expressed as query parameters. |

#### Request/response mapping

The following examples show HTTP requests that can be converted into JSONAPI operations.

Any operation can return the following error codes:

- `400 Bad Request`: the operation is malformed and cannot be executed.
- `404 Not Found`: the requested resource does not exist.
- `401 Unauthorized`: the request resource/operation requires authorization.
- `403 Forbidden`: the request's credentials do not have enough privileges to execute the operation.
- `500 Internal Server Error`: an operation crashed and didn't execute properly.

##### `get` operations

```bash
# Get all books.
GET /books

# Get all books with a price greater than 100.
GET /books?filter[price]=gt:100

# Get a single book.
GET /books/ef70e4a4-5016-467b-958d-449ead0ce08e
GET /books?filter[id]=ef70e4a4-5016-467b-958d-449ead0ce08e

# Get the first 5 book names, sorted by name.
GET /books?fields=name&page[number]=0&page[size]=5&sort=name
```

The middleware, if successful, will respond with a `200 OK` HTTP status code.

##### `add` operations

```bash
# Add a new book.
POST /books
Content-Type: application/json; charset=utf-8

{
  "data": {
    "type": "book",
    "attributes": {
      "title": "Learning JSONAPI",
      "yearPublished": 2019,
      "price": 100.0
    },
    "relationships": {
      "author": {
        "data": {
          "type": "author",
          "id": "888a7106-c797-4b22-b31e-0244483cf108"
        }
      }
    }
  }
}
```

The middleware, if successful, will respond with a `201 Created` HTTP status code.

##### `update` operations

```bash
# Increase the price of "Learning JSONAPI" to 200.
PUT /books/ef70e4a4-5016-467b-958d-449ead0ce08e
Content-Type: application/json; charset=utf-8

{
  "data": {
    "type": "book",
    "id": "ef70e4a4-5016-467b-958d-449ead0ce08e",
    "attributes": {
      "price": 200.0
    }
  }
}
```

The middleware, if successful, will respond with a `200 OK` HTTP status code.

##### `delete` operations

```bash
# Remove the "Learning JSONAPI" book.
DELETE /books/ef70e4a4-5016-467b-958d-449ead0ce08e
```

The middleware, if successful, will respond with a `204 No Content` HTTP status code.

## Processors

### What is a processor?

A processor is responsable of executing JSONAPI operations for certain resource types. If you're familiar with the Model-View-Controller pattern, processor can be somewhat compared to the `C` in `MVC`.

JSONAPI-TS includes two built-in processors:

- an abstract `OperationProcessor` which defines an API capable of executing the fundamental operations on a resource;
- a concrete `KnexProcessor`, which is a Knex-powered DB-capable implementation of the `OperationProcessor`.

### The `OperationProcessor` class

This class defines the basic API any processor needs to implement.

Each operation type is handled by a separate async function, which receives the current operation payload as an argument, and returns either a list of resources of a given type, a single resource of that type or nothing at all.

```ts
class OperationProcessor<ResourceT> {
  async get(op: Operation): Promise<ResourceT[]>;
  async remove(op: Operation): Promise<void>;
  async update(op: Operation): Promise<ResourceT>;
  async add(op: Operation): Promise<ResourceT>;
}
```

Also, the `OperationProcessor` exposes an `app` property that allows access to the [JSONAPI application](#The-JSONAPI-application) instance.
