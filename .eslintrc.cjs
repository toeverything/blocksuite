/* eslint-disable no-undef */
// ALL_PACKAGES
const allPackages = [
  'framework/block-std',
  'framework/global',
  'frameworlk/inline',
  'framework/store',
  'framework/sync',
  'blocks',
  'docs',
  'playground',
  'presets',
];

const createPattern = packageName => [
  {
    group: ['**/dist', '**/dist/**'],
    message: 'Do not import from dist',
    allowTypeImports: false,
  },
  {
    group: ['**/src', '**/src/**'],
    message: 'Do not import from src',
    allowTypeImports: false,
  },
  {
    group: ['**/*.css', '**/*.css?*'],
    message:
      'Do not import CSS directly, see https://github.com/toeverything/blocksuite/issues/525',
    allowTypeImports: false,
  },
  {
    group: [`@blocksuite/${packageName}`],
    message: 'Do not import package itself',
    allowTypeImports: false,
  },
  ...(packageName === 'blocks'
    ? [
        {
          group: ['**/std.js'],
          message: 'Do not import from std',
          allowTypeImports: false,
        },
      ]
    : []),
];

module.exports = {
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:wc/recommended',
    'plugin:lit/recommended',
  ],
  ignorePatterns: [
    '**/dist/*',
    '**/node_modules/*',
    '**/*.cjs',
    'tests/snapshots/*',
    '__snapshots__/*',
    'examples/**',
  ],
  overrides: [
    {
      plugins: ['@typescript-eslint'],
      files: ['*.ts', '*.spec.ts'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            vars: 'all',
            varsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
        '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
        'no-return-await': 'off',
        '@typescript-eslint/return-await': 'error',
        'require-await': 'off',
        '@typescript-eslint/require-await': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/no-namespace': [
          'error',
          { allowDeclarations: true },
        ],
        'no-constant-binary-expression': 'error',
        'unicorn/no-useless-spread': 'error',
        'unicorn/no-useless-fallback-in-spread': 'error',
        'unicorn/prefer-dom-node-dataset': 'error',
        'unicorn/prefer-dom-node-append': 'error',
        'unicorn/prefer-dom-node-remove': 'error',
        'unicorn/prefer-array-some': 'error',
        'unicorn/prefer-date-now': 'error',
        'unicorn/prefer-blob-reading-methods': 'error',
        'unicorn/no-typeof-undefined': 'error',
        'unicorn/no-useless-promise-resolve-reject': 'error',
        'unicorn/no-new-array': 'error',
        'unicorn/new-for-builtins': 'error',
        'unicorn/prefer-node-protocol': 'error',
        'unicorn/no-useless-length-check': 'error',
      },
    },
    ...allPackages.map(pkg => ({
      files: [`packages/${pkg}/src/**/*.ts`],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            patterns: createPattern(pkg),
          },
        ],
      },
    })),
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: `tsconfig.eslint.json`,
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'simple-import-sort', 'prettier', 'unicorn'],
  rules: {
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: false },
    ],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/dist', '**/dist/**'],
            message: 'Don not import from dist',
            allowTypeImports: false,
          },
          {
            group: ['**/src', '**/src/**'],
            message: 'Don not import from src',
            allowTypeImports: false,
          },
          {
            group: ['**/*.css', '**/*.css?*'],
            message:
              'Don not import CSS directly, see https://github.com/toeverything/blocksuite/issues/525',
            allowTypeImports: false,
          },
        ],
      },
    ],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',
  },
};
