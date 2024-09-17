import type { BlockCommands } from '@blocksuite/block-std';

import { insertEmbedLinkedDocCommand } from './insert-embed-linked-doc.js';
import { insertLinkByQuickSearchCommand } from './insert-link-by-quick-search.js';

export const commands: BlockCommands = {
  insertEmbedLinkedDoc: insertEmbedLinkedDocCommand,
  insertLinkByQuickSearch: insertLinkByQuickSearchCommand,
};
