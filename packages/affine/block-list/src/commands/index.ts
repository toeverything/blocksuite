import type { BlockCommands } from '@blocksuite/block-std';

import { convertToNumberedListCommand } from './convert-to-numbered-list.js';
import { dedentListCommand } from './dedent-list.js';
import { indentListCommand } from './indent-list.js';
import { listToParagraphCommand } from './list-to-paragraph.js';
import { splitListCommand } from './split-list.js';

export const commands: BlockCommands = {
  convertToNumberedList: convertToNumberedListCommand,
  listToParagraph: listToParagraphCommand,
  splitList: splitListCommand,
  indentList: indentListCommand,
  dedentList: dedentListCommand,
};
