import { DefaultTool } from '@labre/affine-block-surface';
import { EmptyTool } from '@labre/affine-gfx-pointer';
import { EdgelessToolbarToolMixin } from '@labre/affine-widget-edgeless-toolbar';
import { SignalWatcher } from '@labre/global/lit';
import { css, html, LitElement } from 'lit';

import { edgyToolbarIcon } from './icons';

/**
 * Main toolbar button (colored facets glyph) that opens the EDGY toolbox
 * sub-menu above the toolbar. Mirrors the Wardley senior button.
 */
export class EdgelessEdgySeniorButton extends EdgelessToolbarToolMixin(
  SignalWatcher(LitElement)
) {
  static override styles = css`
    :host,
    .edgy-button {
      display: block;
      width: 100%;
      height: 100%;
    }
    :host {
      position: relative;
    }
    .edgy-root {
      width: 100%;
      height: 64px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .edgy-card {
      --y: -4px;
      --s: 1;
      position: absolute;
      bottom: 0;
      width: 54px;
      height: 54px;
      transform: translateY(var(--y)) scale(var(--s));
      translate: var(--active-x, 0) var(--active-y, 0);
      rotate: var(--active-r, -2deg);
      scale: var(--active-s, 1);
      transition: transform 0.3s ease, translate 0.3s ease, rotate 0.3s ease,
        scale 0.3s ease;
    }
    .edgy-card svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .edgy-root:hover .edgy-card {
      --y: -10px;
      --s: 1.07;
    }
  `;

  override enableActiveBackground = true;

  override type = EmptyTool;

  private _toggleMenu() {
    if (this.popper) {
      this.popper.dispose();
      this.popper = null;
      return;
    }
    this.setEdgelessTool(DefaultTool);
    const menu = this.createPopper('edgeless-edgy-menu', this);
    menu.element.edgeless = this.edgeless;

    const el = menu.element as HTMLElement;
    const wrap = el.parentElement;
    if (wrap) {
      wrap.style.overflow = 'visible';
      wrap.style.justifyContent = 'flex-end';
    }
    Object.assign(el.style, {
      position: 'static',
      width: 'max-content',
      maxWidth: 'calc(100vw - 16px)',
      marginLeft: '0',
    });
  }

  override render() {
    return html`<edgeless-toolbar-button
      class="edgy-button"
      .tooltip=${this.popper ? '' : 'EDGY'}
      .tooltipOffset=${4}
      .active=${!!this.popper}
      @click=${this._toggleMenu}
    >
      <div class="edgy-root">
        <div class="edgy-card">${edgyToolbarIcon}</div>
      </div>
    </edgeless-toolbar-button>`;
  }
}
