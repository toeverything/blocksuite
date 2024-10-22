import { BaseTool } from '@blocksuite/block-std/gfx';

/**
 * Empty tool that does nothing.
 */
export class EmptyTool extends BaseTool {
  static override toolName: string = 'empty';
}

declare module '@blocksuite/block-std/gfx' {
  interface GfxToolsMap {
    empty: EmptyTool;
  }
}
