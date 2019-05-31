import { Transaction } from "knex";
import app from "./test-app/app";
import context from "./transaction";

const knex = app.services.knex;

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

beforeEach(async () => {
  context.transaction = await createTransaction(knex, transaction => {
    app.services.knex = transaction;
  });
});

afterEach(async () => {
  await context.transaction.rollback();
});
