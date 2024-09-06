import type { BlockCommands } from '@blocksuite/block-std';

import { getTextSelectionCommand } from '@blocksuite/affine-shared/commands';

import { deleteTextCommand } from './delete-text.js';
export { textFormatConfigs } from './config.js';
import { formatBlockCommand } from './format-block.js';
export {
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
} from './consts.js';
import { formatNativeCommand } from './format-native.js';
import { formatTextCommand } from './format-text.js';
import {
  getTextStyle,
  isTextStyleActive,
  toggleBold,
  toggleCode,
  toggleItalic,
  toggleLink,
  toggleStrike,
  toggleUnderline,
} from './text-style.js';
export { clearMarksOnDiscontinuousInput, isFormatSupported } from './utils.js';

export const textCommands: BlockCommands = {
  deleteText: deleteTextCommand,
  formatBlock: formatBlockCommand,
  formatNative: formatNativeCommand,
  formatText: formatTextCommand,
  toggleBold: toggleBold,
  toggleItalic: toggleItalic,
  toggleUnderline: toggleUnderline,
  toggleStrike: toggleStrike,
  toggleCode: toggleCode,
  toggleLink: toggleLink,
  isTextStyleActive: isTextStyleActive,
  getTextStyle: getTextStyle,
  getTextSelection: getTextSelectionCommand,
};
