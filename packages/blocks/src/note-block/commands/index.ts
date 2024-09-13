import type { BlockCommands } from '@blocksuite/block-std';

import {
  getBlockIndexCommand,
  getBlockSelectionsCommand,
  getNextBlockCommand,
  getPrevBlockCommand,
  getSelectedBlocksCommand,
} from '@blocksuite/affine-shared/commands';

import { updateBlockType } from './block-type.js';
import { dedentBlock } from './dedent-block.js';
import { dedentBlockToRoot } from './dedent-block-to-root.js';
import { dedentBlocksToRoot } from './dedent-blocks-to-root.js';
import { dedentBlocks } from './dendent-blocks.js';
import { focusBlockEnd } from './focus-block-end.js';
import { focusBlockStart } from './focus-block-start.js';
import { indentBlock } from './indent-block.js';
import { indentBlocks } from './indent-blocks.js';
import { selectBlock } from './select-block.js';
import { selectBlocksBetween } from './select-blocks-between.js';

export const commands: BlockCommands = {
  // block
  getBlockIndex: getBlockIndexCommand,
  getPrevBlock: getPrevBlockCommand,
  getNextBlock: getNextBlockCommand,
  getSelectedBlocks: getSelectedBlocksCommand,
  getBlockSelections: getBlockSelectionsCommand,
  selectBlock: selectBlock,
  selectBlocksBetween: selectBlocksBetween,
  focusBlockStart: focusBlockStart,
  focusBlockEnd: focusBlockEnd,
  updateBlockType: updateBlockType,
  indentBlock,
  dedentBlock,
  indentBlocks,
  dedentBlocks,
  dedentBlockToRoot,
  dedentBlocksToRoot,
};
