import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Text } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { VirgoInput } from '../../../components/virgo-input/virgo-input.js';

@customElement('affine-database-title')
export class DatabaseTitle extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-database-title {
      position: relative;
      flex: 1;
    }

    .database-title {
      font-size: 20px;
      font-weight: 600;
      line-height: 28px;
      color: var(--affine-text-primary-color);
      font-family: inherit;
      /* overflow-x: scroll; */
      overflow: hidden;
      cursor: text;
    }

    .database-title [data-virgo-text='true'] {
      display: block;
      word-break: break-all !important;
    }

    .database-title.ellipsis [data-virgo-text='true'] {
      white-space: nowrap !important;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .database-title:focus {
      outline: none;
    }

    .database-title:disabled {
      background-color: transparent;
    }

    .database-title-empty::before {
      content: 'Untitled';
      position: absolute;
      pointer-events: none;
      color: var(--affine-text-primary-color);
    }

    .database-title-empty:focus::before {
      color: var(--affine-placeholder-color);
    }
  `;

  @property({ attribute: false })
  titleText!: Text;

  @property({ attribute: false })
  readonly!: boolean;

  @property({ attribute: false })
  onPressEnterKey?: () => void;
  @state()
  compositionInput = false;
  @query('.database-title')
  private _titleContainer!: HTMLDivElement;

  titleVInput: VirgoInput | null = null;

  override firstUpdated() {
    this._initTitleVEditor();
    const disposables = this._disposables;

    disposables.addFromEvent(this._titleContainer, 'focus', this._onTitleFocus);
    disposables.addFromEvent(this._titleContainer, 'blur', this._onTitleBlur);
    disposables.addFromEvent(this._titleContainer, 'compositionstart', () => {
      this.compositionInput = true;
    });
    disposables.addFromEvent(this._titleContainer, 'compositionend', () => {
      this.compositionInput = false;
    });
  }

  private _initTitleVEditor() {
    this.titleVInput = new VirgoInput({
      yText: this.titleText.yText,
    });

    this.titleVInput.vEditor.disposables.addFromEvent(
      this._titleContainer,
      'keydown',
      this._handleKeyDown
    );

    // for title placeholder
    this.titleText.yText.observe(() => {
      this.requestUpdate();
    });

    this.titleVInput.mount(this._titleContainer);
    this.titleVInput.vEditor.setReadonly(this.readonly);
  }

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.isComposing) {
      // prevent insert v-line
      event.preventDefault();
      // insert new row
      this.onPressEnterKey?.();
      return;
    }
  };
  @state()
  private isActive = false;
  private _onTitleFocus = () => {
    this.isActive = true;
    this.titleVInput?.setActive(true);
  };

  private _onTitleBlur = () => {
    this.isActive = false;
    this.titleVInput?.setActive(false);
  };

  override render() {
    const isEmpty =
      (!this.titleText || !this.titleText.length) && !this.compositionInput;
    const classList = classMap({
      'database-title': true,
      'database-title-empty': isEmpty,
      ellipsis: !this.isActive,
    });
    return html`<div class="affine-database-title">
      <div
        class="${classList}"
        data-block-is-database-title="true"
        title="${this.titleText.toString()}"
      ></div>
      <div class="database-title" style="float:left;height: 0;">Untitled</div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-title': DatabaseTitle;
  }
}
