module.exports = {
    env: {
        browser: true,
        node: true
    },
    extends: [
        'prettier',
        'prettier/@typescript-eslint'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module'
    },
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            parserOptions: {
                project: ['tsconfig.json', 'client/tsconfig.json', 'client/tsconfig.test.json']
            }
        }
    ],
    plugins: ['@typescript-eslint'],
    rules: {
        'no-restricted-syntax': [
            'warn',
            {
                selector: 'AwaitExpression',
                message: 'Use Promise chains (.then/.catch) instead of async/await'
            }
        ]
    }
};
