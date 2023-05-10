import Addon from "../addon";
import {
  AddonOptions,
  ApplicationInstanceInterface,
  ApplicationInterface,
  Operation,
  ResourceAttributes,
} from "../types";
import User from "../resources/user";
import Application from "../application";
import Password from "../attribute-types/password";
import Resource from "../resource";
import JsonApiUserProcessor from "../processors/user-processor";
import JsonApiSessionProcessor from "../processors/session-processor";
import Session from "../resources/session";

export type UserManagementAddonOptions = AddonOptions & {
  userResource: typeof User;
  userProcessor?: typeof JsonApiUserProcessor;
  sessionProcessor?: typeof JsonApiSessionProcessor;
  userEncryptPasswordCallback?: (op: Operation) => Promise<ResourceAttributes>;
  userLoginCallback?: (op: Operation, userDataSource: ResourceAttributes) => Promise<boolean>;
  userGenerateIdCallback?: () => Promise<string>;
  userRolesProvider?: (this: ApplicationInstanceInterface, user: User) => Promise<string[]>;
  userPermissionsProvider?: (this: ApplicationInstanceInterface, user: User) => Promise<string[]>;
  usernameRequestParameter?: string;
  passwordRequestParameter?: string;
  jwtClaimForUserID?: string;
  includeTokenInIdentifyOpDataPayload?: boolean;
};

const defaults: UserManagementAddonOptions = {
  userResource: User,
  userProcessor: JsonApiUserProcessor,
  sessionProcessor: JsonApiSessionProcessor,
  userRolesProvider: async () => [],
  userPermissionsProvider: async () => [],
  userLoginCallback: async () => {
    console.warn(
      "WARNING: You're using the default login callback with UserManagementAddon." +
        "ANY LOGIN REQUEST WILL PASS. Implement this callback in your addon configuration.",
    );
    return true;
  },

  userEncryptPasswordCallback: async (op: Operation) => {
    console.warn(
      "WARNING: You're using the default encryptPassword callback with UserManagementAddon." +
        "Your password is NOT being encrypted. Implement this callback in your addon configuration.",
    );

    return { password: op.data?.attributes.password.toString() } as ResourceAttributes;
  },
  usernameRequestParameter: "username",
  passwordRequestParameter: "password",
  jwtClaimForUserID: "id",
  includeTokenInIdentifyOpDataPayload: false,
};

export default class UserManagementAddon extends Addon {
  constructor(
    public readonly app: ApplicationInterface,
    public readonly options: UserManagementAddonOptions = {} as UserManagementAddonOptions,
  ) {
    super(app);
    this.options = { ...defaults, ...options };
  }

  async install() {
    const sessionResourceType = this.createSessionResource();

    this.app.services.roles = this.options.userRolesProvider;
    this.app.services.permissions = this.options.userPermissionsProvider;

    this.app.types.push(this.options.userResource, sessionResourceType);
    this.app.processors.push(
      this.createUserProcessor() as unknown as typeof JsonApiUserProcessor,
      this.createSessionProcessor(sessionResourceType) as typeof JsonApiSessionProcessor,
    );
  }

  private createUserProcessor() {
    const { userProcessor, userEncryptPasswordCallback, userGenerateIdCallback } = this.options;

    let generateIdCallback = async () => "";
    let encryptPasswordCallback = async (op: Operation) => ({} as ResourceAttributes);

    if (userProcessor === JsonApiUserProcessor) {
      generateIdCallback = userGenerateIdCallback || generateIdCallback;
      encryptPasswordCallback = userEncryptPasswordCallback as (op: Operation) => Promise<ResourceAttributes>;
    } else {
      generateIdCallback = userProcessor?.prototype["generateId"] as () => Promise<string>;
      encryptPasswordCallback = userProcessor?.prototype["encryptPassword"] as (
        op: Operation,
      ) => Promise<ResourceAttributes>;
    }

    return ((options) =>
      class UserProcessor<T extends User> extends (options.userProcessor || JsonApiUserProcessor)<T> {
        public static resourceClass = options.userResource;

        static async shouldHandle(resourceType: string): Promise<boolean> {
          return this.resourceClass && resourceType === this.resourceClass.type;
        }

        protected async generateId() {
          return generateIdCallback.bind(this)();
        }

        protected async encryptPassword(op: Operation) {
          return encryptPasswordCallback.bind(this)(op);
        }
      })(this.options);
  }

  private createSessionProcessor(sessionResourceType: typeof Resource) {
    const { sessionProcessor } = this.options;

    if (sessionProcessor === JsonApiSessionProcessor) {
      return ((options) =>
        class SessionProcessor<T extends Session> extends JsonApiSessionProcessor<T> {
          public static resourceClass = sessionResourceType as typeof Session;

          protected async login(op: Operation, userDataSource: ResourceAttributes): Promise<boolean> {
            return (options.userLoginCallback || ((_, __) => true))(op, userDataSource);
          }
        })(this.options);
    }

    if (sessionProcessor !== undefined) {
      return ((options) =>
        class SessionProcessor<T extends Session> extends (options.sessionProcessor!)<T> {
          public static resourceClass = sessionResourceType as typeof Session;
        })(this.options);
    }
  }

  private createSessionResource() {
    return ((options) =>
      class Session extends Resource {
        public static get type() {
          return "session";
        }

        public static schema = {
          attributes: {
            token: String,
            [options.usernameRequestParameter as string]: String,
            [options.passwordRequestParameter as string]: Password,
          },
          relationships: {
            user: {
              type: () => options.userResource,
              belongsTo: true,
            },
          },
        };
      })(this.options);
  }
}
