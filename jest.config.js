const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.app.json");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	// roots: ["<rootDir>"],
	// modulePaths: [compilerOptions.baseUrl],
	moduleNameMapper: { "@/(.*)": "<rootDir>/src/$1" },
};

