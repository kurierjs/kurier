module.exports = {
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts)$": [
      "ts-jest",
      {
        tsConfig: "tsconfig.test.json",
      }
    ]
  },
};
