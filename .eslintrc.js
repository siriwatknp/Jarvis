module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  settings: {
    "import/resolver": {
      typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
    },
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "babel.config.js",
    "jest.config.js",
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    // quotes: ["error", "double"],
    "@typescript-eslint/ban-ts-comment": "off",
    "require-jsdoc": "off",
  },
};
