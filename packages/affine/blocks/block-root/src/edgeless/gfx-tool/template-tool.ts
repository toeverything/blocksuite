import { BaseTool } from '@blocksuite/std/gfx';

export class TemplateTool extends BaseTool {
  static override toolName: string = 'template';
}

declare module '@blocksuite/std/gfx' {
  interface GfxToolsMap {
    template: TemplateTool;
  }
}
