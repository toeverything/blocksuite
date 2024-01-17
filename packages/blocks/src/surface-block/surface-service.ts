import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { NavigatorMode } from '../_common/edgeless/frame/consts.js';
import { buildPath } from '../_common/utils/query.js';
import { TemplateJob } from './service/template.js';
import type { SurfaceBlockComponent } from './surface-block.js';
import type { SurfaceBlockModel } from './surface-model.js';

export class SurfaceService extends BlockService<SurfaceBlockModel> {
  TemplateJob = TemplateJob;

  override mounted(): void {
    super.mounted();
    const surface = this.page.getBlockByFlavour('affine:surface')[0];

    assertExists(surface, 'surface block not found');
  }

  private get _surfaceView() {
    const [surface] = this.page.getBlockByFlavour('affine:surface');
    const view = this.std.view.viewFromPath(
      'block',
      buildPath(surface)
    ) as SurfaceBlockComponent;
    return view;
  }

  get currentTool() {
    const view = this._surfaceView;
    if (!view) return null;

    const { edgeless } = view;
    return edgeless.edgelessTool;
  }

  setNavigatorMode(on: boolean, mode?: NavigatorMode) {
    const view = this._surfaceView;
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
