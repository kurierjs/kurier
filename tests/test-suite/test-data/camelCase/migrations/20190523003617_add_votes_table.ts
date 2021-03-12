exports.up = async (knex) => {
  await knex.schema.createTable("votes", table => {
    table.increments("_Id").primary();
    table.integer("points");

    table.dateTime("createdOn");
    table.dateTime("updatedOn");
    table.integer("updatedBy");
    table.integer("createdBy");

    table
      .integer("userId")
      .references("id")
      .inTable("users");

    table
      .integer("articleId")
      .references("id")
      .inTable("articles");
  });
}

exports.down = async (knex) => {
  await knex.schema.dropTable("votes");
}
