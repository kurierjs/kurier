import { Operation, HasId, Authorize, KnexProcessor } from "../jsonapi-ts";
import signAndTimestampOperation from '../utils/sign-and-timestamp';
import User from "../resources/user";
import Vote from "../resources/vote";

export default class VoteProcessor<
  ResourceT extends Vote
  > extends KnexProcessor<ResourceT> {
  static resourceClass = Vote;

  private async signAndTimestamp(op: Operation): Promise<Operation> {
    console.log("appInstance", this.appInstance.app);
    console.log("user user", this.appInstance.user);

    const opWithTimeStamps = signAndTimestampOperation(
      op,
      await this.resourceFor(op.ref.type),
      (this.appInstance.user as unknown) as User
    );
    return op;
  }

  @Authorize()
  public async add(op: Operation): Promise<HasId> {
    return super.add(await this.signAndTimestamp(op));
  }
}
