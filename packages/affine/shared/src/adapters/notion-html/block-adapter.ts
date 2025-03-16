import {
  createIdentifier,
  type ServiceIdentifier,
} from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';

import type { BlockAdapterMatcher } from '../types/adapter.js';
import type { HtmlAST } from '../types/hast.js';
import type { NotionHtmlDeltaConverter } from './delta-converter.js';

export type BlockNotionHtmlAdapterMatcher = BlockAdapterMatcher<
  HtmlAST,
  NotionHtmlDeltaConverter
>;

export const BlockNotionHtmlAdapterMatcherIdentifier =
  createIdentifier<BlockNotionHtmlAdapterMatcher>(
    'BlockNotionHtmlAdapterMatcher'
  );

export function BlockNotionHtmlAdapterExtension(
  matcher: BlockNotionHtmlAdapterMatcher
): ExtensionType & {
  identifier: ServiceIdentifier<BlockNotionHtmlAdapterMatcher>;
} {
  const identifier = BlockNotionHtmlAdapterMatcherIdentifier(matcher.flavour);
  return {
    setup: di => {
      di.addImpl(identifier, () => matcher);
    },
    identifier,
  };
}
