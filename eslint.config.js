const prettier = require('eslint-plugin-prettier')

module.exports = [
  {
    ignores: ['node_modules/**', 'build/**', 'dist/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
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
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly',
        // Electron globals
        electron: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

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

      // Unused variables
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]
