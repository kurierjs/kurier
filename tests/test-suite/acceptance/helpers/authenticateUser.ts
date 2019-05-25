import userFactory from "../factories/user"
import { HasId } from "../../../../src";
import { sign } from "jsonwebtoken";

export default async function authenticateUser(): Promise<{ token: string, user: HasId }> {
  const secureData = {
    type: 'user',
    id: 1,
    attributes: { username: 'me', email: 'me@me.com' },
    relationships: {}
  };

  const token = sign(secureData, process.env.SESSION_KEY || "test", { subject: String(1), expiresIn: "1d" });
  return { user: userFactory.toGet[0] as HasId, token: `Bearer ${token}` };
}
