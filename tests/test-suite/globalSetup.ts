import app from "./test-app/app";

module.exports = async () => {
  await app.services.knex.migrate.rollback()
  await app.services.knex.migrate.latest();
  await app.services.knex.seed.run();
}
