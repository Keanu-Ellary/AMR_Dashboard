/* eslint-disable @typescript-eslint/no-require-imports */
const { createDefaultPreset } = require("ts-jest");
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const tsJestTransformCfg = createDefaultPreset().transform;

const frontendConfig = {
  displayName: "frontend-tests",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.frontend.ts"],
  testMatch: ["<rootDir>/tests/frontend-unit-tests/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
    tsconfig: "<rootDir>/tsconfig.test.json",
  }],
  },
};

/** @type {import("jest").Config} **/
module.exports = createJestConfig({
  projects: [
    {
      displayName: "backend-tests",
      preset: "ts-jest",
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
      },
      transform: {
        ...tsJestTransformCfg,
      },
    },

    {
      displayName: "backend-integration",
      preset: "ts-jest",
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup.integration.ts"],
      testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
      },
      transform: {
        ...tsJestTransformCfg,
      },
    },

    frontendConfig,
  ],
});