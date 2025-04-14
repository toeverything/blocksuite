import { BaseTool } from '@blocksuite/std/gfx';

/**
 * Empty tool that does nothing.
 */
export class EmptyTool extends BaseTool {
  static override toolName: string = 'empty';
}

declare module '@blocksuite/std/gfx' {
  interface GfxToolsMap {
    empty: EmptyTool;
  }
}
