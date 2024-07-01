import type { BlockModel } from '@blocksuite/store';
import { nothing } from 'lit';

import type { SerializedXYWH } from '../../edgeless/types.js';
import type { BlockService } from '../../service/index.js';
import { BlockElement } from './block-element.js';

export const edgelessElementSymbol = Symbol('edgelessElement');

export class EdgelessBlockElement<
  Model extends BlockModel = BlockModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockElement<Model, Service, WidgetName> {
  [edgelessElementSymbol] = true;

  toZIndex(_: string): string {
    return `${1}`;
  }

  override renderBlock() {
    const { xywh, index } = this.model as BlockModel<{
      xywh: SerializedXYWH;
      index: string;
    }>;
    const [x, y, w, h] = JSON.parse(xywh);

    this.style.left = `${x}px`;
    this.style.top = `${y}px`;
    this.style.width = `${w}px`;
    this.style.height = `${h}px`;
    this.style.zIndex = this.toZIndex(index);

    return this.renderEdgelessBlock();
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this.style.position = 'absolute';
  }

  renderPageContent() {
    return nothing;
  }

  renderEdgelessBlock(): unknown {
    return nothing;
  }
}

// @ts-ignore
export function toEdgelessBlockElement<
  Model extends BlockModel,
  Service extends BlockService,
  WidgetName extends string,
  B extends typeof BlockElement<Model, Service, WidgetName>,
>(CustomBlock: B) {
  // @ts-ignore
  return class extends CustomBlock {
    [edgelessElementSymbol] = true;

    toZIndex(_: string): string {
      return `${1}`;
    }

    override renderBlock() {
      const { xywh, index } = this.model as BlockModel<{
        xywh: SerializedXYWH;
        index: string;
      }>;
      const [x, y, w, h] = JSON.parse(xywh);

      this.style.left = `${x}px`;
      this.style.top = `${y}px`;
      this.style.width = `${w}px`;
      this.style.height = `${h}px`;
      this.style.zIndex = this.toZIndex(index);

      return this.renderEdgelessBlock();
    }

    override connectedCallback(): void {
      super.connectedCallback();

      this.style.position = 'absolute';
    }

    renderPageContent() {
      return super.renderBlock();
    }

    renderEdgelessBlock(): unknown {
      return this.renderPageContent();
    }
  } as B & {
    new (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ): EdgelessBlockElement & { renderPageContent(): unknown };
  };
}
