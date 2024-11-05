import type { BlockCommands } from '@blocksuite/block-std';

import { addParagraphCommand } from './add-paragraph.js';
import { appendParagraphCommand } from './append-paragraph.js';
import {
  canDedentParagraphCommand,
  dedentParagraphCommand,
} from './dedent-paragraph.js';
import {
  canIndentParagraphCommand,
  indentParagraphCommand,
} from './indent-paragraph.js';
import { splitParagraphCommand } from './split-paragraph.js';

export const commands: BlockCommands = {
  appendParagraph: appendParagraphCommand,
  splitParagraph: splitParagraphCommand,
  addParagraph: addParagraphCommand,
  canIndentParagraph: canIndentParagraphCommand,
  canDedentParagraph: canDedentParagraphCommand,
  indentParagraph: indentParagraphCommand,
  dedentParagraph: dedentParagraphCommand,
};
