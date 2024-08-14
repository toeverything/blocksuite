import type { BlockCommands } from '@blocksuite/block-std';

import { appendParagraphCommand } from './append-paragraph.js';

export const commands: BlockCommands = {
  appendParagraph: appendParagraphCommand,
};
