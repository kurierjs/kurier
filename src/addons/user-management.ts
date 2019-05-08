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
  user: {
    resource: typeof User;
    idGenerator?: "numeric" | "uuid" | (() => string);
    callbacks?: {
      login: (op: Operation, userDataSource: ResourceAttributes) => Promise<boolean>;
      encryptPassword: (op: Operation) => Promise<ResourceAttributes>;
    };
  };
  session?: {
    requestParameterNames?: {
      username?: string;
      password?: string;
    };
  };
};

const defaults: UserManagementAddonOptions = {
  user: {
    resource: User,
    idGenerator: "numeric",
    callbacks: {
      login: async () => {
        console.warn(
          "WARNING: You're using the default login callback with UserManagementAddon." +
            "ANY LOGIN REQUEST WILL PASS. Implement this callback in your addon configuration."
        );
        return true;
      },

      encryptPassword: async (op: Operation) => {
        console.warn(
          "WARNING: You're using the default encryptPassword callback with UserManagementAddon." +
            "Your password is NOT being encrypted. Implement this callback in your addon configuration."
        );

        return { password: op.data.attributes.password };
      }
    }
  },
  session: {
    requestParameterNames: {
      username: "username",
      password: "password"
    }
  }
};

export default class UserManagementAddon extends Addon {
  constructor(protected readonly app: Application, protected readonly options: UserManagementAddonOptions = defaults) {
    super(app, {});

    this.options = {
      user: {
        ...defaults.user,
        ...options.user
      },
      session: {
        ...defaults.session,
        ...options.session
      }
    };
  }

  async install() {
    const sessionResourceType = this.createSessionResource();

    this.app.types.push(this.options.user.resource, sessionResourceType);
    this.app.processors.push(this.createUserProcessor(), this.createSessionProcessor(sessionResourceType));
  }

  private createUserProcessor() {
    return (options =>
      class UserProcessor<T extends User> extends JsonApiUserProcessor<T> {
        public static resourceClass = options.user.resource;

        protected async encryptPassword(op: Operation) {
          return options.user.callbacks.encryptPassword(op);
        }
      })(this.options);
  }

  private createSessionProcessor(sessionResourceType: typeof Resource) {
    return (options =>
      class SessionProcessor<T extends Session> extends JsonApiSessionProcessor<T> {
        public static resourceClass = sessionResourceType as typeof Session;

        protected async login(op: Operation, userDataSource: ResourceAttributes): Promise<boolean> {
          return options.user.callbacks.login(op, userDataSource);
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
            [options.session.requestParameterNames.username]: String,
            [options.session.requestParameterNames.password]: Password
          },
          relationships: {
            user: {
              type: () => options.user.resource,
              belongsTo: true
            }
          }
        };
      })(this.options);
  }
}
