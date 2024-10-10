module.exports = {
  plugins: [
    'unicorn',
    'import',
    'promise',
    'prettier'
  ],
  extends: [
    'airbnb-base',
    'turbo',
    'eslint:recommended',
    'plugin:unicorn/recommended',
    'plugin:promise/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier'
  ],
  overrides: [
    {
      files: [
        '*.ts',
        '*.js',
      ],
      rules: {
        'prefer-const': 'error',
        'sort-imports': [
          'error',
          {
            ignoreDeclarationSort: true,
          },
        ],
        'no-restricted-syntax': [
          'error',
          'ForInStatement',
          'LabeledStatement',
          'WithStatement',
          {
            selector: 'ImportDeclaration[source.value="react"][specifiers.0.type="ImportDefaultSpecifier"]',
            message: 'Default React import not allowed',
          },
        ],
        'no-param-reassign': 'off',
        'no-useless-constructor': 'off',
        'no-empty-function': [
          'error',
          {
            allow: [
              'constructors',
            ],
          },
        ],
        'space-before-function-paren': [
          'error',
          {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always',
          },
        ],
        'newline-after-var': [
          'error',
          'always',
        ],
        'no-underscore-dangle': 'off',
        'array-callback-return': [
          'error',
          {
            allowImplicit: true,
          },
        ],
        'class-methods-use-this': 'off',
        'padding-line-between-statements': [
          'error',
          {
            blankLine: 'always',
            prev: [
              'block',
              'block-like',
              'cjs-export',
              'class',
              'export',
              'import',
            ],
            next: '*',
          },
          {
            blankLine: 'always',
            prev: '*',
            next: 'return',
          },
          {
            blankLine: 'any',
            prev: [
              'export',
              'import',
            ],
            next: [
              'export',
              'import',
            ],
          },
        ],
        'import/prefer-default-export': 'off',
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: [
              '**/*.test.js',
              '**/*.stories.tsx',
              '**/*.spec.js',
              '**/scripts/*.ts',
              '__tests__/**/*.ts',
            ],
          },
        ],
        'import/no-webpack-loader-syntax': 'off',
        'import/no-cycle': 'error',
        'import/extensions': [
          'error',
          'ignorePackages',
          {
            js: 'never',
            jsx: 'never',
            ts: 'never',
            tsx: 'never',
          },
        ],
        'unicorn/filename-case': [
          'error',
          {
            case: 'kebabCase',
          },
        ],
        'unicorn/no-useless-undefined': 'off',
        'unicorn/prefer-module': 'off',
        'unicorn/no-array-reduce': 'off',
        'unicorn/no-null': 'off',
        'unicorn/prefer-node-protocol': 'off',
        'unicorn/no-array-callback-reference': 'off',
        'unicorn/prevent-abbreviations': [
          'error',
          {
            replacements: {
              env: false,
              ctx: false,
              func: false,
              req: false,
              res: false,
              ref: false,
              db: false,
              args: false,
              params: false,
              doc: false,
              docs: false,
              props: false,
            },
          },
        ],
        'lines-between-class-members': [
          'error',
          'always',
        ],
        'max-classes-per-file': 'off',
        'promise/catch-or-return': [
          'warn',
          {
            allowFinally: true,
          },
        ],
      },
    },
    {
      files: [
        '*.ts',
        '*.tsx',
      ],
      extends: [
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:import/typescript',
        'plugin:prettier/recommended',
      ],
      plugins: [
        '@typescript-eslint',
      ],
      rules: {
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
          },
        ],
      },
    },
    {
      files: [
        '*.ts',
      ],
      extends: [
        'prettier',
      ],
      parserOptions: {
        project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'],
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-namespace': 'off',
      },
    },
  ],
};
