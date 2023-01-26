const allPackages = [
  'blocks',
  'editor',
  'global',
  'phasor',
  'playground',
  'react',
  'store',
];

const createPattern = packageName => [
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
    'packages/blocks/dist/*',
    'packages/editor/dist/*',
    'packages/react/dist/*',
    'packages/react/examples/next/.next/*',
    'packages/phasor/dist/*',
    'packages/playground/dist/assets/*',
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
      files: [`packages/${pkg}/src/*.ts`],
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
  plugins: ['react', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: false },
    ],
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
