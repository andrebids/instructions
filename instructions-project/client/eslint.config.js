import reactHooks from 'eslint-plugin-react-hooks';

export default [
    {
        ignores: ['dist/**', 'node_modules/**', 'build/**', '*.config.js', 'public/**'],
    },
    {
        files: ['**/*.{js,jsx}'],
        plugins: {
            'react-hooks': reactHooks,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
        },
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                process: 'readonly',
            },
        },
    },
];
