import type { BlockCommands } from '@blocksuite/block-std';

import { insertBookmarkCommand } from './insert-bookmark.js';

export const commands: BlockCommands = {
  insertBookmark: insertBookmarkCommand,
};
