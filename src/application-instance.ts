import Application from "./application";
import Resource from "./resource";

export default class ApplicationInstance {
  public user: typeof Resource;

  constructor(public app: Application) {}
}
