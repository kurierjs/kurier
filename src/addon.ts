import Application from "./application";
import { IAddon, AddonOptions } from "./types";

export default class Addon implements IAddon {
  constructor(public readonly app: Application, public readonly options?: AddonOptions) {
    this.app = app;
    this.options = options;
  }

  async install() {}
}
