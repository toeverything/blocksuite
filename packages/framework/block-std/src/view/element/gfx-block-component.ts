import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { Bound } from '@blocksuite/global/utils';
import { nothing } from 'lit';

import type { BlockService } from '../../extension/index.js';
import type { GfxBlockElementModel } from '../../gfx/index.js';

import { GfxControllerIdentifier } from '../../gfx/identifiers.js';
import { BlockComponent } from './block-component.js';

export function isGfxBlockComponent(
  element: unknown
): element is GfxBlockComponent {
  return (element as GfxBlockComponent)?.[GfxElementSymbol] === true;
}

export const GfxElementSymbol = Symbol('GfxElement');

function updateTransform(element: GfxBlockComponent) {
  element.style.transformOrigin = '0 0';
  element.style.transform = element.getCSSTransform();
}

function handleGfxConnection(instance: GfxBlockComponent) {
  instance.style.position = 'absolute';

  instance.disposables.add(
    instance.gfx.viewport.viewportUpdated.on(() => {
      updateTransform(instance);
    })
  );

  instance.disposables.add(
    instance.doc.slots.blockUpdated.on(({ type, id }) => {
      if (id === instance.model.id && type === 'update') {
        updateTransform(instance);
      }
    })
  );

  updateTransform(instance);
}

interface BlockRect {
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: string;
}

function updateBlockRect(
  element: HTMLElement,
  rect: BlockRect,
  cachedRect: BlockRect
) {
  const { x, y, w, h, zIndex } = rect;

  if (x !== cachedRect.x) {
    element.style.left = `${x}px`;
    cachedRect.x = x;
  }
  if (y !== cachedRect.y) {
    element.style.top = `${y}px`;
    cachedRect.y = y;
  }
  if (w !== cachedRect.w) {
    element.style.width = `${w}px`;
    cachedRect.w = w;
  }
  if (h !== cachedRect.h) {
    element.style.height = `${h}px`;
    cachedRect.h = h;
  }
  if (zIndex !== cachedRect.zIndex) {
    element.style.zIndex = zIndex;
    cachedRect.zIndex = zIndex;
  }
}

function createBlockRect(): BlockRect {
  return {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    zIndex: '0',
  };
}

export abstract class GfxBlockComponent<
  Model extends GfxBlockElementModel = GfxBlockElementModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockComponent<Model, Service, WidgetName> {
  cachedRect = createBlockRect();

  [GfxElementSymbol] = true;

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    handleGfxConnection(this);
  }

  getBlockRect(): BlockRect {
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

  getCSSTransform() {
    const viewport = this.gfx.viewport;
    const { translateX, translateY, zoom } = viewport;
    const bound = Bound.deserialize(this.model.xywh);

    const scaledX = bound.x * zoom;
    const scaledY = bound.y * zoom;
    const deltaX = scaledX - bound.x;
    const deltaY = scaledY - bound.y;

    return `translate3d(${translateX + deltaX}px, ${translateY + deltaY}px, 0) scale3d(${zoom}, ${zoom}, 1)`;
  }

  override renderBlock() {
    const rect = this.getBlockRect();
    updateBlockRect(this, rect, this.cachedRect);
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
    cachedRect = createBlockRect();

    [GfxElementSymbol] = true;

    get gfx() {
      return this.std.get(GfxControllerIdentifier);
    }

    override connectedCallback(): void {
      super.connectedCallback();
      handleGfxConnection(this);
    }

    getBlockRect(): {
      x: number;
      y: number;
      w: number;
      h: number;
      zIndex: string;
    } {
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

    getCSSTransform() {
      const viewport = this.gfx.viewport;
      const { translateX, translateY, zoom } = viewport;
      const bound = Bound.deserialize(this.model.xywh);

      const scaledX = bound.x * zoom;
      const scaledY = bound.y * zoom;
      const deltaX = scaledX - bound.x;
      const deltaY = scaledY - bound.y;

      return `translate(${translateX + deltaX}px, ${translateY + deltaY}px) scale(${zoom})`;
    }

    override renderBlock() {
      const rect = this.getBlockRect();
      updateBlockRect(this, rect, this.cachedRect);
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
