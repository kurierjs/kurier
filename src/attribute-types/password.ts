import AttributeType from "./attribute-type";

const Password = AttributeType("Password", {
  isSensitive: true,
  jsonType: String,
});

export default Password;
