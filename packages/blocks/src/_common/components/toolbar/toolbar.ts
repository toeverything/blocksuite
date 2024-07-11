import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PANEL_BASE } from '../../styles.js';
import { stopPropagation } from '../../utils/event.js';

@customElement('editor-toolbar')
export class EditorToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      ${PANEL_BASE}
      height: 36px;
      box-sizing: content-box;
    }

    :host([data-without-bg]) {
      border-color: transparent;
      background: transparent;
      box-shadow: none;
    }

    ::slotted(*) {
      display: flex;
      height: 100%;
      justify-content: center;
      align-items: center;
      gap: 8px;
      color: var(--affine-text-primary-color);
      fill: currentColor;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();

    this._disposables.addFromEvent(this, 'pointerdown', (e: PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
    });
    this._disposables.addFromEvent(this, 'wheel', stopPropagation);
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-toolbar': EditorToolbar;
  }
}
