import { BaseTool } from '@blocksuite/block-std/gfx';

/**
 * Empty tool that does nothing.
 */
export class EmptyTool extends BaseTool {
  static override toolName: string = 'empty';
}

declare global {
  namespace BlockSuite {
    interface GfxToolsMap {
      empty: EmptyTool;
    }
  }
}
