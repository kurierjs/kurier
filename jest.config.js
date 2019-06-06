const baseProject = {
  moduleNameMapper: {
    "^@ebryn/jsonapi-ts": "<rootDir>/src",
    "^@ebryn/jsonapi-ts/(.*)$": "<rootDir>/src/$1",
    "^@acceptance/(.*)$": "<rootDir>/tests/acceptance/$1",
    "^@dummy/(.*)$": "<rootDir>/tests/dummy/src/$1",
    "^@unit/(.*)$": "<rootDir>/tests/unit/$1"
  },
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts)$": "ts-jest"
  },
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.test.json"
    }
  },
  testMatch: ["<rootDir>/tests/test-suite/acceptance/**/?(*.)+(spec|test).ts"]
};

module.exports = {
  globalSetup: "<rootDir>/tests/test-suite/globalSetup.ts",
  moduleFileExtensions: ["ts", "js"],
  reporters: ["default", "jest-junit"],
  projects: [
    {
      ...baseProject,
      displayName: "unit",
      testMatch: ["<rootDir>/tests/test-suite/unit/**/?(*.)+(spec|test).ts"]
    },
    {
      ...baseProject,
      displayName: "acceptance - camelCase",
      globals: {
        TEST_SUITE: "test_camelCase",
        "ts-jest": {
          tsConfig: "tsconfig.test.json"
        }
      },
      setupFilesAfterEnv: ["<rootDir>/tests/test-suite/setup.ts"]
    },
    {
      ...baseProject,
      displayName: "acceptance - snake_case",
      globals: {
        TEST_SUITE: "test_snake_case",
        "ts-jest": {
          tsConfig: "tsconfig.test.json"
        }
      },
      setupFilesAfterEnv: ["<rootDir>/tests/test-suite/setup.ts"]
    }
  ]
};
