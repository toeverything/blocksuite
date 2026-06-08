import { EmptyTool } from '@blocksuite/affine-gfx-pointer';
import { EdgelessToolbarToolMixin } from '@blocksuite/affine-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';

import { wardleyToolbarIcon } from './icons';

/**
 * Main toolbar button (colored proposal-B icon) that opens the Wardley toolbox
 * sub-menu above the toolbar. Styled like the other senior tools: the tile fills
 * the 96×64 slot, is anchored to the bottom so it "rises from below", and grows
 * slightly on hover.
 */
export class EdgelessWardleySeniorButton extends EdgelessToolbarToolMixin(
  SignalWatcher(LitElement)
) {
  static override styles = css`
    :host,
    .wardley-button {
      display: block;
      width: 100%;
      height: 100%;
    }
    .wardley-root {
      width: 100%;
      height: 64px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .wardley-card {
      --y: 6px;
      --s: 1;
      position: absolute;
      bottom: 0;
      width: 54px;
      height: 54px;
      transform: translateY(var(--y)) scale(var(--s));   /* base */
      translate: var(--active-x, 0) var(--active-y, 0);   /* actif */
      rotate: var(--active-r, -2deg);
        scale: var(--active-s, 1);
      transition: transform 0.3s ease, translate 0.3s ease,
        rotate 0.3s ease, scale 0.3s ease;
    }
    .wardley-card svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .wardley-root:hover .wardley-card {
      --y: -2px;
      --s: 1.07;
    }
  `;

  override enableActiveBackground = true;

  override type = EmptyTool;

  private _toggleMenu() {
    if (this.tryDisposePopper()) return;
    this.setEdgelessTool(EmptyTool);
    const menu = this.createPopper('edgeless-wardley-menu', this);
    menu.element.edgeless = this.edgeless;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Close the menu when the user switches to any other tool.
    this._disposables.add(
      this.gfx.tool.currentToolName$.subscribe(name => {
        if (name !== 'empty') {
          this.popper?.dispose();
        }
      })
    );
  }

  override render() {
    return html`<edgeless-toolbar-button
      class="wardley-button"
      .tooltip=${this.popper ? '' : 'Wardley map'}
      .tooltipOffset=${4}
      @click=${this._toggleMenu}
    >
      <div class="wardley-root">
        <div class="wardley-card">${wardleyToolbarIcon}</div>
      </div>
    </edgeless-toolbar-button>`;
  }
}
