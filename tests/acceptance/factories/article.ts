import * as faker from "faker";
import { Factory } from "rosie";

export default Factory.define("user").attrs({
  body: () => faker.lorem.paragraphs(3),
});
