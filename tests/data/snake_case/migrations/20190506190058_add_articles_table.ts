exports.up = async (knex) => {
  await knex.schema.createTable("articles", table => {
    table.increments("id").primary();
    table.string("body");
    table
      .integer("author")
      .references("id")
      .inTable("users");
    table.dateTime("created_at");
    table.dateTime("updated_at");

  });
}

exports.down = async (knex) => {
  await knex.schema.dropTable("articles");
}
