import type { BlockStdScope } from '../scope/block-std-scope.js';
import type { SurfaceMiddleware } from './surface/surface-model.js';

import { LifeCycleWatcher } from '../extension/lifecycle-watcher.js';
import { onSurfaceAdded } from '../utils/gfx.js';

export type SurfaceMiddlewareBuilder = (
  std: BlockStdScope
) => SurfaceMiddleware;

export function SurfaceMiddlewareExtension(
  middlewares: SurfaceMiddlewareBuilder[]
) {
  return class extends LifeCycleWatcher {
    static override key: string = 'surfaceMiddleware';

    override mounted(): void {
      onSurfaceAdded(this.std.doc, surface => {
        if (surface) {
          surface.applyMiddlewares(
            middlewares.map(builder => builder(this.std))
          );
        }
      });
    }
  };
}
