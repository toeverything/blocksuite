import type { TemplateResult } from 'lit';
import { css } from 'lit';
import { customElement} from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { titleColumnTypeName, titlePureColumnConfig } from './define.js';

@customElement('affine-database-title-cell')
export class TitleCell extends BaseCellRenderer<TemplateResult> {
  static override styles = css`
    affine-database-title-cell {
      position: relative;
    }

    .affine-database-block-row-cell-content {
      display: flex;
      align-items: center;
      height: 100%;
      min-height: 44px;
      transform: translateX(0);
      border: 2px solid transparent; 
      cursor: pointer;
    }
  `;

  override render() {
    return html`
      <div class="affine-database-block-row-cell-content">
        ${this.value}
      </div>
    `;
  }
}

columnRenderer.register({
  type: titleColumnTypeName,
  cellRenderer: {
    view: createFromBaseCellRenderer(TitleCell),
  },
});

export const titleColumnConfig = titlePureColumnConfig;
