import './icon-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { createButtonPopper } from '../../utils/button-popper.js';
import type { AffineToolbarIconButton } from './icon-button.js';

@customElement('affine-menu-button')
export class AffineMenuButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    ::slotted([slot]) {
      display: flex;
      flex-direction: column;
    }

    ::slotted([slot][data-size='small']) {
      min-width: 164px;
    }

    ::slotted([slot][data-size='large']) {
      min-width: 184px;
    }

    ::slotted([slot][data-orientation='horizontal']) {
      flex-direction: row;
      align-items: center;
      align-self: stretch;
      gap: 8px;
    }
  `;

  @query('affine-toolbar-icon-button')
  private accessor _trigger!: AffineToolbarIconButton;

  @query('affine-menu-content')
  private accessor _content!: AffineMenuContent;

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
      12
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
      <affine-menu-content role="menu" tabindex="-1">
        <slot></slot>
      </affine-menu-content>
    `;
  }
}

@customElement('affine-menu-content')
export class AffineMenuContent extends LitElement {
  static override styles = css`
    :host {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: var(--content-padding, 0 6px);
      border-radius: 4px;
      border: 0.5px solid var(--affine-border-color);
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-4);
      min-height: 36px;
      outline: none;
    }

    :host([data-show]) {
      display: flex;
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('affine-menu-action')
export class AffineMenuAction extends LitElement {
  static override styles = css`
    :host {
      display: flex;
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
    }

    :host(:hover),
    :host([data-selected]) {
      background-color: var(--affine-hover-color);
    }

    :host([data-selected]) {
      pointer-events: none;
    }

    :host(:hover.delete) {
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
    'affine-menu-button': AffineMenuButton;
    'affine-menu-content': AffineMenuContent;
    'affine-menu-action': AffineMenuAction;
  }
}
