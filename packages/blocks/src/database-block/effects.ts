import type { DatabaseBlockModel } from '@blocksuite/affine-model';

import type { insertDatabaseBlockCommand } from './commands.js';

export function effects() {
  // TODO(@L-Sun): move other effects to this file
}

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:database': DatabaseBlockModel;
    }

    interface CommandContext {
      insertedDatabaseBlockId?: string;
    }

    interface Commands {
      /**
       * insert a database block after or before the current block selection
       * @param latex the LaTeX content. A input dialog will be shown if not provided
       * @param removeEmptyLine remove the current block if it is empty
       * @param place where to insert the LaTeX block
       * @returns the id of the inserted LaTeX block
       */
      insertDatabaseBlock: typeof insertDatabaseBlockCommand;
    }
  }
}
