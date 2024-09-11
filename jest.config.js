const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
      preset: 'ts-jest',
      testEnvironment: 'node',
      verbose: true,
      // silent: true,
      randomize: true,
      testTimeout: 15000,
      // collectCoverage: true,
      // debug:true,
      maxWorkers: 10,
      testMatch: [
            "**/?(*.)+(jest|test).ts"
      ],
      moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
      modulePaths: [compilerOptions.baseUrl],
      // setupFilesAfterEnv: ["<rootDir>/jest/jestsetup.js"],
}