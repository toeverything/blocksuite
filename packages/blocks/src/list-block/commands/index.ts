import type { BlockCommands } from '@blocksuite/block-std';

import { convertToNumberedListCommand } from './convert-to-numbered-list.js';
import { indentListCommand } from './indent-list.js';
import { splitListCommand } from './split-list.js';
import { unindentListCommand } from './unindent-list.js';

export const commands: BlockCommands = {
  convertToNumberedList: convertToNumberedListCommand,
  splitList: splitListCommand,
  indentList: indentListCommand,
  unindentList: unindentListCommand,
};
