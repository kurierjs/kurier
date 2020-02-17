exports.up = async (knex) => {
  await knex.schema.createTable("articles", table => {
    table.increments("id").primary();
    table.string("body");
    table
      .integer("author")
      .references("id")
      .inTable("users");
    table.dateTime("createdAt");
    table.dateTime("updatedAt");
  });
}

exports.down = async (knex) => {
  await knex.schema.dropTable("articles");
}
