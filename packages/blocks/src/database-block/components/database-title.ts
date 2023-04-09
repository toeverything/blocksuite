import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { ShadowlessElement } from '../../__internal__/utils/lit.js';
import { setupVirgoScroll } from '../../__internal__/utils/virgo.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import type { DatabaseBlockModel } from '../database-model.js';

@customElement('affine-database-title')
export class DatabaseTitle extends ShadowlessElement {
  static styles = css`
    .affine-database-title {
      flex: 1;
      max-width: 300px;
      min-width: 300px;
      height: 30px;
    }

    .database-title {
      flex: 1;
      position: sticky;
      width: 300px;
      height: 30px;
      font-size: 18px;
      font-weight: 600;
      line-height: 24px;
      color: #424149;
      font-family: inherit;
      overflow: hidden;
      cursor: text;
    }

    .database-title [data-virgo-text='true'] {
      display: inline-block;
      width: 300px;
      max-width: 300px;
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

    ${tooltipStyle}
  `;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  addRow!: (rowIndex?: number) => void;

  @query('.database-title')
  private _titleContainer!: HTMLDivElement;

  private _vEditor!: VEditor;

  firstUpdated() {
    this._initTitleVEditor();
  }

  private _onShowTitleTooltip = () => {
    // TODO: show tooltip according to title content(vEditor)
  };

  private _initTitleVEditor() {
    this._vEditor = new VEditor(this.targetModel.title.yText);
    setupVirgoScroll(this.targetModel.page, this._vEditor);
    this._vEditor.mount(this._titleContainer);
    this._vEditor.bindHandlers({
      keydown: this._handleKeyDown,
    });
    this._vEditor.setReadonly(this.targetModel.page.readonly);

    // for title placeholder
    this.targetModel.title.yText.observe(() => {
      this.requestUpdate();
    });

    // after the database structure is created
    requestAnimationFrame(() => {
      this._vEditor?.focusEnd();
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

  render() {
    const isEmpty = !this.targetModel.title || !this.targetModel.title.length;
    return html`<div
      class="has-tool-tip affine-database-title"
      @mouseover=${this._onShowTitleTooltip}
    >
      <div
        class="database-title ${isEmpty ? 'database-title-empty' : ''}"
        data-block-is-database-title="true"
      ></div>
      <tool-tip inert arrow tip-position="top" role="tooltip"
        >Database hello new work is not only
      </tool-tip>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-title': DatabaseTitle;
  }
}
