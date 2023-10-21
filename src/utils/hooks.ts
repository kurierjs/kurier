import jsonApiErrors from "../errors/json-api-errors";
import { ApplicationHooks, ApplicationInstanceInterface } from "../types";

export const runHookFunctions = async (
  appInstance: ApplicationInstanceInterface,
  hookType: keyof ApplicationHooks,
  parameters: Record<string, unknown> = {},
) => {
  for (const hook of appInstance.app.hooks[hookType]) {
    try {
      await hook(appInstance, parameters);
    } catch (e) {
      throw jsonApiErrors.UnhandledError(`Hook ${hookType}:${hook.name} failed: ${e.message}, ${e.stack}`);
    }
  }
};
