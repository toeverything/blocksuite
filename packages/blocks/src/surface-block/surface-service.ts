import { BlockService } from '@blocksuite/block-std';

import type { NavigatorMode } from '../_common/edgeless/frame/consts.js';
import { buildPath } from '../_common/utils/query.js';
import type { SurfaceBlockComponent } from './surface-block.js';
import type { SurfaceBlockModel } from './surface-model.js';

export class SurfaceService extends BlockService<SurfaceBlockModel> {
  private _getSurfaceView() {
    const [surface] = this.page.getBlockByFlavour('affine:surface');
    const view = this.std.view.viewFromPath(
      'block',
      buildPath(surface)
    ) as SurfaceBlockComponent;
    return view;
  }

  setNavigatorMode(on: boolean, mode?: NavigatorMode) {
    const view = this._getSurfaceView();
    if (!view) return;

    const { edgeless } = view;
    if (on && edgeless.edgelessTool.type === 'frameNavigator') return;
    if (!on && edgeless.edgelessTool.type !== 'frameNavigator') return;

    if (on) {
      edgeless.tools.setEdgelessTool({ type: 'frameNavigator', mode });
    } else {
      edgeless.tools.setEdgelessTool({ type: 'default' });
    }
  }
}
