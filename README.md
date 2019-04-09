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

## Getting started

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
   import { Application, jsonApiKoa as jsonApi } from "@ebryn/jsonapi-ts";
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
