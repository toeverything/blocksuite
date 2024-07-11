import './icon-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { PANEL_BASE } from '../../styles.js';
import { createButtonPopper } from '../../utils/button-popper.js';
import type { EditorIconButton } from './icon-button.js';

@customElement('editor-menu-button')
export class EditorMenuButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `;

  @query('editor-icon-button')
  private accessor _trigger!: EditorIconButton;

  @query('editor-menu-content')
  private accessor _content!: EditorMenuContent;

  private _popper!: ReturnType<typeof createButtonPopper>;

  @property({ attribute: false })
  accessor button!: string | TemplateResult<1>;

  @property({ attribute: false })
  accessor contentPadding: string | undefined = undefined;

  close() {
    this._popper?.hide();
  }

  override firstUpdated() {
    this._popper = createButtonPopper(
      this._trigger,
      this._content,
      ({ display }) => {
        this._trigger.showTooltip = display === 'hidden';
      },
      {
        mainAxis: 12,
        ignoreShift: true,
      }
    );
    this._disposables.addFromEvent(this, 'keydown', (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        this._popper.hide();
      }
    });
    this._disposables.addFromEvent(this._trigger, 'click', (_: MouseEvent) => {
      this._popper.toggle();
      if (this._popper.state === 'show') {
        this._content.focus({ preventScroll: true });
      }
    });
    this._disposables.add(this._popper);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.tabIndex = 0;
    if (this.contentPadding) {
      this.style.setProperty('--content-padding', this.contentPadding);
    }
  }

  override render() {
    return html`
      ${this.button}
      <editor-menu-content role="menu" tabindex="-1">
        <slot></slot>
      </editor-menu-content>
    `;
  }
}

@customElement('editor-menu-content')
export class EditorMenuContent extends LitElement {
  static override styles = css`
    :host {
      --packed-height: 6px;
      --offset-height: calc(-1 * var(--packed-height));
      display: none;
      outline: none;
    }

    :host::before,
    :host::after {
      content: '';
      display: block;
      position: absolute;
      height: var(--packed-height);
      width: 100%;
    }

    :host::before {
      top: var(--offset-height);
    }

    :host::after {
      bottom: var(--offset-height);
    }

    :host([data-show]) {
      ${PANEL_BASE}
      justify-content: center;
      padding: var(--content-padding, 0 6px);
    }

    ::slotted([slot]) {
      display: flex;
      align-items: center;
      align-self: stretch;
      gap: 8px;
      min-height: 36px;
    }

    ::slotted([slot]) {
      min-width: 146px;
    }

    ::slotted([slot][data-size='small']) {
      min-width: 164px;
    }

    ::slotted([slot][data-size='large']) {
      min-width: 184px;
    }

    ::slotted([slot][data-orientation='vertical']) {
      flex-direction: column;
      align-items: stretch;
      gap: unset;
      min-height: unset;
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('editor-menu-action')
export class EditorMenuAction extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      width: 100%;
      align-items: center;
      white-space: nowrap;
      box-sizing: border-box;
      padding: 4px 8px;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      gap: 8px;
      color: var(--affine-text-primary-color);
      font-weight: 400;
      min-height: 30px; // 22 + 8
    }

    :host(:hover),
    :host([data-selected]) {
      background-color: var(--affine-hover-color);
    }

    :host([data-selected]) {
      pointer-events: none;
    }

    :host(:hover.delete),
    :host(:hover.delete) ::slotted(svg) {
      background-color: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }

    :host([disabled]) {
      pointer-events: none;
      cursor: not-allowed;
      color: var(--affine-text-disable-color);
    }

    ::slotted(svg) {
      color: var(--affine-icon-color);
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.role = 'button';
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-menu-button': EditorMenuButton;
    'editor-menu-content': EditorMenuContent;
    'editor-menu-action': EditorMenuAction;
  }
}
