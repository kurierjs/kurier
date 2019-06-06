module.exports = {
  globalSetup: "<rootDir>/tests/test-suite/globalSetup.ts",
  moduleFileExtensions: ["ts", "js"],
  reporters: ["default", "jest-junit"],
  projects: [
    {
      moduleFileExtensions: ["ts", "js"],
      transform: {
        "^.+\\.(ts)$": "ts-jest"
      },
      displayName: "unit",
      globals: {
        "ts-jest": {
          tsConfig: "tsconfig.test.json"
        }
      },
      testMatch: ["<rootDir>/tests/test-suite/unit/**/?(*.)+(spec|test).ts"]
    },
    {
      moduleFileExtensions: ["ts", "js"],
      transform: {
        "^.+\\.(ts)$": "ts-jest"
      },
      displayName: "acceptance - camelCase",
      globals: {
        TEST_SUITE: "test_camelCase",
        "ts-jest": {
          tsConfig: "tsconfig.test.json"
        }
      },
      testMatch: ["<rootDir>/tests/test-suite/acceptance/**/?(*.)+(spec|test).ts"],
      setupFilesAfterEnv: ["<rootDir>/tests/test-suite/setup.ts"]
    },
    {
      moduleFileExtensions: ["ts", "js"],
      transform: {
        "^.+\\.(ts)$": "ts-jest"
      },
      displayName: "acceptance - snake_case",
      globals: {
        TEST_SUITE: "test_snake_case",
        "ts-jest": {
          tsConfig: "tsconfig.test.json"
        }
      },
      testMatch: ["<rootDir>/tests/test-suite/acceptance/**/?(*.)+(spec|test).ts"],
      setupFilesAfterEnv: ["<rootDir>/tests/test-suite/setup.ts"]
    }
  ]
};
