import { Bound } from '@blocksuite/phasor/index.js';
import type { SurfaceManager } from '@blocksuite/phasor/surface.js';

import type { onEdgelessElement } from '../../__internal__/utils/types.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';

export class EdgelessSnapManager {
  constructor(
    public container: EdgelessPageBlockComponent,
    public surface: SurfaceManager
  ) {}

  public prepareAlign(elements: onEdgelessElement[]): Bound {
    return new Bound();
  }

  public align(bound: Bound): { dx: number; dy: number } {
    return { dx: 0, dy: 0 };
  }

  public reset(): void {
    1;
  }
}
