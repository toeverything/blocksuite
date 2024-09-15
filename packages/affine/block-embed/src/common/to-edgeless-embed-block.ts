import type { GfxCompatibleProps } from '@blocksuite/affine-model';
import type { GfxBlockElementModel } from '@blocksuite/block-std/gfx';
import type { StyleInfo } from 'lit/directives/style-map.js';

import {
  blockComponentSymbol,
  type BlockService,
  type GfxBlockComponent,
  GfxElementSymbol,
  toGfxBlockComponent,
} from '@blocksuite/block-std';
import { Bound } from '@blocksuite/global/utils';

import type { EmbedBlockComponent } from './embed-block-element.js';

export function toEdgelessEmbedBlock<
  Model extends GfxBlockElementModel<GfxCompatibleProps>,
  Service extends BlockService,
  WidgetName extends string,
  B extends typeof EmbedBlockComponent<Model, Service, WidgetName>,
>(block: B) {
  return class extends toGfxBlockComponent(block) {
    _isDragging = false;

    _isResizing = false;

    _isSelected = false;

    _showOverlay = false;

    override [blockComponentSymbol] = true;

    protected override embedContainerStyle: StyleInfo = {};

    override [GfxElementSymbol] = true;

    get bound(): Bound {
      return Bound.deserialize(this.model.xywh);
    }

    get rootService() {
      return this.std.getService('affine:page');
    }

    _handleClick(_: MouseEvent): void {
      return;
    }

    override connectedCallback(): void {
      super.connectedCallback();
      const rootService = this.rootService;

      this._disposables.add(
        // @ts-expect-error TODO: fix after edgeless slots are migrated to extension
        rootService.slots.elementResizeStart.on(() => {
          this._isResizing = true;
          this._showOverlay = true;
        })
      );

      this._disposables.add(
        // @ts-expect-error TODO: fix after edgeless slots are migrated to extension
        rootService.slots.elementResizeEnd.on(() => {
          this._isResizing = false;
          this._showOverlay =
            this._isResizing || this._isDragging || !this._isSelected;
        })
      );
    }

    override renderGfxBlock() {
      const bound = Bound.deserialize(this.model.xywh);

      this.embedContainerStyle.width = `${bound.w}px`;
      this.embedContainerStyle.height = `${bound.h}px`;
      this.blockContainerStyles = {
        width: `${bound.w}px`,
      };
      this._scale = bound.w / this._cardWidth;

      return this.renderPageContent();
    }

    protected override accessor blockContainerStyles: StyleInfo | undefined =
      undefined;
  } as B & {
    new (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ): GfxBlockComponent;
  };
}
