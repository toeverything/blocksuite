import { DefaultTool } from '@blocksuite/affine-block-surface';
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

  // `EmptyTool` is only a sentinel for the mixin's abstract `type`; we never
  // activate it. The menu opens as a palette over the default (selection) tool
  // so the canvas stays fully interactive while it is open — mirroring the
  // native Note/Shape sub-menus.
  override type = EmptyTool;

  private _toggleMenu() {
    // Toggle on popper presence (not tool-active state): the menu stays open on
    // click-outside and only closes on re-click, another senior tool, or Escape.
    if (this.popper) {
      this.popper.dispose();
      this.popper = null;
      return;
    }
    this.setEdgelessTool(DefaultTool);
    const menu = this.createPopper('edgeless-wardley-menu', this);
    menu.element.edgeless = this.edgeless;
  }

  override render() {
    return html`<edgeless-toolbar-button
      class="wardley-button"
      .tooltip=${this.popper ? '' : 'Wardley map'}
      .tooltipOffset=${4}
      .active=${!!this.popper}
      @click=${this._toggleMenu}
    >
      <div class="wardley-root">
        <div class="wardley-card">${wardleyToolbarIcon}</div>
      </div>
    </edgeless-toolbar-button>`;
  }
}
