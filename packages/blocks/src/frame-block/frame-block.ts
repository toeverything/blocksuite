import type { FrameBlockModel } from '@blocksuite/affine-model';

import { ThemeProvider } from '@blocksuite/affine-shared/services';
import { GfxBlockComponent } from '@blocksuite/block-std';
import { Bound } from '@blocksuite/global/utils';
import { cssVarV2 } from '@toeverything/theme/v2';
import { html } from 'lit';
import { state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../root-block/index.js';

export class FrameBlockComponent extends GfxBlockComponent<FrameBlockModel> {
  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._disposables.add(
      this.doc.slots.blockUpdated.on(({ type, id }) => {
        if (id === this.model.id && type === 'update') {
          this.requestUpdate();
        }
      })
    );
    this._disposables.add(
      this.gfx.viewport.viewportUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  /**
   * Due to potentially very large frame sizes, CSS scaling can cause iOS Safari to crash.
   * To mitigate this issue, we combine size calculations within the rendering rect.
   */
  override getCSSTransform(): string {
    return '';
  }

  override getRenderingRect() {
    const viewport = this.gfx.viewport;
    const { translateX, translateY, zoom } = viewport;
    const { xywh, rotate } = this.model;
    const bound = Bound.deserialize(xywh);

    const scaledX = bound.x * zoom + translateX;
    const scaledY = bound.y * zoom + translateY;

    return {
      x: scaledX,
      y: scaledY,
      w: bound.w * zoom,
      h: bound.h * zoom,
      rotate,
      zIndex: this.toZIndex(),
    };
  }

  override renderGfxBlock() {
    const { model, showBorder, rootService, std } = this;
    const backgroundColor = std
      .get(ThemeProvider)
      .generateColorProperty(model.background, '--affine-platte-transparent');
    const _isNavigator =
      this.gfx.tool.currentToolName$.value === 'frameNavigator';
    const frameIndex = rootService.layer.getZIndex(model);

    return html`
      <edgeless-frame-title
        style=${styleMap({
          zIndex: 2147483647 - -frameIndex,
        })}
      ></edgeless-frame-title>
      <div
        class="affine-frame-container"
        style=${styleMap({
          zIndex: `${frameIndex}`,
          backgroundColor,
          height: '100%',
          width: '100%',
          borderRadius: '2px',
          border:
            _isNavigator || !showBorder
              ? 'none'
              : `1px solid ${cssVarV2('edgeless/frame/border/default')}`,
        })}
      ></div>
    `;
  }

  @state()
  accessor showBorder = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-frame': FrameBlockComponent;
  }
}
