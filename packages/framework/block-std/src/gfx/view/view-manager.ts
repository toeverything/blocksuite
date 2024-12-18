import { DisposableGroup } from '@blocksuite/global/utils';

import type { GfxController } from '../controller.js';
import type { GfxModel } from '../model/model.js';
import type { GfxLocalElementModel } from '../model/surface/local-element-model.js';
import type { SurfaceBlockModel } from '../model/surface/surface-model.js';

import { onSurfaceAdded } from '../../utils/gfx.js';
import { GfxExtension, GfxExtensionIdentifier } from '../extension.js';
import { GfxBlockElementModel } from '../model/gfx-block-model.js';
import {
  GfxElementModelView,
  GfxElementModelViewExtIdentifier,
} from './view.js';

export class ViewManager extends GfxExtension {
  static override key = 'viewManager';

  private _disposable = new DisposableGroup();

  private _viewCtorMap = new Map<string, typeof GfxElementModelView>();

  private _viewMap = new Map<string, GfxElementModelView>();

  constructor(gfx: GfxController) {
    super(gfx);
  }

  static override extendGfx(gfx: GfxController): void {
    Object.defineProperty(gfx, 'view', {
      get() {
        return this.std.get(GfxExtensionIdentifier('viewManager'));
      },
    });
  }

  get(model: GfxModel | GfxLocalElementModel | string) {
    if (typeof model === 'string') {
      if (this._viewMap.has(model)) {
        return this._viewMap.get(model);
      }

      return this.std.view.getBlock(model) ?? null;
    } else {
      if (model instanceof GfxBlockElementModel) {
        return this.std.view.getBlock(model.id) ?? null;
      } else {
        return this._viewMap.get(model.id) ?? null;
      }
    }
  }

  override mounted(): void {
    this.std.provider
      .getAll(GfxElementModelViewExtIdentifier)
      .forEach(viewCtor => {
        this._viewCtorMap.set(viewCtor.type, viewCtor);
      });

    const updateViewOnElementChange = (surface: SurfaceBlockModel) => {
      this._disposable.add(
        surface.elementAdded.on(payload => {
          const model = surface.getElementById(payload.id)!;
          const View = this._viewCtorMap.get(model.type) ?? GfxElementModelView;

          this._viewMap.set(model.id, new View(model, this.gfx));
        })
      );

      this._disposable.add(
        surface.elementRemoved.on(elem => {
          const view = this._viewMap.get(elem.id);
          this._viewMap.delete(elem.id);
          view?.onDestroyed();
        })
      );

      this._disposable.add(
        surface.localElementAdded.on(model => {
          const View = this._viewCtorMap.get(model.type) ?? GfxElementModelView;

          this._viewMap.set(model.id, new View(model, this.gfx));
        })
      );

      this._disposable.add(
        surface.localElementDeleted.on(model => {
          const view = this._viewMap.get(model.id);
          this._viewMap.delete(model.id);
          view?.onDestroyed();
        })
      );

      surface.localElementModels.forEach(model => {
        const View = this._viewCtorMap.get(model.type) ?? GfxElementModelView;

        this._viewMap.set(model.id, new View(model, this.gfx));
      });

      surface.elementModels.forEach(model => {
        const View = this._viewCtorMap.get(model.type) ?? GfxElementModelView;

        this._viewMap.set(model.id, new View(model, this.gfx));
      });
    };

    if (this.gfx.surface) {
      updateViewOnElementChange(this.gfx.surface);
    } else {
      this._disposable.add(
        onSurfaceAdded(this.std.doc, surface => {
          if (surface) {
            updateViewOnElementChange(surface);
          }
        })
      );
    }
  }

  override unmounted(): void {
    this._disposable.dispose();
    this._viewMap.forEach(view => view.onDestroyed());
    this._viewMap.clear();
  }
}

declare module '../controller.js' {
  interface GfxController {
    readonly view: ViewManager;
  }
}
