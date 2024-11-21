import type { FrameBlockModel } from '@blocksuite/affine-model';

import { ThemeProvider } from '@blocksuite/affine-shared/services';
import { GfxBlockComponent } from '@blocksuite/block-std';
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
