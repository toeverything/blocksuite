import type { BlockCommands } from '@blocksuite/block-std';

import { getTextSelectionCommand } from '@blocksuite/affine-shared/commands';

import { deleteTextCommand } from './delete-text.js';
export { textFormatConfigs } from './config.js';
export type { TextFormatConfig } from './config.js';
import { formatBlockCommand } from './format-block.js';
export {
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
} from './consts.js';
import { formatNativeCommand } from './format-native.js';
import { formatTextCommand } from './format-text.js';
import { insertInlineLatex } from './insert-inline-latex.js';
import {
  getTextStyle,
  isTextStyleActive,
  toggleBold,
  toggleCode,
  toggleItalic,
  toggleLink,
  toggleStrike,
  toggleTextStyleCommand,
  toggleUnderline,
} from './text-style.js';
export {
  clearMarksOnDiscontinuousInput,
  insertContent,
  isFormatSupported,
} from './utils.js';

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
  toggleTextStyle: toggleTextStyleCommand,
  isTextStyleActive: isTextStyleActive,
  getTextStyle: getTextStyle,
  getTextSelection: getTextSelectionCommand,
  insertInlineLatex: insertInlineLatex,
};
