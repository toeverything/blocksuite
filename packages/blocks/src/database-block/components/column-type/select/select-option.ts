import type { SelectTag } from '@blocksuite/global/database';
import type { VEditor } from '@blocksuite/virgo';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { SELECT_TAG_NAME_MAX_LENGTH } from '../../../consts.js';
import type { DatabaseBlockModel } from '../../../database-model.js';
import { initLimitedLengthVEditor } from '../../../utils.js';

@customElement('affine-database-select-option')
export class SelectOption extends LitElement {
  static override styles = css`
    :host * {
      box-sizing: border-box;
    }
    .select-option-text {
      display: inline-block;
      min-width: 2px;
      height: 100%;
      padding: 2px 10px;
      background: var(--affine-tag-pink);
      border-radius: 4px;
    }
    .select-option-text:focus {
      outline: none;
    }
  `;

  @property()
  databaseModel!: DatabaseBlockModel;

  @property()
  select!: SelectTag;

  @property()
  editing!: boolean;

  @property()
  index!: number;

  @property()
  saveSelectionName!: (index: number) => void;

  @property()
  setEditingIndex!: (index: number) => void;

  @query('.select-option-text')
  private _container!: HTMLDivElement;

  private _vEditor!: VEditor;

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('editing')) {
      if (this.editing) {
        this._vEditor.focusEnd();
      }
      this._vEditor.setReadonly(!this.editing);
      this._vEditor.setText(this.select.value);
    }
  }

  getSelectionValue() {
    return this._vEditor.yText.toString();
  }

  override firstUpdated() {
    this._vEditor = initLimitedLengthVEditor({
      yText: this.select.value,
      container: this._container,
      targetModel: this.databaseModel,
      maxLength: SELECT_TAG_NAME_MAX_LENGTH,
      // When editing the current select, other sibling selects should not be edited
      readonly: !this.editing,
      handlers: {
        keydown: event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.saveSelectionName(this.index);
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            this.setEditingIndex(-1);
            this._container.blur();
          }
        },
      },
      options: {
        defaultMode: 'pure',
      },
    });
  }

  override render() {
    const style = styleMap({
      backgroundColor: this.select.color,
    });
    return html`<div class="select-option-text" style=${style}></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-select-option': SelectOption;
  }
}
