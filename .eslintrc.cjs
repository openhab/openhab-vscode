module.exports = {
    env: {
        browser: true,
        node: true,
    },
    extends: ['prettier', 'prettier/@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
        'no-restricted-syntax': [
            'warn',
            {
                selector: 'AwaitExpression',
                message: 'Use Promise chains (.then/.catch) instead of async/await',
            },
        ],
        'no-redeclare': 'error',
    },
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            parserOptions: {
                project: ['tsconfig.json', 'client/tsconfig.json', 'client/tsconfig.test.json'],
                tsconfigRootDir: __dirname,
            },
            rules: {
                '@typescript-eslint/member-delimiter-style': [
                    'off',
                    {
                        multiline: { delimiter: 'none', requireLast: true },
                        singleline: { delimiter: 'semi', requireLast: false },
                    },
                ],
                // Disabled due to existing violations. See issue #334
                '@typescript-eslint/naming-convention': 'off',
                '@typescript-eslint/no-unused-expressions': 'error',
                '@typescript-eslint/semi': ['off', null],
            },
        },
    ],
}
