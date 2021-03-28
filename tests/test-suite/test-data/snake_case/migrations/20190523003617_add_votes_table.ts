exports.up = async (knex) => {
  await knex.schema.createTable("votes", table => {
    table.increments("_Id").primary();
    table.integer("points");

    table.dateTime("created_on");
    table.dateTime("updated_on");
    table.integer("updated_by");
    table.integer("created_by");

    table
      .integer("user_id")
      .references("id")
      .inTable("users");

    table
      .integer("article_id")
      .references("id")
      .inTable("articles");
  });
}

exports.down = async (knex) => {
  await knex.schema.dropTable("votes");
}
