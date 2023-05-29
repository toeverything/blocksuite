/* eslint-disable no-undef */
// ALL_PACKAGES
const allPackages = [
  'blocks',
  'docs',
  'editor',
  'global',
  'phasor',
  'playground',
  'store',
  'virgo',
  'connector',
  'lit',
  'hosts',
];

const createPattern = packageName => [
  {
    group: ['roughjs/**'],
    message:
      'Do not import directly,see https://github.com/toeverything/blocksuite/issues/2821',
    allowTypeImports: true,
  },
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
];

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:wc/recommended',
    'plugin:lit/recommended',
  ],
  ignorePatterns: [
    'packages/store/dist/*',
    'packages/lit/dist/*',
    'packages/blocks/dist/*',
    'packages/editor/dist/*',
    'packages/global/dist/*',
    'packages/phasor/dist/*',
    'packages/playground/dist/assets/*',
    'packages/virgo/dist/*',
    'packages/connector/dist/*',
    'packages/hosts/dist/*',
  ],
  overrides: [
    {
      plugins: ['react', '@typescript-eslint'],
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'react/react-in-jsx-scope': 'off',
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
  settings: {
    react: {
      version: '18',
    },
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'simple-import-sort'],
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
  },
};
