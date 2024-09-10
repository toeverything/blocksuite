import type { SerializedXYWH } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { nothing } from 'lit';

import type { BlockService } from '../../extension/index.js';
import type { GfxBlockElementModel } from '../../gfx/index.js';

import { GfxControllerIdentifier } from '../../gfx/index.js';
import { BlockComponent } from './block-component.js';

export function isGfxBlockComponent(
  element: unknown
): element is GfxBlockComponent {
  return (element as GfxBlockComponent)?.[GfxElementSymbol] === true;
}

export const GfxElementSymbol = Symbol('GfxElement');

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

    this.style.position = 'absolute';
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

      this.style.position = 'absolute';
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
