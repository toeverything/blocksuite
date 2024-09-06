import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import perfectionist from 'eslint-plugin-perfectionist';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import eslintPluginImportX from 'eslint-plugin-import-x';
import eslintConfigPrettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const createNoRestrictedImports = packagePath => {
  return {
    files: [`packages/${packagePath}/src/**/*.ts`],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
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
              group: [`@blocksuite/${packagePath}`],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  };
};

const entry = path.resolve(__dirname, 'packages');

function getFoldersWithPackageJson(dir) {
  let folders = [];

  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item.includes('node_modules') || item.includes('src')) {
      break;
    }
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (fs.existsSync(path.join(fullPath, 'package.json'))) {
        folders.push(fullPath);
      }
      folders = folders.concat(getFoldersWithPackageJson(fullPath));
    }
  }

  return folders;
}

export default [
  {
    ignores: [
      '**/dist/*',
      '**/node_modules/*',
      '**/*.cjs',
      '.nx',
      'tests/snapshots/*',
      '__snapshots__/*',
      'examples/**/*',
      '**/.coverage/*',
      '**/.vitepress/*',
      '**/schemas.js',
      '**/scripts/*',
      'vitest.workspace.js',
      'eslint.config.mjs',
    ],
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:wc/recommended',
    'plugin:lit/recommended'
  ),
  perfectionist.configs['recommended-natural'],
  {
    plugins: {
      unicorn,
      'import-x': eslintPluginImportX,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],

      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'perfectionist/sort-intersection-types': 'off',
      'perfectionist/sort-union-types': 'off',
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-variable-declarations': 'off',

      // TODO: enable these
      'import-x/no-duplicates': 'off',
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-switch-case': 'off',
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-named-exports': 'off',
      'perfectionist/sort-sets': 'off',
      // 'perfectionist/sort-classes': [
      //   'error',
      //   {
      //     type: 'natural',
      //     order: 'asc',
      //
      //     groups: [
      //       'private-property',
      //       'static-property',
      //       'index-signature',
      //       'property',
      //       ['get-method', 'set-method'],
      //       'constructor',
      //       'static-private-method',
      //       'static-method',
      //       'private-method',
      //       'method',
      //       'unknown',
      //     ],
      //   },
      // ],
    },
  },
  {
    files: ['**/*.ts', '**/*.spec.ts'],

    plugins: {
      '@typescript-eslint': typescriptEslint,
      '@stylistic/ts': stylisticTs,
      'unused-imports': unusedImports,
    },

    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',

      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public',
        },
      ],

      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',

      'unused-imports/no-unused-vars': [
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
      'no-implied-eval': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-generic-constructors': 'error',
      '@typescript-eslint/consistent-indexed-object-style': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',

      '@typescript-eslint/no-namespace': [
        'error',
        {
          allowDeclarations: true,
        },
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
      '@stylistic/ts/lines-between-class-members': 'error',
      '@stylistic/ts/space-before-blocks': 'error',
    },
  },
  ...getFoldersWithPackageJson(entry)
    .map(p => p.replace(__dirname + '/', ''))
    .map(createNoRestrictedImports),
  eslintConfigPrettier,
];
