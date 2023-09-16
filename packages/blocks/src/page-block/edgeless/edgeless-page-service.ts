import { BlockService } from '@blocksuite/block-std';

import { formatBlockCommand } from '../commands/format/format-block.js';
import { formatNativeCommand } from '../commands/format/format-native.js';
import { formatTextCommand } from '../commands/format/format-text.js';
import { getNextBlockCommand } from '../commands/get-next-block.js';
import { getPreviousBlockCommand } from '../commands/get-previous-block.js';
import type { PageBlockModel } from '../page-model.js';

export class EdgelessPageService extends BlockService<PageBlockModel> {
  override mounted() {
    super.mounted();
    this.std.command.add('getNextBlock', getNextBlockCommand);
    this.std.command.add('getPreviousBlock', getPreviousBlockCommand);
    this.std.command.add('formatText', formatTextCommand);
    this.std.command.add('formatBlock', formatBlockCommand);
    this.std.command.add('formatNative', formatNativeCommand);
  }

  override unmounted() {
    super.unmounted();
    this.selectionManager.set([]);
  }
}
