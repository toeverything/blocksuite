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
  static styles = css`
    :host * {
      box-sizing: border-box;
    }
    .select-option-text {
      display: inline-block;
      min-width: 2px;
      height: 100%;
      padding: 2px 10px;
      background: #fce8ff;
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

  @query('.select-option-text')
  private _container!: HTMLDivElement;

  private _vEditor!: VEditor;

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('editing') && this.editing) {
      this._vEditor.focusEnd();
      this._vEditor.setReadonly(!this.editing);
    }
  }

  getSelectionValue() {
    return this._vEditor.yText.toString();
  }

  firstUpdated() {
    this._vEditor = initLimitedLengthVEditor({
      yText: this.select.value,
      container: this._container,
      targetModel: this.databaseModel,
      maxLength: SELECT_TAG_NAME_MAX_LENGTH,
      // When editing the current select, other sibling selects should not be edited
      readonly: !this.editing,
    });
  }

  render() {
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
