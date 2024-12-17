import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import type { ExtensionType } from '@blocksuite/block-std';

import {
  createIdentifier,
  type ServiceIdentifier,
} from '@blocksuite/global/di';

import type { InlineMarkdownMatch } from './type.js';

export const MarkdownMatcherIdentifier = createIdentifier<
  InlineMarkdownMatch<AffineTextAttributes>
>('AffineMarkdownMatcher');

export function InlineMarkdownExtension(
  matcher: InlineMarkdownMatch<AffineTextAttributes>
): ExtensionType & {
  identifier: ServiceIdentifier<InlineMarkdownMatch<AffineTextAttributes>>;
} {
  const identifier = MarkdownMatcherIdentifier(matcher.name);

  return {
    setup: di => {
      di.addImpl(identifier, () => ({ ...matcher }));
    },
    identifier,
  };
}
