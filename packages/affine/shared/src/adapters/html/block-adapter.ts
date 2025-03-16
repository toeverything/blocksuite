import {
  createIdentifier,
  type ServiceIdentifier,
} from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';

import type { BlockAdapterMatcher } from '../types/adapter.js';
import type { HtmlAST } from '../types/hast.js';
import type { HtmlDeltaConverter } from './delta-converter.js';

export type BlockHtmlAdapterMatcher = BlockAdapterMatcher<
  HtmlAST,
  HtmlDeltaConverter
>;

export const BlockHtmlAdapterMatcherIdentifier =
  createIdentifier<BlockHtmlAdapterMatcher>('BlockHtmlAdapterMatcher');

export function BlockHtmlAdapterExtension(
  matcher: BlockHtmlAdapterMatcher
): ExtensionType & {
  identifier: ServiceIdentifier<BlockHtmlAdapterMatcher>;
} {
  const identifier = BlockHtmlAdapterMatcherIdentifier(matcher.flavour);
  return {
    setup: di => {
      di.addImpl(identifier, () => matcher);
    },
    identifier,
  };
}
