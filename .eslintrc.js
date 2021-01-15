export default {
    "env": {
        "browser": true,
        "node": true
    },
    "extends": [
        "prettier",
        "prettier/@typescript-eslint"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "@typescript-eslint/member-delimiter-style": [
            "off",
            {
                "multiline": {
                    "delimiter": "none",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/naming-convention": "error",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/semi": [
            "off",
            null
        ],
        "curly": "error",
        "eqeqeq": [
            "error",
            "always"
        ],
        "no-redeclare": "error"
    }
};
