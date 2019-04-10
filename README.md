# jsonapi-ts

> _We need a better name!_

This is a TypeScript framework to create APIs following the [1.1 Spec of JSONAPI](https://jsonapi.org/format/1.1/) + the [Operations proposal spec](https://github.com/json-api/json-api/blob/999e6df77b28549d6c37b163b73c8e9102400020/_format/1.1/index.md#operations).

## Table of contents

- [Features](#features)
- [Getting started](#getting-started)
- [Data flow](#data-flow)
- [Resources](#resources)
  - [What is a resource?](#what-is-a-resource)
  - [Declaring a resource](#declaring-a-resource)
  - [Accepted attribute types](#accepted-attribute-types)
- [Operations](#operations)
  - [What is an operation?](#what-is-an-operation)
  - [The `get` operation](#the-get-operation)
  - [The `add` operation](#the-add-operation)
  - [The `update` operation](#the-update-operation)
  - [The `remove` operation](#the-remove-operation)
- [Transport layers](#transport-layers)
  - [jsonApiKoa](#jsonapikoa)
    - [Usage](#usage)
    - [Converting operations into HTTP endpoints](#converting-operations-into-http-endpoints)
    - [Request/response mapping](#requestresponse-mapping)
- [Processors](#processors)
  - [What is a processor?](#what-is-a-processor)
  - [The `OperationProcessor` class](#the-operationprocessor-class)
  - [How does an operation gets executed?](#how-does-an-operation-gets-executed)
  - [Controlling errors while executing an operation](#controlling-errors-while-executing-an-operation)
  - [Extending the `OperationProcessor` class](#extending-the-operationprocessor-class)
  - [The `KnexProcessor` class](#the-knexprocessor-class)
  - [Extending the `KnexProcessor` class](#extending-the-knexprocessor-class)
- [Authorization](#authorization)
  - [Defining an `User` resource](#defining-an-user-resource)
  - [Implementing an `User` processor](#implementing-an-user-processor)
  - [Defining a `Session` resource](#defining-a-session-resource)
  - [Implementing a `Session` processor](#implementing-a-session-processor)
  - [Using the `@Authorize` decorator](#using-the-authorize-decorator)
  - [Using the `IfUser()` helper](#using-the-ifuser-helper)
  - [Front-end requirements](#front-end-requirements)
- [The JSONAPI application](#the-jsonapi-application)
  - [What is a JSONAPI application?](#what-is-a-jsonapi-application)
  - [Referencing types and processors](#referencing-types-and-processors)
  - [Using a default processor](#using-a-default-processor)

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
     static schema: {
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
  static schema: {
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

### How does an operation gets executed?

Any operation is the result of a call to a method named `executeOperations`, which lives in the JSONAPI application instance.

By default, the `OperationProcessor` only offers the methods' signature for every operation, but does not implement any of them. So, for example, for a `get` operation to actually do something, you should extend from this class and write some code that in its return value, returns a list of resources of a given type.

Let's assume for example your data source is the filesystem. For each `type`, you have a subdirectory in a `data` directory, and for each resource, you have a JSON file with a filename of any UUID value.

You could implement a generic `ReadOnlyProcessor` with something like this:

```ts
import { OperationProcessor, Operation } from "@ebryn/jsonapi-ts";
import { readdirSync, readFileSync } from "fs";
import { resolve as resolvePath, basename } from "path";

export default class ReadOnlyProcessor extends OperationProcessor<Resource> {
  async get(op: Operation): Promise<Resource[]> {
    const files = readdirSync(resolvePath(__dirname, `data/${op.ref.type}`));
    return files.map(file => ({
      type: op.ref.type,
      id: basename(file),
      attributes: JSON.parse(readFileSync(file).toString()),
      relationships: {}
    }));
  }
}
```

### Controlling errors while executing an operation

What happens if in the previous example something goes wrong? For example, a record in our super filesystem-based storage does not contain valid JSON? We can create an error response using try/catch and `JsonApiErrors`:

```ts
import {
  OperationProcessor,
  Operation,
  JsonApiErrors,
  Resource
} from "@ebryn/jsonapi-ts";
import { readdirSync, readFileSync } from "fs";
import { resolve as resolvePath, basename } from "path";

export default class ReadOnlyProcessor extends OperationProcessor<Resource> {
  async get(op: Operation): Promise<Resource[]> {
    const files = readdirSync(resolvePath(__dirname, `data/${op.ref.type}`));
    return files.map((file: string) => {
      try {
        const attributes = JSON.parse(readFileSync(file).toString());
        return {
          type: op.ref.type,
          id: basename(file),
          attributes,
          relationships: {}
        };
      } catch {
        throw JsonApiErrors.UnhandledError();
      }
    });
  }
}
```

You can also create an error by using the `JsonApiError` type:

```ts
// Assumes you've imported HttpStatusCodes and JsonApiError
// from @ebryn/jsonapi-ts.

throw {
  // At the very least, you must declare a status and a code.
  status: HttpStatusCode.UnprocessableEntity,
  code: "invalid_json_in_record"
} as JsonApiError;
```

The full JsonApiError type supports the following properties:

- `id`: A unique identifier to this error response. Useful for tracking down a problem via logs.
- `title`: A human-readable, brief summary of what went wrong.
- `detail`: A human-readable, expanded information about the specifics of the error.
- `source`: A reference to locate the code block that triggered the error.
  - `pointer`: An expression to point towards the point of failure. It can be anything useful for a developer to track down the problem. Common examples are `filename.ext:line:col` or `filename.ext:methodName()`.
  - `parameter`: If the failure occured at a specific method and it's triggered due to a bad parameter value, you can set here which parameter was badly set.

### Extending the `OperationProcessor` class

Our ReadOnlyProcessor class is a fair example of how to extend the OperationProcessor in a generic way. What if we want to build a resource-specific, `OperationProcessor`-derived processor?

Let's assume we have a `Moment` resource:

```ts
import { Resource } from "@ebryn/jsonapi-ts";

export default class Moment extends Resource {
  static schema: {
    attributes: {
      date: string,
      time: string
    },
    type:string,
    id:string
  };
}
```

All you need to do is extend the Processor, set the generic type to `Moment`, and bind the processor to the resource:

```ts
import { OperationProcessor, Operation } from "@ebryn/jsonapi-ts";
import Moment from "../resources/moment";

export default class MomentProcessor extends OperationProcessor<Moment> {
  // This property binds the processor to the resource. This way the JSONAPI
  // application knows how to resolve operations for the `Moment`
  // resource.
  public resourceClass = Moment;

  // Notice that the return type is `Moment` and not a generic.
  async get(op: Operation): Promise<Moment[]> {
    const now = new Date();
    const id = now.valueOf().toString();
    const [date] = now.toJSON().split("T");
    const [, time] = now
      .toJSON()
      .replace(/Z/g, "")
      .split("T");

    return [{
      type: "moment",
      id,
      attributes: {
        date,
        time
      },
      relationships: {}
    }];
  }
}
```

### The `KnexProcessor` class

This processor is a fully-implemented, database-driven extension of the `OperationProcessor` class seen before. It takes care of creating the necessary SQL queries to resolve any given operation.

It maps operations to queries like this:

| Operation | SQL command                                          |
| --------- | ---------------------------------------------------- |
| `get`     | `SELECT`, supporting `WHERE`, `ORDER BY` and `LIMIT` |
| `add`     | `INSERT`, supporting `RETURNING`                     |
| `update`  | `UPDATE`, supporting `WHERE`                         |
| `remove`  | `DELETE`, supporting `WHERE`                         |
|           |                                                      |

It receives a single argument, `options`, which is passed to the `Knex` constructor. See the [Knex documentation](https://knexjs.org/#Installation-client) for detailed examples.

### Extending the `KnexProcessor` class

Like the `OperationProcessor` class, the `KnexProcessor` can be extended to support custom operations. Suppose we want to count how many books an author has. We could implement a `count()` method.

```ts
import { KnexProcessor, Operation } from "@ebryn/jsonapi-ts";
import { Book, BookCount } from "./resources";

export default class BookProcessor extends KnexProcessor<Book> {
  async count(op: Operation): Promise<BookCount> {
    return {
      type: "bookCount",
      attributes: {
        count: (await super.get(op)).length
      },
      relationships: {}
    };
  }
}
```

The call to `super.get(op)` allows to reuse the behavior of the KnexProcessor and then do other actions around it.

> ℹ️ Naturally, there are better ways to do a count. This is just an example to show the extensibility capabilities of the processor.

## Authorization

JSONAPI-TS has authorization capabilities by using [JSON Web Tokens](https://www.jsonwebtoken.io/). Basically, it allows you to allow or deny operation execution based on user/role presence in a token.

For this feature to work, you'll need to:

- Declare an `User` resource
- Implement an `User` processor
- Declare a `Session` resource
- Implement a `Session` processor
- Apply the `@Authorize` decorator and the `IfUser()` helper where necessary
- Have your front-end send requests with an `Authorization` header

### Defining an `User` resource

A minimal, bare-bones declaration of an `User` resource could look something like this:

```ts
import { Resource } from "@ebryn/jsonapi-ts";

export default class User extends Resource {
  static schema: {
    attributes: {
      name: string;
    }
  }
}
```

### Implementing an `User` processor

The key to implement the `UserProcessor` is to use the private `identify` operation. This operation is not mapped through any transport layer, so it's only code by the `jsonApiKoa` middleware to get all of the user data to see if it matches with a given token.

```ts
export default class UserProcessor extends KnexProcessor<User> {
  public resourceClass = User;

  async identify(op: Operation): Promise<User> {
    return super.get(op)[0];
  }
}
```

Now, in order to generate that token, you'll need to build a resource and processor to serve and create it.

> ⚠️ The following examples are **NOT** production-ready and are **NOT** safe. They're only for educational purposes.

### Defining a `Session` resource

A `Session` resource is a container for a JSON Web Token.

When requesting to create a `Session`, we'll need the username and password the

```ts
import { Resource } from "@ebryn/jsonapi-ts";

export default class Session extends Resource {
  static schema: {
    attributes: {
      username: string,
      password: string,
      token?: string;
    }
  }
}
```

### Implementing a `Session` processor

In order to create the session, you'll need to implement a processor that encodes the `User` resource into a JSON Web Token. Such processor would look something like this:

```ts
import { KnexProcessor, Operation, JsonApiErrors } from "@ebryn/jsonapi-ts";
import { sign } from "jsonwebtoken";
import { Session } from "./resources";
import { v4 as uuid } from "uuid";

export default class SessionProcessor extends KnexProcessor {
  public resourceClass = Session;

  // We use the `add` operation since we're "creating"
  // a session. A valid approach would also be to create
  // a custom `login` operation.
  public async add(op: Operation): Promise<Session> {
    // Find the user. Since we're using a KnexProcessor as a base class,
    // we have access to the Knex instance.
    const user = await this.knex("users")
      .where({
        username: op.data.attributes.username,
        password: op.data.attributes.password
      })
      .first();

    // If we didn't get a user, we abort the operation with an error.
    if (!user) {
      throw JsonApiErrors.AccessDenied();
    }

    const userId = user.id;

    // Scrub any privileged data.
    delete user.password;
    delete user.id;

    const secureData = {
      type: "user",
      id: userId,
      attributes: {
        ...user
      },
      relationships: {}
    };

    // Create the JWT.
    const token = sign(secureData, process.env.SESSION_KEY, {
      subject: secureData.id,
      expiresIn: "1d"
    });

    // Return it.
    const session = {
      type: "session",
      id: uuid(),
      attributes: {
        token
      },
      relationships: {}
    };

    return session;
  }
}
```

### Using the `@Authorize` decorator

Now, for any processor you have in your API, for example, our BookProcessor, we can use `@Authorize` to reject execution if there's no user detected:

```ts
import { KnexProcessor, Operation, Authorize } from "@ebryn/jsonapi-ts";
import { Book } from "./resources";

export default class BookProcessor extends KnexProcessor<Book> {
  // This operation will return an `Unauthorized` error if there's
  // no user in the JSONAPI application instance.
  @Authorize()
  async get(op: Operation): Promise<Book[]> {
    // You can use `this.app.user` to get user data.
    console.log(`User ${this.app.user.id} is reading data`);
    return super.get(op);
  }
}
```

### Using the `IfUser()` helper

You might want to restrict an operation to a specific subset of users who match a certain criteria. For that purpose, you can augment the `@Authorize` decorator with the `IfUser()` helper:

```ts
import { KnexProcessor, Operation, Authorize, IfUser } from "@ebryn/jsonapi-ts";
import { Book } from "./resources";

export default class BookProcessor extends KnexProcessor<Book> {
  // This operation will return an `Unauthorized` error if there's
  // no user with the role "librarian" in the JSONAPI application
  // instance.
  @Authorize(IfUser("role", "librarian"))
  async get(op: Operation): Promise<Book[]> {
    return super.get(op);
  }
}
```

The `IfUser()` helper syntax is as follows:

```ts
IfUser(attributeName: string, attributeValue: string | number | boolean);
```

### Front-end requirements

In order for authorization to work, whichever app is consuming the JSONAPI exposed via HTTP will need to send the token created with the `SessionProcessor` in an `Authorization` header, like this:

```
Authorization: Bearer JWT_HASH_GOES_HERE
```

## The JSONAPI Application

The last piece of the framework is the `Application` object. This component wraps and connects everything we've described so far.

### What is a JSONAPI application?

It's what orchestrates, routes and executes operations. In code, we're talking about something like this:

```ts
import {
  Application,
  jsonApiKoa as jsonApi,
  KnexProcessor
} from "@ebryn/jsonapi-ts";
import Koa from "koa";

import Author from "./resources/author";

// This is what any transport layer like jsonApiKoa will use
// to process all operations.
const app = new Application({
  namespace: "api",
  types: [Author],
  defaultProcessor: new KnexProcessor(/* knex options */)
});

const api = new Koa();

api.use(jsonApi(app));

api.listen(3000);
```

The `Application` object is instantiated with the following settings:

- `namespace`: Used in HTTP transport layers. It prefixes the resource URI with a string. If set, the base URI pattern is `:namespace/:type/:id`. If not, it goes straight to `:type/:id`.
- `types`: A list of all resource types declared and handled by this app.
- `processors`: If you define custom processors, they have to be registered here as instances.
- `defaultProcessor`: All non-bound-to-processor resources will be handled by this processor.

### Referencing types and processors

This is how you register your resources and processors in an application:

```ts
// Assumes all necessary imports are in place.
const app = new Application({
  namespace: "api",
  types: [Author, Book, BookCount],
  processors: {
    new BookProcessor(/* processor args */)
  }
});
```

### Using a default processor

If you do not need custom processors, you can simply declare your resources and have them all work with a built-in processor:

```ts
const app = new Application({
  namespace: "api",
  types: [Author, Book, BookCount],
  defaultProcessor: new KnexProcessor(/* db settings */)
});
```

## License

[MIT](./license)
