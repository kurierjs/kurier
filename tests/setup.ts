import { Transaction } from "knex";
import knexMigrate from "knex-migrate";
import app from "./dummy/src/app";
import context from "./transaction";
import knexfile from "./dummy/src/knexfile";
import { Operation, ResourceAttributes } from "../src";

const knex = app.services.knex;

let migrationTransaction: Transaction;

const createTransaction = (connection, callback): Promise<Transaction> => {
  return new Promise(resolve =>
    connection
      .transaction(t => {
        callback(t);
        return resolve(t);
      })
      .catch(e => {})
  );
};

beforeAll(async () => {
  migrationTransaction = await createTransaction(knex, () => {});
  await migrationTransaction.migrate.latest();

  app.services.login = async (op: Operation, user: ResourceAttributes) => {
    return op.data.attributes.email === user.email && op.data.attributes.password === user.password;
  };
  app.services.password = async (op: Operation) => ({
    password: op.data.attributes.password
  });
});

afterAll(async () => {
  await migrationTransaction.rollback();
});

beforeEach(async () => {
  context.transaction = await createTransaction(migrationTransaction, t => {
    app.services.knex = t;
  });
});

afterEach(async () => {
  await context.transaction.rollback();
});
