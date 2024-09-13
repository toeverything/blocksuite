import type { BlockCommands } from '@blocksuite/block-std';

import { addParagraphCommand } from './add-paragraph.js';
import { appendParagraphCommand } from './append-paragraph.js';
import { dedentParagraphCommand } from './dedent-paragraph.js';
import { indentParagraphCommand } from './indent-paragraph.js';
import { splitParagraphCommand } from './split-paragraph.js';

export const commands: BlockCommands = {
  appendParagraph: appendParagraphCommand,
  splitParagraph: splitParagraphCommand,
  addParagraph: addParagraphCommand,
  indentParagraph: indentParagraphCommand,
  dedentParagraph: dedentParagraphCommand,
};
