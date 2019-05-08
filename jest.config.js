const baseProject = {
  moduleNameMapper: {
    "^@ebryn/jsonapi-ts": "<rootDir>/src",
    "^@ebryn/jsonapi-ts/(.*)$": "<rootDir>/src/$1",
    "^@acceptance/(.*)$": "<rootDir>/tests/acceptance/$1",
    "^@dummy/(.*)$": "<rootDir>/tests/dummy/src/$1",
    "^@unit/(.*)$": "<rootDir>/tests/unit/$1",
  },
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.test.json",
    },
  },
};

module.exports = {
  projects: [
    {
      ...baseProject,
      displayName: "unit",
      testMatch: [
        "<rootDir>/tests/unit/**/?(*.)+(spec|test).ts"
      ],
    },
    {
      ...baseProject,
      displayName: "acceptance",
      "setupFilesAfterEnv": [
        "<rootDir>/tests/acceptance/setup.ts"
      ],
      testMatch: [
        "<rootDir>/tests/acceptance/**/?(*.)+(spec|test).ts"
      ],
    },
  ],
};
