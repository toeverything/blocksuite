import { BaseTool } from '@blocksuite/block-std/gfx';

export class TemplateTool extends BaseTool {
  static override toolName: string = 'template';
}

declare global {
  namespace BlockSuite {
    interface GfxToolsMap {
      template: TemplateTool;
    }
  }
}
