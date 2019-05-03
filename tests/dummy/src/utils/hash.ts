import * as crypto from "crypto";

export default (plainTextPassword, hashKey, algorithm = "sha512") => {
  const hash = crypto.createHmac(algorithm, hashKey);
  hash.update(plainTextPassword);
  return hash.digest("hex");
};
