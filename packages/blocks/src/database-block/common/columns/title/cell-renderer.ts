import type { BaseBlockModel } from '@blocksuite/store';
import { css, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import {
  RichTextCell,
  RichTextCellEditing,
} from '../rich-text/cell-renderer.js';
import { titleColumnTypeName, titlePureColumnConfig } from './define.js';

@customElement('data-view-title-detail-cell')
export class TitleDetailCell extends BaseCellRenderer<string> {
  static override styles = css``;

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(
      this,
      'keydown',
      e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      },
      true
    );
  }

  extra(): {
    model: BaseBlockModel;
    result: TemplateResult;
  } {
    return this.column.getExtra(this.rowId) as never;
  }

  override render() {
    return this.extra().result;
  }
}

columnRenderer.register({
  type: titleColumnTypeName,
  icon: createIcon('TitleIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(RichTextCell),
    edit: createFromBaseCellRenderer(RichTextCellEditing),
  },
});

export const titleColumnConfig = titlePureColumnConfig;
