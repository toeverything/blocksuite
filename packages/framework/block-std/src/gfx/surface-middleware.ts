import { type Container, createIdentifier } from '@blocksuite/global/di';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { BlockStdScope } from '../scope/block-std-scope.js';
import type { SurfaceMiddleware } from './model/surface/surface-model.js';

import { Extension } from '../extension/extension.js';
import { LifeCycleWatcher } from '../extension/lifecycle-watcher.js';
import { StdIdentifier } from '../identifier.js';
import { onSurfaceAdded } from '../utils/gfx.js';
import { GfxControllerIdentifier } from './identifiers.js';

export abstract class SurfaceMiddlewareBuilder extends Extension {
  static key: string = '';

  abstract middleware: SurfaceMiddleware;

  get gfx() {
    return this.std.provider.get(GfxControllerIdentifier);
  }

  constructor(protected std: BlockStdScope) {
    super();
  }

  static override setup(di: Container) {
    if (!this.key) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        'The surface middleware builder should have a static key property.'
      );
    }

    di.addImpl(SurfaceMiddlewareBuilderIdentifier(this.key), this, [
      StdIdentifier,
    ]);
  }

  mounted(): void {}

  unmounted(): void {}
}

export const SurfaceMiddlewareBuilderIdentifier =
  createIdentifier<SurfaceMiddlewareBuilder>('SurfaceMiddlewareBuilder');

export class SurfaceMiddlewareExtension extends LifeCycleWatcher {
  static override key: string = 'surfaceMiddleware';

  override mounted(): void {
    const builders = Array.from(
      this.std.provider.getAll(SurfaceMiddlewareBuilderIdentifier).values()
    );

    const dispose = onSurfaceAdded(this.std.doc, surface => {
      if (surface) {
        surface.applyMiddlewares(builders.map(builder => builder.middleware));
        queueMicrotask(() => dispose());
      }
    });
  }
}
