import { BaseTool } from '@blocksuite/block-std/gfx';

export class DefaultTool extends BaseTool {
  static override toolName: string = 'default';
}

declare global {
  namespace BlockSuite {
    interface GfxToolsMap {
      default: DefaultTool;
    }
  }
}
