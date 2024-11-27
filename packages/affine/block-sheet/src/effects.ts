import type { initSheetBlockCommand } from './commands/index.js';
import type {
  SheetBlockService,
  SheetCellService,
  SheetRowService,
} from './sheet-service.js';

import { SheetBlockComponent } from './sheet-block.js';
import { SheetCell } from './sheet-cell.js';
import { SheetRow } from './sheet-row.js';

export function effects() {
  customElements.define('affine-sheet', SheetBlockComponent);
  customElements.define('affine-sheet-row', SheetRow);
  customElements.define('affine-sheet-cell', SheetCell);
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:sheet': SheetBlockService;
      'affine:sheet-row': SheetRowService;
      'affine:sheet-cell': SheetCellService;
    }

    interface CommandContext {
      insertedSheetBlockId?: string;
    }

    interface Commands {
      initSheetBlock: typeof initSheetBlockCommand;
    }
  }

  interface HTMLElementTagNameMap {
    'affine-sheet': SheetBlockComponent;
    'affine-sheet-row': SheetRow;
    'affine-sheet-cell': SheetCell;
  }
}
