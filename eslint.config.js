import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist', 'node_modules']),
    {
        files: ['**/*.{js,jsx}'],
        extends: [
            js.configs.recommended,
            reactHooks.configs.flat['recommended-latest'],
            reactRefresh.configs.vite(),
        ],
        languageOptions: {
            ecmaVersion: 'latest',
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        rules: {
            'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
            'no-console': 'error',
        },
    },
    {
        // 도메인별 라우트 모듈은 컴포넌트가 아닌 <Route> 묶음을 내보낸다.
        files: ['src/routes/*Routes.jsx'],
        rules: {
            'react-refresh/only-export-components': 'off',
        },
    },
]);
