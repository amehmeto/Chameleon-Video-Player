import prettier from 'eslint-plugin-prettier'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['node_modules/**', 'build/**', 'dist/**', '*.js'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        // Node.js globals
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        global: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        HTMLElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLImageElement: 'readonly',
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        alert: 'readonly',
        // Electron globals
        electron: 'readonly',
      },
    },
    plugins: {
      prettier,
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Code style
      'object-shorthand': ['error', 'always'],
      'prefer-const': 'error',
      curly: ['error', 'multi-or-nest'],
      eqeqeq: ['error', 'always'],

      // Complexity and readability
      'no-nested-ternary': 'error',
      'no-else-return': 'warn',
      'max-statements-per-line': ['error', { max: 1 }],
      complexity: ['warn', { max: 15 }],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'block-like', next: 'block-like' },
      ],

      // Console - warn instead of error for Electron apps
      'no-console': 'warn',

      // Disable base rule in favor of TypeScript version
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
    },
  },
]
