import './tool-icon-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { createButtonPopper } from '../../../../_common/utils/button-popper.js';
import type { EdgelessToolIconButton } from './tool-icon-button.js';

@customElement('edgeless-menu-button')
export class EdgelessMenuButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    ::slotted([slot]) {
      display: flex;
    }

    ::slotted([slot][data-orientation='horizontal']) {
      align-items: center;
      align-self: stretch;
      gap: 8px;
    }
  `;

  @query('edgeless-tool-icon-button')
  private accessor _trigger!: EdgelessToolIconButton;

  @query('edgeless-menu-content')
  private accessor _content!: EdgelessMenuContent;

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
    return html`${this.button}
      <edgeless-menu-content role="menu" tabindex="-1">
        <slot></slot>
      </edgeless-menu-content>`;
  }
}

@customElement('edgeless-menu-content')
export class EdgelessMenuContent extends LitElement {
  static override styles = css`
    :host {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: var(--content-padding, 0 6px);

      border: 0.5px solid var(--affine-border-color);
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-4);
      border-radius: 4px;
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

@customElement('edgeless-menu-divider')
export class EdgelessMenuDivider extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: stretch;

      width: 4px;
    }

    :host::after {
      content: '';
      display: flex;
      width: 0.5px;
      height: 100%;
      background-color: var(--affine-border-color);
    }

    :host([data-orientation='horizontal']) {
      height: var(--height, 4px);
      width: unset;
    }

    :host([data-orientation='horizontal'])::after {
      height: 0.5px;
      width: 100%;
    }
  `;
}

export function renderMenuDivider() {
  return html`<edgeless-menu-divider></edgeless-menu-divider>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-menu-button': EdgelessMenuButton;
    'edgeless-menu-content': EdgelessMenuContent;
    'edgeless-menu-divider': EdgelessMenuDivider;
  }
}
