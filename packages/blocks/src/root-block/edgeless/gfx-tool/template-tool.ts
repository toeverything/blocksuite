import { BaseTool } from '@blocksuite/block-std/gfx';

export class TemplateTool extends BaseTool {
  static override toolName: string = 'template';
}

declare module '@blocksuite/block-std/gfx' {
  interface GfxToolsMap {
    template: TemplateTool;
  }
}
