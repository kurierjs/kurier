import knexfile from "./test-data/knexfile";
import { knex } from "knex";
import app from "./test-app/app";

module.exports = async () => {
  app.services.knex = knex(knexfile["test_snake_case"]);
  await app.services.knex.migrate.rollback();
  await app.services.knex.migrate.latest();
  await app.services.knex.seed.run();

  app.services.knex = knex(knexfile["test_camelCase"]);
  await app.services.knex.migrate.rollback();
  await app.services.knex.migrate.latest();
  await app.services.knex.seed.run();
};
