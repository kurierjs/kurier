import Application from "./application";
import { IAddon, AddonOptions } from "./types";

export default class Addon implements IAddon {
  constructor(protected readonly app: Application, protected readonly options: AddonOptions) {}
  async install() {}
}
