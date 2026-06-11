import { DefaultTool } from '@blocksuite/affine-block-surface';
import { EmptyTool } from '@blocksuite/affine-gfx-pointer';
import { EdgelessToolbarToolMixin } from '@blocksuite/affine-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';

import { cynefinToolbarIcon } from './icons';

/** Main toolbar button that opens the combined Cynefin / Estuarine sub-menu. */
export class EdgelessCynefinEstuarineSeniorButton extends EdgelessToolbarToolMixin(
  SignalWatcher(LitElement)
) {
  static override styles = css`
    :host,
    .ce-button {
      display: block;
      width: 100%;
      height: 100%;
    }
    :host {
      position: relative;
    }
    .ce-root {
      width: 100%;
      height: 64px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .ce-card {
      --y: -4px;
      --s: 1;
      position: absolute;
      bottom: 0;
      width: 54px;
      height: 54px;
      transform: translateY(var(--y)) scale(var(--s));
      transition: transform 0.3s ease;
    }
    .ce-card svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .ce-root:hover .ce-card {
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
    const menu = this.createPopper('edgeless-cynefin-estuarine-menu', this);
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
      class="ce-button"
      .tooltip=${this.popper ? '' : 'Cynefin / Estuarine'}
      .tooltipOffset=${4}
      .active=${!!this.popper}
      @click=${this._toggleMenu}
    >
      <div class="ce-root">
        <div class="ce-card">${cynefinToolbarIcon}</div>
      </div>
    </edgeless-toolbar-button>`;
  }
}
