import type { IndentContext } from '@blocksuite/affine-shared/types';

import type { convertToNumberedListCommand } from './commands/convert-to-numbered-list.js';
import type {
  canDedentListCommand,
  dedentListCommand,
} from './commands/dedent-list.js';
import type {
  canIndentListCommand,
  indentListCommand,
} from './commands/indent-list.js';
import type { listToParagraphCommand } from './commands/list-to-paragraph.js';
import type { splitListCommand } from './commands/split-list.js';
import type { ListBlockService } from './list-service.js';

import { ListBlockComponent } from './list-block.js';

export function effects() {
  customElements.define('affine-list', ListBlockComponent);
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:list': ListBlockService;
    }

    interface CommandContext {
      listConvertedId?: string;
      indentContext?: IndentContext;
    }

    interface Commands {
      convertToNumberedList: typeof convertToNumberedListCommand;
      canDedentList: typeof canDedentListCommand;
      canIndentList: typeof canIndentListCommand;
      dedentList: typeof dedentListCommand;
      indentList: typeof indentListCommand;
      listToParagraph: typeof listToParagraphCommand;
      splitList: typeof splitListCommand;
    }
  }

  interface HTMLElementTagNameMap {
    'affine-list': ListBlockComponent;
  }
}
