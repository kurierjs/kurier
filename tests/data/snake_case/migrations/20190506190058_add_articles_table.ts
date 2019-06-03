import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
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

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("articles");
}
