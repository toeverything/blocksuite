import type { BlockCommands } from '@blocksuite/block-std';

import { insertLinkByQuickSearchCommand } from './insert-link-by-quick-search.js';

export const commands: BlockCommands = {
  insertLinkByQuickSearch: insertLinkByQuickSearchCommand,
};
