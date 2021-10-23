exports.up = async (knex) => {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username");
    table.string("email");
    table.string("password");
    table.dateTime("created_at");
    table.dateTime("updated_at");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("users");
};
