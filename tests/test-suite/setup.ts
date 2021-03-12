import { Knex, knex } from "knex";
import app from "./test-app/app";
import context from "./transaction";
import knexfile from "../data/knexfile";
import Serializer from "./test-app/serializers/serializer";
let knexInstance = knex(knexfile[global["TEST_SUITE"]]);
const createTransaction = (knexInstance, callback): Promise<Knex.Transaction> => {
  return new Promise((resolve) => {
    knexInstance
      .transaction((t) => {
        callback(t);
        return resolve(t);
      })
      .catch((t) => {});
  });
};
const serializer = global["TEST_SUITE"] === "test_snake_case" ? app.serializer : new Serializer();

beforeAll(async () => {
  app.serializer = serializer;
});

beforeEach(async () => {
  context.transaction = await createTransaction(knexInstance, (transaction) => {
    transaction.initialize();
    app.services.knex = transaction;
  });
});

afterEach(async () => {
  await context.transaction.rollback();
  await context.transaction.destroy();
});

afterAll(async () => {
  await knexInstance.destroy();
});
