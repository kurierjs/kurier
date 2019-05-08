import app from "@dummy/app";

export default async function createSessionToken(email: string, password: string): Promise<string> {
  const attributes = { email, password };

  const [result] = await app.executeOperations([
    {
      op: "add",
      params: {},
      data: {
        attributes,
        type: "session",
        relationships: {}
      },
      ref: {
        type: "session"
      }
    }
  ]);

  return `Bearer ${result.data[0].attributes.token}`;
}
