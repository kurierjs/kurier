exports.up = async (knex) => {
  await knex.schema.createTable("tags", (table) => {
    table.string("id").primary();
    table.string("name");

    table.integer("bookId").notNullable().references("id").inTable("books");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("tags");
};
