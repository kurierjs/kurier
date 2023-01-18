import { IAddon, AddonOptions, ApplicationInterface } from "./types";

export default class Addon implements IAddon {
  constructor(public readonly app: ApplicationInterface, public readonly options?: AddonOptions) {
    this.app = app;
    this.options = options;
  }

  async install() {}
}
