import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import perfectionist from 'eslint-plugin-perfectionist';
import prettier from 'eslint-plugin-prettier';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

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
    'plugin:lit/recommended',
    'plugin:prettier/recommended'
  ),
  perfectionist.configs['recommended-natural'],
  {
    plugins: {
      unicorn,
      prettier,
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
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-switch-case': 'off',
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-named-exports': 'off',
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
      //       'constructor',
      //       'static-private-method',
      //       'static-method',
      //       'private-method',
      //       'method',
      //       ['get-method', 'set-method'],
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
  {
    files: ['packages/framework/block-std/src/**/*.ts'],

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
              group: ['@blocksuite/framework/block-std'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/framework/global/src/**/*.ts'],

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
              group: ['@blocksuite/framework/global'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/framework/inline/src/**/*.ts'],

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
              group: ['@blocksuite/framework/inline'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/framework/store/src/**/*.ts'],

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
              group: ['@blocksuite/framework/store'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/framework/sync/src/**/*.ts'],

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
              group: ['@blocksuite/framework/sync'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/affine/model/src/**/*.ts'],

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
              group: ['@blocksuite/affine/model'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/affine/shared/src/**/*.ts'],

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
              group: ['@blocksuite/affine/shared'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/affine/components/src/**/*.ts'],

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
              group: ['@blocksuite/affine/components'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/affine/block-paragraph/src/**/*.ts'],

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
              group: ['@blocksuite/affine/block-paragraph'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/affine/block-list/src/**/*.ts'],

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
              group: ['@blocksuite/affine/block-list'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/blocks/src/**/*.ts'],

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
              group: ['@blocksuite/blocks'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
            {
              group: ['**/std.js'],
              message: 'Do not import from std',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/docs/src/**/*.ts'],

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
              group: ['@blocksuite/docs'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/playground/src/**/*.ts'],

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
              group: ['@blocksuite/playground'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/presets/src/**/*.ts'],

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
              group: ['@blocksuite/presets'],
              message: 'Do not import package itself',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
];
