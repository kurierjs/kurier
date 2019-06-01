import * as Knex from "knex";
import app from "./test-app/app";
import context from "./transaction";
import knexfile from "../data/knexfile";
import Serializer from "./test-app/serializers/serializer";
let knexInstance;
const createTransaction = (connection, callback): Promise<Knex.Transaction> => {
  return new Promise(resolve =>
    connection
      .transaction(t => {
        callback(t);
        return resolve(t);
      })
      .catch(t => { })
  );
};
const serializer = global["TEST_SUITE"] === "test_snake_case" ? app.serializer : new Serializer();

beforeAll(async () => {
  knexInstance = await createTransaction(Knex(knexfile[global["TEST_SUITE"]]), () => { });
  app.serializer = serializer;
});

beforeEach(async () => {
  context.transaction = await createTransaction(knexInstance, transaction => {
    app.services.knex = transaction;
  });
});

afterEach(async () => {
  await context.transaction.rollback();
});
