import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

const styles = css`
  :host {
    display: flex;
  }

  input[type='checkbox'] {
    height: 0;
    width: 0;
    visibility: hidden;
    margin: 0;
  }

  label {
    cursor: pointer;
    text-indent: -9999px;
    width: 38px;
    height: 20px;
    background: var(--affine-icon-color);
    border: 1px solid var(--affine-black-10);
    display: block;
    border-radius: 20px;
    position: relative;
  }

  label:after {
    content: '';
    position: absolute;
    top: 1px;
    left: 1px;
    width: 16px;
    height: 16px;
    background: var(--affine-white);
    border: 1px solid var(--affine-black-10);
    border-radius: 16px;
    transition: 0.4s;
  }

  input:checked + label {
    background: var(--affine-primary-color);
  }

  input:checked + label:after {
    left: calc(100% - 1px);
    transform: translateX(-100%);
  }

  label:active:after {
    width: 24px;
  }
`;

export class ToggleSwitch extends LitElement {
  static override styles = styles;

  @state()
  on = false;

  @property({ attribute: false })
  onChange?: (on: boolean) => void;

  private _toggleSwitch() {
    this.on = !this.on;
    if (this.onChange) {
      this.onChange(this.on);
    }
  }

  override render() {
    return html`
      <input
        type="checkbox"
        id="switch"
        ?checked=${this.on}
        @change=${this._toggleSwitch}
      />
      <label for="switch"></label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toggle-switch': ToggleSwitch;
  }
}
