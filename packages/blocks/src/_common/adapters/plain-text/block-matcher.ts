import type { BlockPlainTextAdapterMatcher } from '@blocksuite/affine-shared/adapters';
import type { ExtensionType } from '@blocksuite/block-std';

import {
  ListBlockPlainTextAdapterExtension,
  listBlockPlainTextAdapterMatcher,
} from '@blocksuite/affine-block-list';
import {
  ParagraphBlockPlainTextAdapterExtension,
  paragraphBlockPlainTextAdapterMatcher,
} from '@blocksuite/affine-block-paragraph';

import {
  CodeBlockPlainTextAdapterExtension,
  codeBlockPlainTextAdapterMatcher,
} from '../../../code-block/adapters/plain-text.js';
import {
  DividerBlockPlainTextAdapterExtension,
  dividerBlockPlainTextAdapterMatcher,
} from '../../../divider-block/adapters/plain-text.js';

export const defaultBlockPlainTextAdapterMatchers: BlockPlainTextAdapterMatcher[] =
  [
    paragraphBlockPlainTextAdapterMatcher,
    listBlockPlainTextAdapterMatcher,
    dividerBlockPlainTextAdapterMatcher,
    codeBlockPlainTextAdapterMatcher,
  ];

export const BlockPlainTextAdapterExtensions: ExtensionType[] = [
  ParagraphBlockPlainTextAdapterExtension,
  ListBlockPlainTextAdapterExtension,
  DividerBlockPlainTextAdapterExtension,
  CodeBlockPlainTextAdapterExtension,
];
