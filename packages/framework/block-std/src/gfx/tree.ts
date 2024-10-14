import { DisposableGroup } from '@blocksuite/global/utils';

import type { SurfaceBlockModel } from './surface/surface-model.js';

import { GfxBlockElementModel, type GfxModel } from './gfx-block-model.js';
import {
  type GfxContainerElement,
  isGfxContainerElm,
} from './surface/container-element.js';
import { GfxGroupLikeElementModel } from './surface/element-model.js';

export class TreeManager {
  private _elementToContainer = new Map<
    string,
    GfxModel & GfxContainerElement
  >();

  private _watched = false;

  constructor(readonly surface: SurfaceBlockModel) {}

  getContainer(elementId: string): (GfxModel & GfxContainerElement) | null {
    const container = this._elementToContainer.get(elementId);
    return container ?? null;
  }

  /**
   * Watch the container relationship of the elements in the surface.
   * You should call this method only once.
   */
  watch() {
    const disposable = new DisposableGroup();

    if (this._watched) {
      console.warn('TreeManager is already watched');
      return disposable;
    }

    const onGfxModelAdded = (model: GfxModel) => {
      if (!isGfxContainerElm(model)) return;
      model.childElements.forEach(child => {
        const prevContainer = this.getContainer(child.id);
        // eslint-disable-next-line unicorn/prefer-dom-node-remove
        prevContainer?.removeChild(child);

        this._elementToContainer.set(child.id, model);
      });
    };

    const onGfxModelDeleted = (model: GfxModel) => {
      const container = this.getContainer(model.id);
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      container?.removeChild(model);

      if (isGfxContainerElm(model)) {
        model.childElements.forEach(child => {
          if (this._elementToContainer.get(child.id) === model)
            this._elementToContainer.delete(child.id);
        });
      }
      this._elementToContainer.delete(model.id);
    };

    const onGfxContainerUpdated = (model: GfxModel & GfxContainerElement) => {
      if (!isGfxContainerElm(model)) return;

      const previousChildrenIds = new Set<string>();
      this._elementToContainer.forEach((container, elementId) => {
        if (container === model) previousChildrenIds.add(elementId);
      });

      model.childIds.forEach(childId => {
        this._elementToContainer.set(childId, model);
        previousChildrenIds.delete(childId);
      });

      previousChildrenIds.forEach(prevChildId => {
        if (this._elementToContainer.get(prevChildId) === model)
          this._elementToContainer.delete(prevChildId);
      });
    };

    // Graphic Block Elements

    const { doc } = this.surface;
    const elements = doc
      .getBlocks()
      .filter(model => model instanceof GfxBlockElementModel) as GfxModel[];

    elements.forEach(el => {
      if (isGfxContainerElm(el)) {
        // we use `childIds` here because some blocks in doc may not be ready
        el.childIds.forEach(childId => {
          this._elementToContainer.set(childId, el);
        });
      }
    });

    disposable.add(
      doc.slots.blockUpdated.on(payload => {
        if (payload.type === 'add') {
          const { model } = payload;
          if (model instanceof GfxBlockElementModel) {
            onGfxModelAdded(model);
          }
        } else if (payload.type === 'delete') {
          const { model } = payload;
          if (model instanceof GfxBlockElementModel) {
            onGfxModelDeleted(model);
          }
        } else if (payload.type === 'update') {
          const model = doc.getBlock(payload.id)?.model;
          if (!(model instanceof GfxBlockElementModel)) return;
          if (!isGfxContainerElm(model)) return;

          // Since the implement of GfxContainer may be different,
          // listen to the change of the children of container based on `blockUpdated` is difficult.
          // TODO(@L-Sun): remove this speed up branch if we can listen the change of children of container
          if (
            payload.flavour === 'affine:frame' &&
            payload.props.key !== 'childElementIds'
          ) {
            return;
          }

          onGfxContainerUpdated(
            model as GfxBlockElementModel & GfxContainerElement
          );
        }
      })
    );

    // Canvas Elements

    this.surface.elementModels.forEach(el => {
      if (isGfxContainerElm(el)) {
        // we use `childIds` here because some blocks in doc may not be ready
        el.childIds.forEach(childId => {
          this._elementToContainer.set(childId, el);
        });
      }
    });

    disposable.add(
      this.surface.elementAdded.on(({ id }) => {
        const element = this.surface.getElementById(id);
        element && onGfxModelAdded(element);
      })
    );

    disposable.add(
      this.surface.elementRemoved.on(({ model }) => {
        onGfxModelDeleted(model);
      })
    );

    disposable.add(
      this.surface.elementUpdated.on(({ id, oldValues }) => {
        const element = this.surface.getElementById(id);
        if (!isGfxContainerElm(element)) return;

        // Since the implement of GfxContainer may be different,
        // listen to the change of the children of container is difficult
        // TODO(@L-Sun): remove this speed up branch if we can listen the change of children of container
        if (
          element instanceof GfxGroupLikeElementModel &&
          !oldValues['childIds']
        )
          return;

        onGfxContainerUpdated(element);
      })
    );

    disposable.add(() => {
      this._watched = false;
      this._elementToContainer.clear();
    });

    this._watched = true;

    return disposable;
  }
}
