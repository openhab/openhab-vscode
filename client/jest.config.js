module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleNameMapper: {
        '^vscode$': '<rootDir>/__mocks__/vscode.ts'
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.test.json'
        }]
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/extension.ts',
        '!src/WebViews/**',
        '!src/LanguageClient/**'
    ]
}
