import { css, html, LitElement, nothing } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';

type ModalButton = {
  text: string;
  type?: 'primary';
  onClick: () => Promise<void> | void;
};

type ModalOptions = {
  footer: null | ModalButton[];
};

export class AffineCustomModal extends LitElement {
  static override styles = css`
    :host {
      z-index: calc(var(--affine-z-index-modal) + 3);
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
    }

    .modal-background {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      align-items: center;
      background-color: var(--affine-background-modal-color);
      justify-content: center;
      display: flex;
    }

    .modal-window {
      width: 70%;
      min-width: 500px;
      height: 80%;
      overflow-y: scroll;
      background-color: var(--affine-background-overlay-panel-color);
      border-radius: 12px;
      box-shadow: var(--affine-shadow-3);
      position: relative;
    }

    .modal-main {
      height: 100%;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 20px;
      padding: 24px;
      position: absolute;
      box-sizing: border-box;
      bottom: 0;
      right: 0;
    }

    .modal-footer .button {
      align-items: center;
      background: var(--affine-white);
      border: 1px solid;
      border-color: var(--affine-border-color);
      border-radius: 8px;
      color: var(--affine-text-primary-color);
      cursor: pointer;
      display: inline-flex;
      font-size: var(--affine-font-sm);
      font-weight: 500;
      justify-content: center;
      outline: 0;
      padding: 12px 18px;
      touch-action: manipulation;
      transition: all 0.3s;
      user-select: none;
    }

    .modal-footer .primary {
      background: var(--affine-primary-color);
      border-color: var(--affine-black-10);
      box-shadow: var(--affine-button-inner-shadow);
      color: var(--affine-pure-white);
    }
  `;

  onOpen!: (div: HTMLDivElement) => void;

  options!: ModalOptions;

  close() {
    this.remove();
  }

  modalRef(modal: Element | undefined) {
    if (modal) this.onOpen?.(modal as HTMLDivElement);
  }

  override render() {
    const { options } = this;

    return html`<div class="modal-background">
      <div class="modal-window">
        <div class="modal-main" ${ref(this.modalRef)}></div>
        <div class="modal-footer">
          ${options.footer
            ? repeat(
                options.footer,
                button => button.text,
                button => html`
                  <button
                    class="button ${button.type ?? ''}"
                    @click=${button.onClick}
                  >
                    ${button.text}
                  </button>
                `
              )
            : nothing}
        </div>
      </div>
    </div>`;
  }
}

type CreateModalOption = ModalOptions & {
  entry: (div: HTMLDivElement) => void;
};

export function createCustomModal(
  options: CreateModalOption,
  container: HTMLElement = document.body
) {
  const modal = new AffineCustomModal();

  modal.onOpen = options.entry;
  modal.options = options;

  container.append(modal);

  return modal;
}
