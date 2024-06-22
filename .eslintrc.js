module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint/eslint-plugin',
        'simple-import-sort',
        'import',
        'unicorn',
        'security',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
        'plugin:unicorn/all',
        'plugin:security/recommended-legacy',
        'plugin:prettier/recommended',
    ],
    root: true,
    env: { node: true },
    ignorePatterns: ['.eslintrc.js'],
    rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'unicorn/no-null': 'off',
        'unicorn/no-array-reduce': 'off',
        'unicorn/import-style': [
            'error',
            {
                styles: {
                    'node:path': {
                        namespace: true, // Use namespace import for path module
                        default: false,
                    },
                },
            },
        ],
    },
};
