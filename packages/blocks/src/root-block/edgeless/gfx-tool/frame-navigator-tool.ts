import { BaseTool } from '@blocksuite/block-std/gfx';

import type { NavigatorMode } from '../../../_common/edgeless/frame/consts.js';

type PresentToolOption = {
  mode?: NavigatorMode;
};

export class PresentTool extends BaseTool<PresentToolOption> {
  static override toolName: string = 'frameNavigator';
}

declare global {
  namespace BlockSuite {
    interface GfxToolsMap {
      frameNavigator: PresentTool;
    }

    interface GfxToolsOption {
      frameNavigator: PresentToolOption;
    }
  }
}
