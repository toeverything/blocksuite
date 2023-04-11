import type { SelectTag } from '@blocksuite/global/database';
import { VEditor } from '@blocksuite/virgo';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { INPUT_MAX_LENGTH } from '../../../consts.js';
import type { DatabaseBlockModel } from '../../../database-model.js';

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
    this._vEditor = new VEditor(this.select.value, {
      defaultMode: 'pure',
    });
    this._vEditor.mount(this._container);
    this._vEditor.bindHandlers({
      virgoInput: this._handleInput,
      paste: this._handlePaste,
    });
    // When editing the current select, other sibling selects should not be edited
    this._vEditor.setReadonly(!this.editing);
  }

  private _handleInput = (event: InputEvent) => {
    const length = this._vEditor.yText.length;
    if (length >= INPUT_MAX_LENGTH && event.data) {
      // prevent input
      return true;
    }
    return false;
  };

  private _handlePaste = (event: ClipboardEvent) => {
    const length = this._vEditor.yText.length;
    const restLength = INPUT_MAX_LENGTH - length;
    if (restLength <= 0) return;

    const data = event.clipboardData?.getData('text/plain');
    if (!data) return;

    const vRange = this._vEditor.getVRange();
    const text = data.length > restLength ? data.slice(0, restLength) : data;
    if (vRange) {
      this._vEditor.insertText(vRange, text);
      this._vEditor.setVRange({
        index: vRange.index + text.length,
        length: 0,
      });
    }
  };

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
