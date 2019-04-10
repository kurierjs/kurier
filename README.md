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

<img src="data:image/svg+xml;base64,PHN2ZyBpZD0ibWVybWFpZC0xNTU0OTA2NzY3NzE1IiB3aWR0aD0iMTAwJSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjEwMCUiIHN0eWxlPSJtYXgtd2lkdGg6MTQ1MHB4OyIgdmlld0JveD0iLTUwIC0xMCAxNDUwIDU4MSI+PHN0eWxlPgoKCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmxhYmVsIHsKICBmb250LWZhbWlseTogJ3RyZWJ1Y2hldCBtcycsIHZlcmRhbmEsIGFyaWFsOwogIGNvbG9yOiAjMzMzOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5ub2RlIHJlY3QsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLm5vZGUgY2lyY2xlLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5ub2RlIGVsbGlwc2UsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLm5vZGUgcG9seWdvbiB7CiAgZmlsbDogI0VDRUNGRjsKICBzdHJva2U6ICM5MzcwREI7CiAgc3Ryb2tlLXdpZHRoOiAxcHg7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLm5vZGUuY2xpY2thYmxlIHsKICBjdXJzb3I6IHBvaW50ZXI7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmFycm93aGVhZFBhdGggewogIGZpbGw6ICMzMzMzMzM7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmVkZ2VQYXRoIC5wYXRoIHsKICBzdHJva2U6ICMzMzMzMzM7CiAgc3Ryb2tlLXdpZHRoOiAxLjVweDsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuZWRnZUxhYmVsIHsKICBiYWNrZ3JvdW5kLWNvbG9yOiAjZThlOGU4OyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5jbHVzdGVyIHJlY3QgewogIGZpbGw6ICNmZmZmZGUgIWltcG9ydGFudDsKICBzdHJva2U6ICNhYWFhMzMgIWltcG9ydGFudDsKICBzdHJva2Utd2lkdGg6IDFweCAhaW1wb3J0YW50OyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5jbHVzdGVyIHRleHQgewogIGZpbGw6ICMzMzM7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgZGl2Lm1lcm1haWRUb29sdGlwIHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgdGV4dC1hbGlnbjogY2VudGVyOwogIG1heC13aWR0aDogMjAwcHg7CiAgcGFkZGluZzogMnB4OwogIGZvbnQtZmFtaWx5OiAndHJlYnVjaGV0IG1zJywgdmVyZGFuYSwgYXJpYWw7CiAgZm9udC1zaXplOiAxMnB4OwogIGJhY2tncm91bmQ6ICNmZmZmZGU7CiAgYm9yZGVyOiAxcHggc29saWQgI2FhYWEzMzsKICBib3JkZXItcmFkaXVzOiAycHg7CiAgcG9pbnRlci1ldmVudHM6IG5vbmU7CiAgei1pbmRleDogMTAwOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5hY3RvciB7CiAgc3Ryb2tlOiAjQ0NDQ0ZGOwogIGZpbGw6ICNFQ0VDRkY7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgdGV4dC5hY3RvciB7CiAgZmlsbDogYmxhY2s7CiAgc3Ryb2tlOiBub25lOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5hY3Rvci1saW5lIHsKICBzdHJva2U6IGdyZXk7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLm1lc3NhZ2VMaW5lMCB7CiAgc3Ryb2tlLXdpZHRoOiAxLjU7CiAgc3Ryb2tlLWRhc2hhcnJheTogJzIgMic7CiAgc3Ryb2tlOiAjMzMzOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5tZXNzYWdlTGluZTEgewogIHN0cm9rZS13aWR0aDogMS41OwogIHN0cm9rZS1kYXNoYXJyYXk6ICcyIDInOwogIHN0cm9rZTogIzMzMzsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAjYXJyb3doZWFkIHsKICBmaWxsOiAjMzMzOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1ICNjcm9zc2hlYWQgcGF0aCB7CiAgZmlsbDogIzMzMyAhaW1wb3J0YW50OwogIHN0cm9rZTogIzMzMyAhaW1wb3J0YW50OyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5tZXNzYWdlVGV4dCB7CiAgZmlsbDogIzMzMzsKICBzdHJva2U6IG5vbmU7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmxhYmVsQm94IHsKICBzdHJva2U6ICNDQ0NDRkY7CiAgZmlsbDogI0VDRUNGRjsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAubGFiZWxUZXh0IHsKICBmaWxsOiBibGFjazsKICBzdHJva2U6IG5vbmU7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmxvb3BUZXh0IHsKICBmaWxsOiBibGFjazsKICBzdHJva2U6IG5vbmU7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmxvb3BMaW5lIHsKICBzdHJva2Utd2lkdGg6IDI7CiAgc3Ryb2tlLWRhc2hhcnJheTogJzIgMic7CiAgc3Ryb2tlOiAjQ0NDQ0ZGOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5ub3RlIHsKICBzdHJva2U6ICNhYWFhMzM7CiAgZmlsbDogI2ZmZjVhZDsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAubm90ZVRleHQgewogIGZpbGw6IGJsYWNrOwogIHN0cm9rZTogbm9uZTsKICBmb250LWZhbWlseTogJ3RyZWJ1Y2hldCBtcycsIHZlcmRhbmEsIGFyaWFsOwogIGZvbnQtc2l6ZTogMTRweDsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYWN0aXZhdGlvbjAgewogIGZpbGw6ICNmNGY0ZjQ7CiAgc3Ryb2tlOiAjNjY2OyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5hY3RpdmF0aW9uMSB7CiAgZmlsbDogI2Y0ZjRmNDsKICBzdHJva2U6ICM2NjY7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmFjdGl2YXRpb24yIHsKICBmaWxsOiAjZjRmNGY0OwogIHN0cm9rZTogIzY2NjsgfQoKCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnNlY3Rpb24gewogIHN0cm9rZTogbm9uZTsKICBvcGFjaXR5OiAwLjI7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnNlY3Rpb24wIHsKICBmaWxsOiByZ2JhKDEwMiwgMTAyLCAyNTUsIDAuNDkpOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5zZWN0aW9uMiB7CiAgZmlsbDogI2ZmZjQwMDsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuc2VjdGlvbjEsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnNlY3Rpb24zIHsKICBmaWxsOiB3aGl0ZTsKICBvcGFjaXR5OiAwLjI7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnNlY3Rpb25UaXRsZTAgewogIGZpbGw6ICMzMzM7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnNlY3Rpb25UaXRsZTEgewogIGZpbGw6ICMzMzM7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnNlY3Rpb25UaXRsZTIgewogIGZpbGw6ICMzMzM7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnNlY3Rpb25UaXRsZTMgewogIGZpbGw6ICMzMzM7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnNlY3Rpb25UaXRsZSB7CiAgdGV4dC1hbmNob3I6IHN0YXJ0OwogIGZvbnQtc2l6ZTogMTFweDsKICB0ZXh0LWhlaWdodDogMTRweDsgfQoKCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmdyaWQgLnRpY2sgewogIHN0cm9rZTogbGlnaHRncmV5OwogIG9wYWNpdHk6IDAuMzsKICBzaGFwZS1yZW5kZXJpbmc6IGNyaXNwRWRnZXM7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmdyaWQgcGF0aCB7CiAgc3Ryb2tlLXdpZHRoOiAwOyB9CgoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAudG9kYXkgewogIGZpbGw6IG5vbmU7CiAgc3Ryb2tlOiByZWQ7CiAgc3Ryb2tlLXdpZHRoOiAycHg7IH0KCgoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAudGFzayB7CiAgc3Ryb2tlLXdpZHRoOiAyOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC50YXNrVGV4dCB7CiAgdGV4dC1hbmNob3I6IG1pZGRsZTsKICBmb250LXNpemU6IDExcHg7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnRhc2tUZXh0T3V0c2lkZVJpZ2h0IHsKICBmaWxsOiBibGFjazsKICB0ZXh0LWFuY2hvcjogc3RhcnQ7CiAgZm9udC1zaXplOiAxMXB4OyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC50YXNrVGV4dE91dHNpZGVMZWZ0IHsKICBmaWxsOiBibGFjazsKICB0ZXh0LWFuY2hvcjogZW5kOwogIGZvbnQtc2l6ZTogMTFweDsgfQoKCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnRhc2tUZXh0MCwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAudGFza1RleHQxLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC50YXNrVGV4dDIsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnRhc2tUZXh0MyB7CiAgZmlsbDogd2hpdGU7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnRhc2swLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC50YXNrMSwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAudGFzazIsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnRhc2szIHsKICBmaWxsOiAjOGE5MGRkOwogIHN0cm9rZTogIzUzNGZiYzsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAudGFza1RleHRPdXRzaWRlMCwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAudGFza1RleHRPdXRzaWRlMiB7CiAgZmlsbDogYmxhY2s7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnRhc2tUZXh0T3V0c2lkZTEsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLnRhc2tUZXh0T3V0c2lkZTMgewogIGZpbGw6IGJsYWNrOyB9CgoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYWN0aXZlMCwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYWN0aXZlMSwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYWN0aXZlMiwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYWN0aXZlMyB7CiAgZmlsbDogI2JmYzdmZjsKICBzdHJva2U6ICM1MzRmYmM7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmFjdGl2ZVRleHQwLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5hY3RpdmVUZXh0MSwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYWN0aXZlVGV4dDIsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmFjdGl2ZVRleHQzIHsKICBmaWxsOiBibGFjayAhaW1wb3J0YW50OyB9CgoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuZG9uZTAsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmRvbmUxLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5kb25lMiwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuZG9uZTMgewogIHN0cm9rZTogZ3JleTsKICBmaWxsOiBsaWdodGdyZXk7CiAgc3Ryb2tlLXdpZHRoOiAyOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5kb25lVGV4dDAsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmRvbmVUZXh0MSwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuZG9uZVRleHQyLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5kb25lVGV4dDMgewogIGZpbGw6IGJsYWNrICFpbXBvcnRhbnQ7IH0KCgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5jcml0MCwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuY3JpdDEsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmNyaXQyLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5jcml0MyB7CiAgc3Ryb2tlOiAjZmY4ODg4OwogIGZpbGw6IHJlZDsKICBzdHJva2Utd2lkdGg6IDI7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmFjdGl2ZUNyaXQwLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5hY3RpdmVDcml0MSwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYWN0aXZlQ3JpdDIsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmFjdGl2ZUNyaXQzIHsKICBzdHJva2U6ICNmZjg4ODg7CiAgZmlsbDogI2JmYzdmZjsKICBzdHJva2Utd2lkdGg6IDI7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmRvbmVDcml0MCwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuZG9uZUNyaXQxLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5kb25lQ3JpdDIsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmRvbmVDcml0MyB7CiAgc3Ryb2tlOiAjZmY4ODg4OwogIGZpbGw6IGxpZ2h0Z3JleTsKICBzdHJva2Utd2lkdGg6IDI7CiAgY3Vyc29yOiBwb2ludGVyOwogIHNoYXBlLXJlbmRlcmluZzogY3Jpc3BFZGdlczsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuZG9uZUNyaXRUZXh0MCwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuZG9uZUNyaXRUZXh0MSwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuZG9uZUNyaXRUZXh0MiwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuZG9uZUNyaXRUZXh0MyB7CiAgZmlsbDogYmxhY2sgIWltcG9ydGFudDsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYWN0aXZlQ3JpdFRleHQwLAojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5hY3RpdmVDcml0VGV4dDEsCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmFjdGl2ZUNyaXRUZXh0MiwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYWN0aXZlQ3JpdFRleHQzIHsKICBmaWxsOiBibGFjayAhaW1wb3J0YW50OyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC50aXRsZVRleHQgewogIHRleHQtYW5jaG9yOiBtaWRkbGU7CiAgZm9udC1zaXplOiAxOHB4OwogIGZpbGw6IGJsYWNrOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IGcuY2xhc3NHcm91cCB0ZXh0IHsKICBmaWxsOiAjOTM3MERCOwogIHN0cm9rZTogbm9uZTsKICBmb250LWZhbWlseTogJ3RyZWJ1Y2hldCBtcycsIHZlcmRhbmEsIGFyaWFsOwogIGZvbnQtc2l6ZTogMTBweDsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSBnLmNsYXNzR3JvdXAgcmVjdCB7CiAgZmlsbDogI0VDRUNGRjsKICBzdHJva2U6ICM5MzcwREI7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgZy5jbGFzc0dyb3VwIGxpbmUgewogIHN0cm9rZTogIzkzNzBEQjsKICBzdHJva2Utd2lkdGg6IDE7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmNsYXNzTGFiZWwgLmJveCB7CiAgc3Ryb2tlOiBub25lOwogIHN0cm9rZS13aWR0aDogMDsKICBmaWxsOiAjRUNFQ0ZGOwogIG9wYWNpdHk6IDAuNTsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuY2xhc3NMYWJlbCAubGFiZWwgewogIGZpbGw6ICM5MzcwREI7CiAgZm9udC1zaXplOiAxMHB4OyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1IC5yZWxhdGlvbiB7CiAgc3Ryb2tlOiAjOTM3MERCOwogIHN0cm9rZS13aWR0aDogMTsKICBmaWxsOiBub25lOyB9CgojbWVybWFpZC0xNTU0OTA2NzY3NzE1ICNjb21wb3NpdGlvblN0YXJ0IHsKICBmaWxsOiAjOTM3MERCOwogIHN0cm9rZTogIzkzNzBEQjsKICBzdHJva2Utd2lkdGg6IDE7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgI2NvbXBvc2l0aW9uRW5kIHsKICBmaWxsOiAjOTM3MERCOwogIHN0cm9rZTogIzkzNzBEQjsKICBzdHJva2Utd2lkdGg6IDE7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgI2FnZ3JlZ2F0aW9uU3RhcnQgewogIGZpbGw6ICNFQ0VDRkY7CiAgc3Ryb2tlOiAjOTM3MERCOwogIHN0cm9rZS13aWR0aDogMTsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAjYWdncmVnYXRpb25FbmQgewogIGZpbGw6ICNFQ0VDRkY7CiAgc3Ryb2tlOiAjOTM3MERCOwogIHN0cm9rZS13aWR0aDogMTsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAjZGVwZW5kZW5jeVN0YXJ0IHsKICBmaWxsOiAjOTM3MERCOwogIHN0cm9rZTogIzkzNzBEQjsKICBzdHJva2Utd2lkdGg6IDE7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgI2RlcGVuZGVuY3lFbmQgewogIGZpbGw6ICM5MzcwREI7CiAgc3Ryb2tlOiAjOTM3MERCOwogIHN0cm9rZS13aWR0aDogMTsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAjZXh0ZW5zaW9uU3RhcnQgewogIGZpbGw6ICM5MzcwREI7CiAgc3Ryb2tlOiAjOTM3MERCOwogIHN0cm9rZS13aWR0aDogMTsgfQoKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAjZXh0ZW5zaW9uRW5kIHsKICBmaWxsOiAjOTM3MERCOwogIHN0cm9rZTogIzkzNzBEQjsKICBzdHJva2Utd2lkdGg6IDE7IH0KCiNtZXJtYWlkLTE1NTQ5MDY3Njc3MTUgLmNvbW1pdC1pZCwKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuY29tbWl0LW1zZywKI21lcm1haWQtMTU1NDkwNjc2NzcxNSAuYnJhbmNoLWxhYmVsIHsKICBmaWxsOiBsaWdodGdyZXk7CiAgY29sb3I6IGxpZ2h0Z3JleTsgfQo8L3N0eWxlPjxzdHlsZT4jbWVybWFpZC0xNTU0OTA2NzY3NzE1IHsKICAgIGNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNjUpOwogICAgZm9udDogOwogIH08L3N0eWxlPjxnPjwvZz48Zz48bGluZSBpZD0iYWN0b3I2MzI4IiB4MT0iNzUiIHkxPSI1IiB4Mj0iNzUiIHkyPSI1NzAiIGNsYXNzPSJhY3Rvci1saW5lIiBzdHJva2Utd2lkdGg9IjAuNXB4IiBzdHJva2U9IiM5OTkiPjwvbGluZT48cmVjdCB4PSIwIiB5PSIwIiBmaWxsPSIjZWFlYWVhIiBzdHJva2U9IiM2NjYiIHdpZHRoPSIxNTAiIGhlaWdodD0iNjUiIHJ4PSIzIiByeT0iMyIgY2xhc3M9ImFjdG9yIj48L3JlY3Q+PHRleHQgeD0iNzUiIHk9IjMyLjUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBhbGlnbm1lbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGNsYXNzPSJhY3RvciIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7IGZvbnQtc2l6ZTogMTRweDsgZm9udC1mYW1pbHk6IE9wZW4tU2Fucywgc2Fucy1zZXJpZjsiPjx0c3BhbiB4PSI3NSIgZHk9IjAiPkNvbnN1bWVyPC90c3Bhbj48L3RleHQ+PC9nPjxnPjxsaW5lIGlkPSJhY3RvcjYzMjkiIHgxPSIyNzUiIHkxPSI1IiB4Mj0iMjc1IiB5Mj0iNTcwIiBjbGFzcz0iYWN0b3ItbGluZSIgc3Ryb2tlLXdpZHRoPSIwLjVweCIgc3Ryb2tlPSIjOTk5Ij48L2xpbmU+PHJlY3QgeD0iMjAwIiB5PSIwIiBmaWxsPSIjZWFlYWVhIiBzdHJva2U9IiM2NjYiIHdpZHRoPSIxNTAiIGhlaWdodD0iNjUiIHJ4PSIzIiByeT0iMyIgY2xhc3M9ImFjdG9yIj48L3JlY3Q+PHRleHQgeD0iMjc1IiB5PSIzMi41IiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgYWxpZ25tZW50LWJhc2VsaW5lPSJjZW50cmFsIiBjbGFzcz0iYWN0b3IiIHN0eWxlPSJ0ZXh0LWFuY2hvcjogbWlkZGxlOyBmb250LXNpemU6IDE0cHg7IGZvbnQtZmFtaWx5OiBPcGVuLVNhbnMsIHNhbnMtc2VyaWY7Ij48dHNwYW4geD0iMjc1IiBkeT0iMCI+S29hIFNlcnZlcjwvdHNwYW4+PC90ZXh0PjwvZz48Zz48bGluZSBpZD0iYWN0b3I2MzMwIiB4MT0iNDc1IiB5MT0iNSIgeDI9IjQ3NSIgeTI9IjU3MCIgY2xhc3M9ImFjdG9yLWxpbmUiIHN0cm9rZS13aWR0aD0iMC41cHgiIHN0cm9rZT0iIzk5OSI+PC9saW5lPjxyZWN0IHg9IjQwMCIgeT0iMCIgZmlsbD0iI2VhZWFlYSIgc3Ryb2tlPSIjNjY2IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjY1IiByeD0iMyIgcnk9IjMiIGNsYXNzPSJhY3RvciI+PC9yZWN0Pjx0ZXh0IHg9IjQ3NSIgeT0iMzIuNSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGFsaWdubWVudC1iYXNlbGluZT0iY2VudHJhbCIgY2xhc3M9ImFjdG9yIiBzdHlsZT0idGV4dC1hbmNob3I6IG1pZGRsZTsgZm9udC1zaXplOiAxNHB4OyBmb250LWZhbWlseTogT3Blbi1TYW5zLCBzYW5zLXNlcmlmOyI+PHRzcGFuIHg9IjQ3NSIgZHk9IjAiPkpTT05BUEkgTWlkZGxld2FyZTwvdHNwYW4+PC90ZXh0PjwvZz48Zz48bGluZSBpZD0iYWN0b3I2MzMxIiB4MT0iNjc1IiB5MT0iNSIgeDI9IjY3NSIgeTI9IjU3MCIgY2xhc3M9ImFjdG9yLWxpbmUiIHN0cm9rZS13aWR0aD0iMC41cHgiIHN0cm9rZT0iIzk5OSI+PC9saW5lPjxyZWN0IHg9IjYwMCIgeT0iMCIgZmlsbD0iI2VhZWFlYSIgc3Ryb2tlPSIjNjY2IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjY1IiByeD0iMyIgcnk9IjMiIGNsYXNzPSJhY3RvciI+PC9yZWN0Pjx0ZXh0IHg9IjY3NSIgeT0iMzIuNSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGFsaWdubWVudC1iYXNlbGluZT0iY2VudHJhbCIgY2xhc3M9ImFjdG9yIiBzdHlsZT0idGV4dC1hbmNob3I6IG1pZGRsZTsgZm9udC1zaXplOiAxNHB4OyBmb250LWZhbWlseTogT3Blbi1TYW5zLCBzYW5zLXNlcmlmOyI+PHRzcGFuIHg9IjY3NSIgZHk9IjAiPkpTT05BUEkgT3BlcmF0aW9uPC90c3Bhbj48L3RleHQ+PC9nPjxnPjxsaW5lIGlkPSJhY3RvcjYzMzIiIHgxPSI4NzUiIHkxPSI1IiB4Mj0iODc1IiB5Mj0iNTcwIiBjbGFzcz0iYWN0b3ItbGluZSIgc3Ryb2tlLXdpZHRoPSIwLjVweCIgc3Ryb2tlPSIjOTk5Ij48L2xpbmU+PHJlY3QgeD0iODAwIiB5PSIwIiBmaWxsPSIjZWFlYWVhIiBzdHJva2U9IiM2NjYiIHdpZHRoPSIxNTAiIGhlaWdodD0iNjUiIHJ4PSIzIiByeT0iMyIgY2xhc3M9ImFjdG9yIj48L3JlY3Q+PHRleHQgeD0iODc1IiB5PSIzMi41IiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgYWxpZ25tZW50LWJhc2VsaW5lPSJjZW50cmFsIiBjbGFzcz0iYWN0b3IiIHN0eWxlPSJ0ZXh0LWFuY2hvcjogbWlkZGxlOyBmb250LXNpemU6IDE0cHg7IGZvbnQtZmFtaWx5OiBPcGVuLVNhbnMsIHNhbnMtc2VyaWY7Ij48dHNwYW4geD0iODc1IiBkeT0iMCI+SlNPTkFQSSBBcHBsaWNhdGlvbjwvdHNwYW4+PC90ZXh0PjwvZz48Zz48bGluZSBpZD0iYWN0b3I2MzMzIiB4MT0iMTA3NSIgeTE9IjUiIHgyPSIxMDc1IiB5Mj0iNTcwIiBjbGFzcz0iYWN0b3ItbGluZSIgc3Ryb2tlLXdpZHRoPSIwLjVweCIgc3Ryb2tlPSIjOTk5Ij48L2xpbmU+PHJlY3QgeD0iMTAwMCIgeT0iMCIgZmlsbD0iI2VhZWFlYSIgc3Ryb2tlPSIjNjY2IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjY1IiByeD0iMyIgcnk9IjMiIGNsYXNzPSJhY3RvciI+PC9yZWN0Pjx0ZXh0IHg9IjEwNzUiIHk9IjMyLjUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBhbGlnbm1lbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGNsYXNzPSJhY3RvciIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7IGZvbnQtc2l6ZTogMTRweDsgZm9udC1mYW1pbHk6IE9wZW4tU2Fucywgc2Fucy1zZXJpZjsiPjx0c3BhbiB4PSIxMDc1IiBkeT0iMCI+S25leFByb2Nlc3NvcjwvdHNwYW4+PC90ZXh0PjwvZz48Zz48bGluZSBpZD0iYWN0b3I2MzM0IiB4MT0iMTI3NSIgeTE9IjUiIHgyPSIxMjc1IiB5Mj0iNTcwIiBjbGFzcz0iYWN0b3ItbGluZSIgc3Ryb2tlLXdpZHRoPSIwLjVweCIgc3Ryb2tlPSIjOTk5Ij48L2xpbmU+PHJlY3QgeD0iMTIwMCIgeT0iMCIgZmlsbD0iI2VhZWFlYSIgc3Ryb2tlPSIjNjY2IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjY1IiByeD0iMyIgcnk9IjMiIGNsYXNzPSJhY3RvciI+PC9yZWN0Pjx0ZXh0IHg9IjEyNzUiIHk9IjMyLjUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBhbGlnbm1lbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGNsYXNzPSJhY3RvciIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7IGZvbnQtc2l6ZTogMTRweDsgZm9udC1mYW1pbHk6IE9wZW4tU2Fucywgc2Fucy1zZXJpZjsiPjx0c3BhbiB4PSIxMjc1IiBkeT0iMCI+RGF0YWJhc2U8L3RzcGFuPjwvdGV4dD48L2c+PGRlZnM+PG1hcmtlciBpZD0iYXJyb3doZWFkIiByZWZYPSI1IiByZWZZPSIyIiBtYXJrZXJXaWR0aD0iNiIgbWFya2VySGVpZ2h0PSI0IiBvcmllbnQ9ImF1dG8iPjxwYXRoIGQ9Ik0gMCwwIFYgNCBMNiwyIFoiPjwvcGF0aD48L21hcmtlcj48L2RlZnM+PGRlZnM+PG1hcmtlciBpZD0iY3Jvc3NoZWFkIiBtYXJrZXJXaWR0aD0iMTUiIG1hcmtlckhlaWdodD0iOCIgb3JpZW50PSJhdXRvIiByZWZYPSIxNiIgcmVmWT0iNCI+PHBhdGggZmlsbD0iYmxhY2siIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxcHgiIGQ9Ik0gOSwyIFYgNiBMMTYsNCBaIiBzdHlsZT0ic3Ryb2tlLWRhc2hhcnJheTogMCwgMDsiPjwvcGF0aD48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMXB4IiBkPSJNIDAsMSBMIDYsNyBNIDYsMSBMIDAsNyIgc3R5bGU9InN0cm9rZS1kYXNoYXJyYXk6IDAsIDA7Ij48L3BhdGg+PC9tYXJrZXI+PC9kZWZzPjxnPjx0ZXh0IHg9IjE3NSIgeT0iOTMiIGNsYXNzPSJtZXNzYWdlVGV4dCIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7Ij5HRVQgL2Jvb2tzPC90ZXh0PjxsaW5lIHgxPSI3NSIgeTE9IjEwMCIgeDI9IjI3NSIgeTI9IjEwMCIgY2xhc3M9Im1lc3NhZ2VMaW5lMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9ImJsYWNrIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93aGVhZCkiIHN0eWxlPSJmaWxsOiBub25lOyI+PC9saW5lPjwvZz48Zz48dGV4dCB4PSIzNzUiIHk9IjEyOCIgY2xhc3M9Im1lc3NhZ2VUZXh0IiBzdHlsZT0idGV4dC1hbmNob3I6IG1pZGRsZTsiPnJvdXRlcyB0byBNaWRkbGV3YXJlPC90ZXh0PjxsaW5lIHgxPSIyNzUiIHkxPSIxMzUiIHgyPSI0NzUiIHkyPSIxMzUiIGNsYXNzPSJtZXNzYWdlTGluZTAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlPSJibGFjayIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQpIiBzdHlsZT0iZmlsbDogbm9uZTsiPjwvbGluZT48L2c+PGc+PHRleHQgeD0iNTc1IiB5PSIxNjMiIGNsYXNzPSJtZXNzYWdlVGV4dCIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7Ij5jb252ZXJ0cyB0byBPcGVyYXRpb248L3RleHQ+PGxpbmUgeDE9IjQ3NSIgeTE9IjE3MCIgeDI9IjY3NSIgeTI9IjE3MCIgY2xhc3M9Im1lc3NhZ2VMaW5lMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9ImJsYWNrIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93aGVhZCkiIHN0eWxlPSJmaWxsOiBub25lOyI+PC9saW5lPjwvZz48Zz48dGV4dCB4PSI3NzUiIHk9IjE5OCIgY2xhc3M9Im1lc3NhZ2VUZXh0IiBzdHlsZT0idGV4dC1hbmNob3I6IG1pZGRsZTsiPnJvdXRlcyB0byBkZXRlcm1pbmUgd2hvIHJ1bnMgaXQ8L3RleHQ+PGxpbmUgeDE9IjY3NSIgeTE9IjIwNSIgeDI9Ijg3NSIgeTI9IjIwNSIgY2xhc3M9Im1lc3NhZ2VMaW5lMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9ImJsYWNrIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93aGVhZCkiIHN0eWxlPSJmaWxsOiBub25lOyI+PC9saW5lPjwvZz48Zz48dGV4dCB4PSI5NzUiIHk9IjIzMyIgY2xhc3M9Im1lc3NhZ2VUZXh0IiBzdHlsZT0idGV4dC1hbmNob3I6IG1pZGRsZTsiPnJvdXRlcyB0byBQcm9jZXNzb3I8L3RleHQ+PGxpbmUgeDE9Ijg3NSIgeTE9IjI0MCIgeDI9IjEwNzUiIHkyPSIyNDAiIGNsYXNzPSJtZXNzYWdlTGluZTAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlPSJibGFjayIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQpIiBzdHlsZT0iZmlsbDogbm9uZTsiPjwvbGluZT48L2c+PGc+PHRleHQgeD0iMTE3NSIgeT0iMjY4IiBjbGFzcz0ibWVzc2FnZVRleHQiIHN0eWxlPSJ0ZXh0LWFuY2hvcjogbWlkZGxlOyI+U0VMRUNUICogRlJPTSAiQm9va3MiPC90ZXh0PjxsaW5lIHgxPSIxMDc1IiB5MT0iMjc1IiB4Mj0iMTI3NSIgeTI9IjI3NSIgY2xhc3M9Im1lc3NhZ2VMaW5lMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9ImJsYWNrIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93aGVhZCkiIHN0eWxlPSJmaWxsOiBub25lOyI+PC9saW5lPjwvZz48Zz48dGV4dCB4PSIxMTc1IiB5PSIzMDMiIGNsYXNzPSJtZXNzYWdlVGV4dCIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7Ij5SZXR1cm5zIGFsbCByb3dzPC90ZXh0PjxsaW5lIHgxPSIxMjc1IiB5MT0iMzEwIiB4Mj0iMTA3NSIgeTI9IjMxMCIgY2xhc3M9Im1lc3NhZ2VMaW5lMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9ImJsYWNrIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93aGVhZCkiIHN0eWxlPSJmaWxsOiBub25lOyI+PC9saW5lPjwvZz48Zz48dGV4dCB4PSI5NzUiIHk9IjMzOCIgY2xhc3M9Im1lc3NhZ2VUZXh0IiBzdHlsZT0idGV4dC1hbmNob3I6IG1pZGRsZTsiPlNlcmlhbGl6ZXMgYXMgQm9va1tdPC90ZXh0PjxsaW5lIHgxPSIxMDc1IiB5MT0iMzQ1IiB4Mj0iODc1IiB5Mj0iMzQ1IiBjbGFzcz0ibWVzc2FnZUxpbmUwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZT0iYmxhY2siIG1hcmtlci1lbmQ9InVybCgjYXJyb3doZWFkKSIgc3R5bGU9ImZpbGw6IG5vbmU7Ij48L2xpbmU+PC9nPjxnPjx0ZXh0IHg9Ijc3NSIgeT0iMzczIiBjbGFzcz0ibWVzc2FnZVRleHQiIHN0eWxlPSJ0ZXh0LWFuY2hvcjogbWlkZGxlOyI+ZmluaXNoZXMgZXhlY3V0aW9uPC90ZXh0PjxsaW5lIHgxPSI4NzUiIHkxPSIzODAiIHgyPSI2NzUiIHkyPSIzODAiIGNsYXNzPSJtZXNzYWdlTGluZTAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlPSJibGFjayIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQpIiBzdHlsZT0iZmlsbDogbm9uZTsiPjwvbGluZT48L2c+PGc+PHRleHQgeD0iNTc1IiB5PSI0MDgiIGNsYXNzPSJtZXNzYWdlVGV4dCIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7Ij5wYXNzZXMgcmVzdWx0IHRvIG1pZGRsZXdhcmU8L3RleHQ+PGxpbmUgeDE9IjY3NSIgeTE9IjQxNSIgeDI9IjQ3NSIgeTI9IjQxNSIgY2xhc3M9Im1lc3NhZ2VMaW5lMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9ImJsYWNrIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93aGVhZCkiIHN0eWxlPSJmaWxsOiBub25lOyI+PC9saW5lPjwvZz48Zz48dGV4dCB4PSIzNzUiIHk9IjQ0MyIgY2xhc3M9Im1lc3NhZ2VUZXh0IiBzdHlsZT0idGV4dC1hbmNob3I6IG1pZGRsZTsiPnNlcmlhbGl6ZXMgYXMgSlNPTkFQSSBpbiBIVFRQPC90ZXh0PjxsaW5lIHgxPSI0NzUiIHkxPSI0NTAiIHgyPSIyNzUiIHkyPSI0NTAiIGNsYXNzPSJtZXNzYWdlTGluZTAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlPSJibGFjayIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQpIiBzdHlsZT0iZmlsbDogbm9uZTsiPjwvbGluZT48L2c+PGc+PHRleHQgeD0iMTc1IiB5PSI0NzgiIGNsYXNzPSJtZXNzYWdlVGV4dCIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7Ij5IVFRQIDIwMCBPSyB7IGRhdGE6IFsgLi4uIF0gfTwvdGV4dD48bGluZSB4MT0iMjc1IiB5MT0iNDg1IiB4Mj0iNzUiIHkyPSI0ODUiIGNsYXNzPSJtZXNzYWdlTGluZTAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlPSJibGFjayIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQpIiBzdHlsZT0iZmlsbDogbm9uZTsiPjwvbGluZT48L2c+PGc+PHJlY3QgeD0iMCIgeT0iNTA1IiBmaWxsPSIjZWFlYWVhIiBzdHJva2U9IiM2NjYiIHdpZHRoPSIxNTAiIGhlaWdodD0iNjUiIHJ4PSIzIiByeT0iMyIgY2xhc3M9ImFjdG9yIj48L3JlY3Q+PHRleHQgeD0iNzUiIHk9IjUzNy41IiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgYWxpZ25tZW50LWJhc2VsaW5lPSJjZW50cmFsIiBjbGFzcz0iYWN0b3IiIHN0eWxlPSJ0ZXh0LWFuY2hvcjogbWlkZGxlOyBmb250LXNpemU6IDE0cHg7IGZvbnQtZmFtaWx5OiBPcGVuLVNhbnMsIHNhbnMtc2VyaWY7Ij48dHNwYW4geD0iNzUiIGR5PSIwIj5Db25zdW1lcjwvdHNwYW4+PC90ZXh0PjwvZz48Zz48cmVjdCB4PSIyMDAiIHk9IjUwNSIgZmlsbD0iI2VhZWFlYSIgc3Ryb2tlPSIjNjY2IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjY1IiByeD0iMyIgcnk9IjMiIGNsYXNzPSJhY3RvciI+PC9yZWN0Pjx0ZXh0IHg9IjI3NSIgeT0iNTM3LjUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBhbGlnbm1lbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGNsYXNzPSJhY3RvciIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7IGZvbnQtc2l6ZTogMTRweDsgZm9udC1mYW1pbHk6IE9wZW4tU2Fucywgc2Fucy1zZXJpZjsiPjx0c3BhbiB4PSIyNzUiIGR5PSIwIj5Lb2EgU2VydmVyPC90c3Bhbj48L3RleHQ+PC9nPjxnPjxyZWN0IHg9IjQwMCIgeT0iNTA1IiBmaWxsPSIjZWFlYWVhIiBzdHJva2U9IiM2NjYiIHdpZHRoPSIxNTAiIGhlaWdodD0iNjUiIHJ4PSIzIiByeT0iMyIgY2xhc3M9ImFjdG9yIj48L3JlY3Q+PHRleHQgeD0iNDc1IiB5PSI1MzcuNSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGFsaWdubWVudC1iYXNlbGluZT0iY2VudHJhbCIgY2xhc3M9ImFjdG9yIiBzdHlsZT0idGV4dC1hbmNob3I6IG1pZGRsZTsgZm9udC1zaXplOiAxNHB4OyBmb250LWZhbWlseTogT3Blbi1TYW5zLCBzYW5zLXNlcmlmOyI+PHRzcGFuIHg9IjQ3NSIgZHk9IjAiPkpTT05BUEkgTWlkZGxld2FyZTwvdHNwYW4+PC90ZXh0PjwvZz48Zz48cmVjdCB4PSI2MDAiIHk9IjUwNSIgZmlsbD0iI2VhZWFlYSIgc3Ryb2tlPSIjNjY2IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjY1IiByeD0iMyIgcnk9IjMiIGNsYXNzPSJhY3RvciI+PC9yZWN0Pjx0ZXh0IHg9IjY3NSIgeT0iNTM3LjUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBhbGlnbm1lbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGNsYXNzPSJhY3RvciIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7IGZvbnQtc2l6ZTogMTRweDsgZm9udC1mYW1pbHk6IE9wZW4tU2Fucywgc2Fucy1zZXJpZjsiPjx0c3BhbiB4PSI2NzUiIGR5PSIwIj5KU09OQVBJIE9wZXJhdGlvbjwvdHNwYW4+PC90ZXh0PjwvZz48Zz48cmVjdCB4PSI4MDAiIHk9IjUwNSIgZmlsbD0iI2VhZWFlYSIgc3Ryb2tlPSIjNjY2IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjY1IiByeD0iMyIgcnk9IjMiIGNsYXNzPSJhY3RvciI+PC9yZWN0Pjx0ZXh0IHg9Ijg3NSIgeT0iNTM3LjUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBhbGlnbm1lbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGNsYXNzPSJhY3RvciIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7IGZvbnQtc2l6ZTogMTRweDsgZm9udC1mYW1pbHk6IE9wZW4tU2Fucywgc2Fucy1zZXJpZjsiPjx0c3BhbiB4PSI4NzUiIGR5PSIwIj5KU09OQVBJIEFwcGxpY2F0aW9uPC90c3Bhbj48L3RleHQ+PC9nPjxnPjxyZWN0IHg9IjEwMDAiIHk9IjUwNSIgZmlsbD0iI2VhZWFlYSIgc3Ryb2tlPSIjNjY2IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjY1IiByeD0iMyIgcnk9IjMiIGNsYXNzPSJhY3RvciI+PC9yZWN0Pjx0ZXh0IHg9IjEwNzUiIHk9IjUzNy41IiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgYWxpZ25tZW50LWJhc2VsaW5lPSJjZW50cmFsIiBjbGFzcz0iYWN0b3IiIHN0eWxlPSJ0ZXh0LWFuY2hvcjogbWlkZGxlOyBmb250LXNpemU6IDE0cHg7IGZvbnQtZmFtaWx5OiBPcGVuLVNhbnMsIHNhbnMtc2VyaWY7Ij48dHNwYW4geD0iMTA3NSIgZHk9IjAiPktuZXhQcm9jZXNzb3I8L3RzcGFuPjwvdGV4dD48L2c+PGc+PHJlY3QgeD0iMTIwMCIgeT0iNTA1IiBmaWxsPSIjZWFlYWVhIiBzdHJva2U9IiM2NjYiIHdpZHRoPSIxNTAiIGhlaWdodD0iNjUiIHJ4PSIzIiByeT0iMyIgY2xhc3M9ImFjdG9yIj48L3JlY3Q+PHRleHQgeD0iMTI3NSIgeT0iNTM3LjUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBhbGlnbm1lbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGNsYXNzPSJhY3RvciIgc3R5bGU9InRleHQtYW5jaG9yOiBtaWRkbGU7IGZvbnQtc2l6ZTogMTRweDsgZm9udC1mYW1pbHk6IE9wZW4tU2Fucywgc2Fucy1zZXJpZjsiPjx0c3BhbiB4PSIxMjc1IiBkeT0iMCI+RGF0YWJhc2U8L3RzcGFuPjwvdGV4dD48L2c+PC9zdmc+">

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
