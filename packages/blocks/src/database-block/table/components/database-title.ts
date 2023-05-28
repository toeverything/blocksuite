import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { setupVirgoScroll } from '../../../__internal__/utils/virgo.js';
import { VirgoInput } from '../../../components/virgo-input/virgo-input.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import { DATABASE_TITLE_LENGTH, DEFAULT_TITLE } from '../consts.js';

@customElement('affine-database-title')
export class DatabaseTitle extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-database-title {
      flex: 1;
      max-width: 300px;
      min-width: 300px;
      height: 30px;
    }

    .database-title {
      position: sticky;
      width: 300px;
      height: 30px;
      font-size: 18px;
      font-weight: 600;
      line-height: 24px;
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
      color: var(--affine-placeholder-color);
      position: absolute;
      opacity: 0.5;
    }
  `;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  addRow!: (rowIndex?: number) => void;

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
      yText: this.targetModel.title.yText,
      rootElement: this._titleContainer,
      maxLength: DATABASE_TITLE_LENGTH,
    });
    setupVirgoScroll(this.targetModel.page, this._titleVInput.vEditor);
    this._titleVInput.vEditor.setReadonly(this.targetModel.page.readonly);
    this._titleContainer.addEventListener('keydown', this._handleKeyDown);

    // for title placeholder
    this.targetModel.title.yText.observe(() => {
      this.requestUpdate();
    });
  }

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      // prevent insert v-line
      event.preventDefault();
      // insert new row
      this.addRow(0);
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
    const isEmpty = !this.targetModel.title || !this.targetModel.title.length;
    return html`<div class="affine-database-title">
      <div
        class="database-title ${isEmpty ? 'database-title-empty' : ''}"
        data-block-is-database-title="true"
        title=${this.targetModel.title.toString()}
      ></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-title': DatabaseTitle;
  }
}
