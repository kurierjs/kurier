import { Transaction } from "knex";
import app from "./test-app/app";
import context from "./transaction";

const knex = app.services.knex;

let migrationTransaction: Transaction;

const createTransaction = (connection, callback): Promise<Transaction> => {
  return new Promise(resolve =>
    connection
      .transaction(t => {
        callback(t);
        return resolve(t);
      })
      .catch(e => { })
  );
};

beforeAll(async () => {
  migrationTransaction = await createTransaction(knex, () => { });
  await migrationTransaction.migrate.latest();
  await migrationTransaction.seed.run();
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
