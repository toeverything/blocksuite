import type { BlockCommands } from '@blocksuite/block-std';

import { addParagraphCommand } from './add-paragraph.js';
import { appendParagraphCommand } from './append-paragraph.js';
import { splitParagraphCommand } from './split-paragraph.js';

export const commands: BlockCommands = {
  appendParagraph: appendParagraphCommand,
  splitParagraph: splitParagraphCommand,
  addParagraph: addParagraphCommand,
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      paragraphConvertedId?: string;
    }
  }
}
