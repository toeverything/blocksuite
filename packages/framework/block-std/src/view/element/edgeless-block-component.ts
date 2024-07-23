import type { SerializedXYWH } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { nothing } from 'lit';

import type { BlockService } from '../../service/index.js';

import { BlockComponent } from './block-component.js';

export const edgelessElementSymbol = Symbol('edgelessElement');

export abstract class EdgelessBlockComponent<
  EdgelessRootService extends BlockService = BlockService,
  Model extends BlockModel = BlockModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockComponent<Model, Service, WidgetName> {
  [edgelessElementSymbol] = true;

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
        ErrorCode.EdgelessBlockError,
        'Edgeless block should have at least `xywh` property.'
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

    return this.renderEdgelessBlock();
  }

  renderEdgelessBlock(): unknown {
    return nothing;
  }

  renderPageContent(): unknown {
    return nothing;
  }

  toZIndex(): string {
    return `${1}`;
  }

  get rootService() {
    return this.host.spec.getService(
      this.rootServiceFlavour
    ) as EdgelessRootService;
  }

  abstract rootServiceFlavour: string;
}

// @ts-ignore
export function toEdgelessBlockComponent<
  EdgelessRootService extends BlockService,
  Model extends BlockModel,
  Service extends BlockService,
  WidgetName extends string,
  B extends typeof BlockComponent<Model, Service, WidgetName>,
>(CustomBlock: B) {
  // @ts-ignore
  return class extends CustomBlock {
    [edgelessElementSymbol] = true;

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
          ErrorCode.EdgelessBlockError,
          'Edgeless block should have at least `xywh` property.'
        );
      }

      const [x, y, w, h] = JSON.parse(xywh$.value);

      return { x, y, w, h, zIndex: this.toZIndex() };
    }

    override renderBlock() {
      const { xywh, index } = this.model as BlockModel<{
        xywh: SerializedXYWH;
        index: string;
      }>;

      if (!xywh || !index) {
        throw new BlockSuiteError(
          ErrorCode.EdgelessBlockError,
          'Edgeless block should have at least `xywh` and `index` properties.'
        );
      }

      const { x, y, w, h, zIndex } = this.getRenderingRect();

      this.style.left = `${x}px`;
      this.style.top = `${y}px`;
      this.style.width = typeof w === 'number' ? `${w}px` : w;
      this.style.height = typeof h === 'number' ? `${h}px` : h;
      this.style.zIndex = zIndex;

      return this.renderEdgelessBlock();
    }

    renderEdgelessBlock(): unknown {
      return this.renderPageContent();
    }

    renderPageContent() {
      return super.renderBlock();
    }

    toZIndex(): string {
      return `${1}`;
    }

    get rootService() {
      return this.host.spec.getService(
        this.rootServiceFlavour
      ) as EdgelessRootService;
    }
  } as B & {
    new (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ): EdgelessBlockComponent<EdgelessRootService>;
  };
}
