exports.up = async (knex) => {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username");
    table.string("email");
    table.string("password");
    table.string("location");
    table.dateTime("createdAt");
    table.dateTime("updatedAt");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("users");
};
