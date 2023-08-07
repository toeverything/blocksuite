import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Text } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { VirgoInput } from '../../../components/virgo-input/virgo-input.js';

export const DEFAULT_TITLE = 'Database';

export const DATABASE_TITLE_LENGTH = 50;

@customElement('affine-database-title')
export class DatabaseTitle extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-database-title {
      flex: 1;
      height: 28px;
      min-width: 100px;
      width: max-content;
    }

    .database-title {
      height: 30px;
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
      white-space: pre !important;
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
      content: 'Database';
      position: absolute;
      pointer-events: none;
      color: var(--affine-placeholder-color);
      opacity: 0.5;
    }
  `;

  @property({ attribute: false })
  titleText!: Text;

  @property({ attribute: false })
  readonly!: boolean;

  @property({ attribute: false })
  onPressEnterKey?: () => void;

  @query('.database-title')
  private _titleContainer!: HTMLDivElement;

  private _titleVInput: VirgoInput | null = null;

  override firstUpdated() {
    this._initTitleVEditor();
    const disposables = this._disposables;

    disposables.addFromEvent(this._titleContainer, 'focus', this._onTitleFocus);
    disposables.addFromEvent(this._titleContainer, 'blur', this._onTitleBlur);

    // prevent block selection
    const onStopPropagation = (event: Event) => event.stopPropagation();
    this._disposables.addFromEvent(this, 'pointerdown', onStopPropagation);
    this._disposables.addFromEvent(this, 'pointermove', onStopPropagation);
  }

  private _initTitleVEditor() {
    this._titleVInput = new VirgoInput({
      yText: this.titleText.yText,
      rootElement: this._titleContainer,
      maxLength: DATABASE_TITLE_LENGTH,
    });
    this._titleVInput.vEditor.setReadonly(this.readonly);
    this._titleContainer.addEventListener('keydown', this._handleKeyDown);

    // for title placeholder
    this.titleText.yText.observe(() => {
      this.requestUpdate();
    });
  }

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      // prevent insert v-line
      event.preventDefault();
      // insert new row
      this.onPressEnterKey?.();
      return;
    }
  };

  private _onTitleFocus = () => {
    this._titleContainer.classList.remove('ellipsis');

    this._titleVInput?.setActive(true);
    if (this._titleVInput?.value === 'Database') {
      this._titleVInput?.setValue('');
    }
  };

  private _onTitleBlur = () => {
    this._titleContainer.classList.add('ellipsis');

    this._titleVInput?.setActive(false);
    if (this._titleVInput?.value === '') {
      this._titleVInput?.setValue(DEFAULT_TITLE);
    }
  };

  override render() {
    const isEmpty = !this.titleText || !this.titleText.length;
    return html` <div class="affine-database-title">
      <div
        class="database-title ${isEmpty ? 'database-title-empty' : ''}"
        data-block-is-database-title="true"
        title="${this.titleText.toString()}"
      ></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-title': DatabaseTitle;
  }
}
