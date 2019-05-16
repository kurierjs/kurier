import Addon from "../addon";
import { AddonOptions, Operation, ResourceAttributes } from "../types";
import User from "../resources/user";
import Application from "../application";
import Password from "../attribute-types/password";
import Resource from "../resource";
import JsonApiUserProcessor from "../processors/user-processor";
import JsonApiSessionProcessor from "../processors/session-processor";
import Session from "../resources/session";

export type UserManagementAddonOptions = AddonOptions & {
  userResource: typeof User;
  userEncryptPasswordCallback?: (op: Operation) => Promise<ResourceAttributes>;
  userLoginCallback?: (op: Operation, userDataSource: ResourceAttributes) => Promise<boolean>;
  userGenerateIdCallback?: () => Promise<string>;
  usernameRequestParameter?: string;
  passwordRequestParameter?: string;
};

const defaults: UserManagementAddonOptions = {
  userResource: User,
  userLoginCallback: async () => {
    console.warn(
      "WARNING: You're using the default login callback with UserManagementAddon." +
        "ANY LOGIN REQUEST WILL PASS. Implement this callback in your addon configuration."
    );
    return true;
  },

  userEncryptPasswordCallback: async (op: Operation) => {
    console.warn(
      "WARNING: You're using the default encryptPassword callback with UserManagementAddon." +
        "Your password is NOT being encrypted. Implement this callback in your addon configuration."
    );

    return { password: op.data.attributes.password };
  },
  usernameRequestParameter: "username",
  passwordRequestParameter: "password"
};

export default class UserManagementAddon extends Addon {
  constructor(public readonly app: Application, public readonly options?: UserManagementAddonOptions) {
    super(app);
    this.options = { ...defaults, ...options };
  }

  async install() {
    const sessionResourceType = this.createSessionResource();

    this.app.types.push(this.options.userResource, sessionResourceType);
    this.app.processors.push(this.createUserProcessor(), this.createSessionProcessor(sessionResourceType));
  }

  private createUserProcessor() {
    return (options =>
      class UserProcessor<T extends User> extends JsonApiUserProcessor<T> {
        public static resourceClass = options.userResource;

        protected async generateId() {
          return (options.userGenerateIdCallback || (async () => undefined))();
        }

        protected async encryptPassword(op: Operation) {
          return options.userEncryptPasswordCallback(op);
        }
      })(this.options);
  }

  private createSessionProcessor(sessionResourceType: typeof Resource) {
    return (options =>
      class SessionProcessor<T extends Session> extends JsonApiSessionProcessor<T> {
        public static resourceClass = sessionResourceType as typeof Session;

        protected async login(op: Operation, userDataSource: ResourceAttributes): Promise<boolean> {
          return options.userLoginCallback(op, userDataSource);
        }
      })(this.options);
  }

  private createSessionResource() {
    return (options =>
      class Session extends Resource {
        public static get type() {
          return "session";
        }

        public static schema = {
          attributes: {
            token: String,
            [options.usernameRequestParameter]: String,
            [options.passwordRequestParameter]: Password
          },
          relationships: {
            user: {
              type: () => options.userResource,
              belongsTo: true
            }
          }
        };
      })(this.options);
  }
}
