import Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("votes", table => {
    table.increments("_Id").primary();
    table.integer("points");

    table.dateTime("createdOn");
    table.dateTime("updatedOn");
    table.integer("updatedBy");
    table.integer("createdBy");

    table
      .string("author")
      .references("id")
      .inTable("users");

    table
      .string("article_id")
      .references("id")
      .inTable("articles");
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("votes");
}

