import { Resource } from "../kurier";
import Book from "./Book";

export default class Tag extends Resource {
  static schema = {
    attributes: {
      name: String,
    },
    relationships: {
      book: {
        type: () => Book,
        belongsTo: true,
      },
    },
  };
}
