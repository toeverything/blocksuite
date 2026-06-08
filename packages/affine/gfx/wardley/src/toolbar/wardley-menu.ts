import { DefaultTool } from '@blocksuite/affine-block-surface';
import { EmptyTool } from '@blocksuite/affine-gfx-pointer';
import { EdgelessToolbarToolMixin } from '@blocksuite/affine-widget-edgeless-toolbar';
import { Bound } from '@blocksuite/global/gfx';
import { css, html, LitElement } from 'lit';

import { REF_WIDTH } from '../consts';
import { wardleyBackgroundIcon } from './icons';

/**
 * The "Others"-style popover that opens above the toolbar for the Wardley
 * toolbox. Its first item creates a Wardley map background. New specialties can
 * be added as further buttons here.
 */
export class EdgelessWardleyMenu extends EdgelessToolbarToolMixin(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      display: flex;
      z-index: -1;
    }
    .menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .button-group-container {
      display: flex;
      align-items: center;
      gap: 14px;
      fill: var(--affine-icon-color);
    }
    .button-group-container svg {
      width: 24px;
      height: 24px;
    }
  `;

  override type = EmptyTool;

  private _createBackground() {
    const { gfx } = this;
    if (!gfx.surface) return;

    // Size = the largest existing Wardley background, kept 16:9.
    let width = REF_WIDTH;
    for (const el of gfx.surface.getElementsByType('wardley')) {
      const [, , ew, eh] = el.deserializedXYWH;
      width = Math.max(width, ew, (eh * 16) / 9);
    }
    const height = (width * 9) / 16;

    const { centerX, centerY } = gfx.viewport;
    const id = gfx.surface.addElement({
      type: 'wardley',
      xywh: new Bound(
        centerX - width / 2,
        centerY - height / 2,
        width,
        height
      ).serialize(),
    });
    gfx.doc.captureSync();
    gfx.tool.setTool(DefaultTool);
    gfx.selection.set({ elements: [id], editing: false });

    this.toolbar?.activePopper?.dispose();
  }

  override render() {
    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <div class="button-group-container">
            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .tooltip=${'Fond de carte Wardley'}
              @click=${this._createBackground}
            >
              ${wardleyBackgroundIcon}
            </edgeless-tool-icon-button>
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }
}
