import type { MarkdownAST } from '@blocksuite/affine-shared/adapters';

import type { ElementModelMatcher } from '../../type.js';

export type ElementModelToMarkdownAdapterMatcher =
  ElementModelMatcher<MarkdownAST>;
