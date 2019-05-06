import { plural, singular } from "pluralize";

function pluralize(word = "") {
  return plural(word);
}

function singularize(word = "") {
  return singular(word);
}

export { camelize, capitalize, classify, dasherize, decamelize, underscore } from "ember-cli-string-utils";
export { pluralize, singularize };
