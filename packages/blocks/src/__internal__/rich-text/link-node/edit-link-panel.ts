import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

@customElement('edit-link-panel')
export class EditLinkPanel extends LitElement {
  static styles = css`
    .overlay-mask {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }

    .edit-link-panel {
      display: flex;
    }
  `;

  @property()
  left = '0px';

  @property()
  top = '0px';

  @state()
  link = '';

  @state()
  bodyOverflowStyle = '';

  @query('input')
  input: HTMLInputElement | undefined;

  connectedCallback() {
    super.connectedCallback();
    // Disable body scroll
    this.bodyOverflowStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.body.style.overflow = this.bodyOverflowStyle;
  }

  private hide() {
    this.dispatchEvent(
      new CustomEvent<ConfirmDetail>('confirm', { detail: { link: null } })
    );
  }

  private confirm() {
    const link = this.input?.value?.trim() ?? null;
    if (!link) {
      // TODO invalid link checking
      return;
    }
    const options = {
      detail: { link },
    };
    this.dispatchEvent(new CustomEvent<ConfirmDetail>('confirm', options));
    return;
  }

  private onKeyup(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.confirm();
    }
    this.link = (e.target as HTMLInputElement).value;
    return;
  }

  render() {
    return html`
      <div class="overlay-root">
        <div class="overlay-mask" @click="${this.hide}"></div>
        <div
          class="overlay-container"
          style="position: absolute; left: ${this.left}; top: ${this.top};"
        >
          <div class="edit-link-panel">
            <input
              class="edit-link-panel-input"
              autofocus
              type="text"
              spellcheck="false"
              placeholder="Paste or type a link"
              @keyup="${this.onKeyup}"
            />
            <div class="edit-link-panel-btn-container">
              <button @click="${this.confirm}">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edit-link-panel': EditLinkPanel;
  }
}

type ConfirmDetail = { link: string | null };

declare global {
  interface HTMLElementEventMap {
    confirm: CustomEvent<ConfirmDetail>;
  }
}
