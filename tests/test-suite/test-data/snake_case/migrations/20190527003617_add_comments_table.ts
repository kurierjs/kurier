exports.up = async (knex) => {
  await knex.schema.createTable("comments", (table) => {
    table.increments("_id").primary();
    table.string("body");
    table.string("type");
    table.integer("author_id").notNullable().references("id").inTable("users");

    table.integer("parent_comment_id").references("_id").inTable("comments");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("comments");
};
