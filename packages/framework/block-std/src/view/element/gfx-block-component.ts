import type { BlockModel } from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { Bound, type SerializedXYWH } from '@blocksuite/global/utils';
import { nothing } from 'lit';

import type { BlockService } from '../../extension/index.js';
import type { GfxBlockElementModel, GfxController } from '../../gfx/index.js';

import { GfxControllerIdentifier } from '../../gfx/index.js';
import { BlockComponent } from './block-component.js';

export function isGfxBlockComponent(
  element: unknown
): element is GfxBlockComponent {
  return (element as GfxBlockComponent)?.[GfxElementSymbol] === true;
}

export const GfxElementSymbol = Symbol('GfxElement');

function toCSSTransform(
  translateX: number,
  translateY: number,
  zoom: number,
  originalX: number = 0,
  originalY: number = 0
) {
  const scaledX = originalX * zoom;
  const scaledY = originalY * zoom;
  const deltaX = scaledX - originalX;
  const deltaY = scaledY - originalY;

  return `translate(${translateX + deltaX}px, ${translateY + deltaY}px) scale(${zoom})`;
}

function updateTransform(
  element: HTMLElement,
  gfx: GfxController,
  model: GfxBlockElementModel
) {
  const viewport = gfx.viewport;
  const { translateX, translateY, zoom } = viewport;
  const bound = Bound.deserialize(model.xywh);

  element.style.transformOrigin = '0 0';
  element.style.transform = toCSSTransform(
    translateX,
    translateY,
    zoom,
    bound.x,
    bound.y
  );
}

function handleGfxConnection(instance: GfxBlockComponent) {
  instance.style.position = 'absolute';

  instance.disposables.add(
    instance.gfx.viewport.viewportUpdated.on(() => {
      updateTransform(instance, instance.gfx, instance.model);
    })
  );

  instance.disposables.add(
    instance.doc.slots.blockUpdated.on(({ type, id }) => {
      if (id === instance.model.id && type === 'update') {
        updateTransform(instance, instance.gfx, instance.model);
      }
    })
  );

  updateTransform(instance, instance.gfx, instance.model);
}

export abstract class GfxBlockComponent<
  Model extends GfxBlockElementModel = GfxBlockElementModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockComponent<Model, Service, WidgetName> {
  [GfxElementSymbol] = true;

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    handleGfxConnection(this);
  }

  getRenderingRect() {
    const { xywh$ } = this.model;

    if (!xywh$) {
      throw new BlockSuiteError(
        ErrorCode.GfxBlockElementError,
        `Error on rendering '${this.model.flavour}': Gfx block's model should have 'xywh' property.`
      );
    }

    const [x, y, w, h] = JSON.parse(xywh$.value);

    return { x, y, w, h, zIndex: this.toZIndex() };
  }

  override renderBlock() {
    const { x, y, w, h, zIndex } = this.getRenderingRect();

    this.style.left = `${x}px`;
    this.style.top = `${y}px`;
    this.style.width = `${w}px`;
    this.style.height = `${h}px`;
    this.style.zIndex = zIndex;

    return this.renderGfxBlock();
  }

  renderGfxBlock(): unknown {
    return nothing;
  }

  renderPageContent(): unknown {
    return nothing;
  }

  override async scheduleUpdate() {
    const parent = this.parentElement;

    if (this.hasUpdated || !parent || !('scheduleUpdateChildren' in parent)) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      super.scheduleUpdate();
    } else {
      await (parent.scheduleUpdateChildren as (id: string) => Promise<void>)(
        this.model.id
      );
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      super.scheduleUpdate();
    }
  }

  toZIndex(): string {
    return this.gfx.layer.getZIndex(this.model).toString() ?? '0';
  }

  updateZIndex(): void {
    this.style.zIndex = this.toZIndex();
  }
}

export function toGfxBlockComponent<
  Model extends GfxBlockElementModel,
  Service extends BlockService,
  WidgetName extends string,
  B extends typeof BlockComponent<Model, Service, WidgetName>,
>(CustomBlock: B) {
  // @ts-ignore
  return class extends CustomBlock {
    [GfxElementSymbol] = true;

    get gfx() {
      return this.std.get(GfxControllerIdentifier);
    }

    override connectedCallback(): void {
      super.connectedCallback();
      handleGfxConnection(this);
    }

    getRenderingRect(): {
      x: number;
      y: number;
      w: number | string;
      h: number | string;
      zIndex: string;
    } {
      const { xywh$ } = this.model as BlockModel<{
        xywh: SerializedXYWH;
        index: string;
      }>;

      if (!xywh$) {
        throw new BlockSuiteError(
          ErrorCode.GfxBlockElementError,
          `Error on rendering '${this.model.flavour}': Gfx block's model should have 'xywh' property.`
        );
      }

      const [x, y, w, h] = JSON.parse(xywh$.value);

      return { x, y, w, h, zIndex: this.toZIndex() };
    }

    override renderBlock() {
      const { x, y, w, h, zIndex } = this.getRenderingRect();

      this.style.left = `${x}px`;
      this.style.top = `${y}px`;
      this.style.width = typeof w === 'number' ? `${w}px` : w;
      this.style.height = typeof h === 'number' ? `${h}px` : h;
      this.style.zIndex = zIndex;

      return this.renderGfxBlock();
    }

    renderGfxBlock(): unknown {
      return this.renderPageContent();
    }

    renderPageContent() {
      return super.renderBlock();
    }

    override async scheduleUpdate() {
      const parent = this.parentElement;

      if (this.hasUpdated || !parent || !('scheduleUpdateChildren' in parent)) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        super.scheduleUpdate();
      } else {
        await (parent.scheduleUpdateChildren as (id: string) => Promise<void>)(
          this.model.id
        );
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        super.scheduleUpdate();
      }
    }

    toZIndex(): string {
      return this.gfx.layer.getZIndex(this.model).toString() ?? '0';
    }

    updateZIndex(): void {
      this.style.zIndex = this.toZIndex();
    }
  } as B & {
    new (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ): GfxBlockComponent;
  };
}
