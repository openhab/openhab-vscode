#!/usr/bin/env node

/* Small helper to show repository test/dev commands.
   Run: `npm run dev:help` from repository root.
*/

console.log(
    'openHAB VS Code Extension - developer commands\n\n' +
        'Install dependencies:\n' +
        '  npm run pretest-compile   (installs top-level deps)\n' +
        '  npm --prefix client install\n' +
        '  npm --prefix serverJS install\n\n' +
        'Tests:\n' +
        '  npm run test:client            # run client tests\n' +
        '  npm run test:server:unit      # run server unit tests (coverage)\n' +
        '  npm run test:server:integration # run server integration tests\n' +
        '  npm test                      # run client tests then server unit tests\n\n' +
        'Other useful commands:\n' +
        '  npm run compile               # build TypeScript\n' +
        '  npm run watch                 # build in watch mode\n' +
        '  npm run dev:help              # show this help\n\n' +
        'Notes:\n' +
        "- Use the '--prefix' option shown above to run commands in subpackages without changing directories.\n" +
        "- The project includes per-package test scripts; prefer the explicit 'test:client' / 'test:server:*' scripts in CI.\n"
)
