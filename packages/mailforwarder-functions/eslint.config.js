const {
    defineConfig,
} = require("eslint/config");

const {
    fixupConfigRules,
    fixupPluginRules,
} = require("@eslint/compat");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const _import = require("eslint-plugin-import");
const preferArrow = require("eslint-plugin-prefer-arrow");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        globals: {},
        parser: tsParser,
        ecmaVersion: 12,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.eslint.json",
            tsConfigRootDir: __dirname,
        },
    },

    settings: {
        "import/resolver": {
            node: {
                extensions: [".js", ".jsx", ".ts", ".tsx"],
            },
            typescript: {
                project: "./tsconfig.eslint.json",
            }
        },
    },

    extends: fixupConfigRules(compat.extends(
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "plugin:@typescript-eslint/recommended-type-checked",
        "prettier",
    )),

    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        import: fixupPluginRules(_import),
        "prefer-arrow": preferArrow,
    },

    rules: {
        "no-use-before-define": "off",
        "@typescript-eslint/no-use-before-define": ["error"],

        "lines-between-class-members": ["error", "always", {
            exceptAfterSingleLine: true,
        }],

        "no-void": [`error`, {
            allowAsStatement: true,
        }],

        "import/extensions": ["error", "ignorePackages", {
            js: "never",
            jsx: "never",
            ts: "never",
            tsx: "never",
        }],

        "prefer-arrow/prefer-arrow-functions": ["error", {
            disallowPrototype: true,
            singleReturnOnly: false,
            classPropertiesAllowed: false,
        }],

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }]
    },
}]);
