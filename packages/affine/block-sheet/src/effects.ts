import type { SheetBlockService } from './sheet-service.js';

import { SheetBlockComponent } from './sheet-block.js';

export function effects() {
  customElements.define('affine-sheet', SheetBlockComponent);
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:sheet': SheetBlockService;
    }

    // interface CommandContext {
    //   listConvertedId?: string;
    //   indentContext?: IndentContext;
    // }

    interface Commands {
      //   convertToNumberedList: typeof convertToNumberedListCommand;
      //   canDedentList: typeof canDedentListCommand;
      //   canIndentList: typeof canIndentListCommand;
      //   dedentList: typeof dedentListCommand;
      //   indentList: typeof indentListCommand;
      //   listToParagraph: typeof listToParagraphCommand;
      //   splitList: typeof splitListCommand;
    }
  }

  interface HTMLElementTagNameMap {
    'affine-sheet': SheetBlockComponent;
  }
}
