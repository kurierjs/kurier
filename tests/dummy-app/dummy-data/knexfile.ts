// Update with your config settings.
import { join } from "path";

export default {
  development: {
    client: "sqlite3",
    connection: {
      filename: join(__dirname, "dev.sqlite3"),
    },
    useNullAsDefault: true,
    debug: true,
  },
};
