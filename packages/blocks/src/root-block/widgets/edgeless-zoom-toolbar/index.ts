import './zoom-toolbar.js';
import './zoom-bar-toggle-button.js';

import { WidgetElement } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { RootBlockModel } from '../../root-model.js';

export const AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET =
  'affine-edgeless-zoom-toolbar-widget';

@customElement(AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET)
export class AffineEdgelessZoomToolbarWidget extends WidgetElement<
  RootBlockModel,
  EdgelessRootBlockComponent
> {
  static override styles = css`
    :host {
      position: absolute;
      bottom: 20px;
      left: 12px;
      z-index: var(--affine-z-index-popover);
      display: flex;
      justify-content: center;
      user-select: none;
    }

    @container viewport (width <= 1200px) {
      edgeless-zoom-toolbar {
        display: none;
      }
    }

    @container viewport (width > 1200px) {
      zoom-bar-toggle-button {
        display: none;
      }
    }
  `;

  @state()
  private _hide = false;

  get edgeless() {
    return this.blockElement;
  }

  override firstUpdated() {
    const {
      disposables,
      edgeless: { slots },
    } = this;
    disposables.add(
      slots.edgelessToolUpdated.on(tool => {
        if (tool.type !== 'frameNavigator') {
          this._hide = false;
        }
        this.requestUpdate();
      })
    );
    disposables.add(
      slots.navigatorSettingUpdated.on(({ hideToolbar }) => {
        if (hideToolbar !== undefined) {
          this._hide = hideToolbar;
        }
      })
    );
  }

  override render() {
    if (this._hide || !this.edgeless) {
      return nothing;
    }

    return html`
      <edgeless-zoom-toolbar .edgeless=${this.edgeless}></edgeless-zoom-toolbar>
      <zoom-bar-toggle-button
        .edgeless=${this.edgeless}
      ></zoom-bar-toggle-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET]: AffineEdgelessZoomToolbarWidget;
  }
}
