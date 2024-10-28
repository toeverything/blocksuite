import type { insertSurfaceRefBlockCommand } from './commands.js';

export function effects() {
  // TODO(@L-Sun): move other effects to this file
}

declare global {
  namespace BlockSuite {
    interface CommandContext {
      insertedSurfaceRefBlockId?: string;
    }

    interface Commands {
      /**
       * insert a SurfaceRef block after or before the current block selection
       * @param reference the reference block id. The block should be group or frame
       * @param place where to insert the LaTeX block
       * @param removeEmptyLine remove the current block if it is empty
       * @returns the id of the inserted SurfaceRef block
       */
      insertSurfaceRefBlock: typeof insertSurfaceRefBlockCommand;
    }
  }
}
