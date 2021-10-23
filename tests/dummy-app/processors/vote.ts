import { Operation, HasId, Authorize, KnexProcessor } from "../kurier";
import signAndTimestampOperation from "../utils/sign-and-timestamp";
import User from "../resources/user";
import Vote from "../resources/vote";

export default class VoteProcessor<ResourceT extends Vote> extends KnexProcessor<ResourceT> {
  static resourceClass = Vote;

  private async signAndTimestamp(op: Operation): Promise<Operation> {
    return signAndTimestampOperation(op, await this.resourceFor(op.ref.type), this.appInstance.user as unknown as User);
  }

  @Authorize()
  public async add(op: Operation): Promise<HasId> {
    return super.add(await this.signAndTimestamp(op));
  }

  @Authorize()
  public async update(op: Operation): Promise<HasId> {
    return super.update(await this.signAndTimestamp(op));
  }
}
