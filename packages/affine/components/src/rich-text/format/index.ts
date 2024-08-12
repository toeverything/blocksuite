import type { AffineTextAttributes } from '../inline/index.js';

import { deleteTextCommand } from './delete-text.js';
import { formatBlockCommand } from './format-block.js';
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

export const registerTextStyleCommands = (std: BlockSuite.Std) => {
  std.command
    .add('toggleBold', toggleBold)
    .add('toggleItalic', toggleItalic)
    .add('toggleUnderline', toggleUnderline)
    .add('toggleStrike', toggleStrike)
    .add('toggleCode', toggleCode)
    .add('toggleLink', toggleLink)
    .add('getTextStyle', getTextStyle)
    .add('isTextStyleActive', isTextStyleActive)
    .add('formatText', formatTextCommand)
    .add('formatBlock', formatBlockCommand)
    .add('formatNative', formatNativeCommand)
    .add('deleteText', deleteTextCommand);
};

export { textFormatConfigs } from './config.js';

export {
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
} from './consts.js';
export { isFormatSupported } from './utils.js';

declare global {
  namespace BlockSuite {
    interface CommandContext {
      textStyle?: AffineTextAttributes;
    }
    interface Commands {
      deleteText: typeof deleteTextCommand;
      formatBlock: typeof formatBlockCommand;
      formatNative: typeof formatNativeCommand;
      formatText: typeof formatTextCommand;
      toggleBold: typeof toggleBold;
      toggleItalic: typeof toggleItalic;
      toggleUnderline: typeof toggleUnderline;
      toggleStrike: typeof toggleStrike;
      toggleCode: typeof toggleCode;
      toggleLink: typeof toggleLink;
      getTextStyle: typeof getTextStyle;
      isTextStyleActive: typeof isTextStyleActive;
    }
  }
}
