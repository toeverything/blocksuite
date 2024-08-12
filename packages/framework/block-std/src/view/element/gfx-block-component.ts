import type { SerializedXYWH } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { nothing } from 'lit';

import type { BlockService } from '../../service/index.js';

import { BlockComponent } from './block-component.js';

export const GfxElementSymbol = Symbol('GfxElement');

export abstract class GfxBlockComponent<
  GfxRootService extends BlockService = BlockService,
  Model extends BlockModel = BlockModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockComponent<Model, Service, WidgetName> {
  [GfxElementSymbol] = true;

  override connectedCallback(): void {
    super.connectedCallback();

    this.style.position = 'absolute';
  }

  getRenderingRect() {
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
    return `${1}`;
  }

  updateZIndex(): void {
    this.style.zIndex = this.toZIndex();
  }

  get rootService() {
    return this.host.spec.getService(this.rootServiceFlavour) as GfxRootService;
  }

  abstract rootServiceFlavour: string;
}

// @ts-ignore
export function toGfxBlockComponent<
  GfxRootService extends BlockService,
  Model extends BlockModel,
  Service extends BlockService,
  WidgetName extends string,
  B extends typeof BlockComponent<Model, Service, WidgetName>,
>(CustomBlock: B) {
  // @ts-ignore
  return class extends CustomBlock {
    [GfxElementSymbol] = true;

    rootServiceFlavour!: string;

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
      return `${1}`;
    }

    updateZIndex(): void {
      this.style.zIndex = this.toZIndex();
    }

    get rootService() {
      return this.host.spec.getService(
        this.rootServiceFlavour
      ) as GfxRootService;
    }
  } as B & {
    new (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ): GfxBlockComponent<GfxRootService>;
  };
}
