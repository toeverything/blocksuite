import './cell-container.js';

import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ShadowlessElement,
  WithDisposable,
} from '../../../__internal__/utils/lit.js';
import type { KanbanColumn } from '../../database-model.js';

const styles = css`
  .affine-database-column-container {
    width: 200px;
  }
  .column-container-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
  }
  .column-container-header-title {
    padding: 2px 4px;
    border-radius: 4px;
  }
  .column-container-header-count {
    color: var(--affine-text-secondary-color);
  }
`;

@customElement('affine-database-kanban-column-container')
export class ColumnContainer extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property()
  index!: number;

  @property()
  column!: KanbanColumn;

  protected override render() {
    const { title, children } = this.column;
    const style = styleMap({
      background: title.color,
    });
    return html`<div class="affine-database-column-container">
      <div class="column-container-header">
        <div class="column-container-header-title" style=${style}>
          ${title.text}
        </div>
        <div class="column-container-header-count">${children.length}</div>
      </div>
      <affine-database-kanban-cell-container
        .cellList=${children}
      ></affine-database-kanban-cell-container>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-container': ColumnContainer;
  }
}
