import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('affine-modal')
export class Modal extends LitElement {
  static styles = css`
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1500;
      display: none;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      outline: 0;
      background-color: #000;
      opacity: 0.15;
      transition: opacity 0.15s linear;
    }
  `;

  @property()
  open = false;

  render() {
    return html`
      <div
        class="modal"
        style=${styleMap({
          display: this.open ? 'block' : 'none',
        })}
      >
        <div class="modal-dialog">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-modal': Modal;
  }
}
