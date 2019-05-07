import { Transaction } from "knex";
import knexMigrate from "knex-migrate";
import app from "./dummy/src/app";
import context from "./transaction";
import knexfile from "./dummy/src/knexfile";
import { Operation, ResourceAttributes } from "../src";

const knex = app.services.knex;

const createTransaction = (): Promise<Transaction> => {
  return new Promise(resolve =>
    knex
      .transaction(t => {
        app.services.knex = t;
        return resolve(t);
      })
      .catch(e => {})
  );
};

beforeAll(async () => {
  await knexMigrate("up", {
    config: knexfile[process.env.NODE_ENV || "development"]
  });

  app.services.login = async (op: Operation, user: ResourceAttributes) => {
    return op.data.attributes.email === user.email && op.data.attributes.password === user.password;
  };
  app.services.password = async (op: Operation) => ({
    password: op.data.attributes.password
  });
});

afterAll(async () => {
  await knexMigrate("rollback", {
    config: knexfile[process.env.NODE_ENV || "development"]
  });
});

beforeEach(async () => {
  context.transaction = await createTransaction();
});

afterEach(async () => {
  await context.transaction.rollback();
});
