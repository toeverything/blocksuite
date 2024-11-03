import type { insertLatexBlockCommand } from './commands.js';

export function effects() {
  // TODO(@L-Sun): move other effects to this file
}

declare global {
  namespace BlockSuite {
    interface CommandContext {
      insertedLatexBlockId?: Promise<string>;
    }

    interface Commands {
      /**
       * insert a LaTeX block after or before the current block selection
       * @param latex the LaTeX content. A input dialog will be shown if not provided
       * @param place where to insert the LaTeX block
       * @param removeEmptyLine remove the current block if it is empty
       * @returns the id of the inserted LaTeX block
       */
      insertLatexBlock: typeof insertLatexBlockCommand;
    }
  }
}
