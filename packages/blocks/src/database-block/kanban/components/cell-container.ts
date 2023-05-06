import { PlusIcon } from '@blocksuite/global/config';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  ShadowlessElement,
  WithDisposable,
} from '../../../__internal__/utils/lit.js';
import type { KanbanColumn } from '../../database-model.js';

const styles = css`
  affine-database-kanban-cell-container {
    width: 100%;
    height: 30px;
  }

  .kanban-cell-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .kanban-cell {
    display: flex;
    align-items: center;
    height: 30px;
    padding: 4px;
    border: 1px solid var(--affine-border-color);
    border-radius: 4px;
    cursor: pointer;
  }
  .kanban-cell:hover {
    background: var(--affine-hover-color);
  }
  .kanban-cell.new {
    border: none;
  }
  .kanban-cell-icon {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: var(--affine-icon-color);
  }
  .kanban-cell-icon svg {
    width: 18px;
    height: 18px;
  }
`;

@customElement('affine-database-kanban-cell-container')
export class CellContainer extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property()
  cellList!: KanbanColumn['children'];

  protected override render() {
    return html`<div class="kanban-cell-container">
      ${repeat(
        this.cellList,
        cell => cell.id,
        cell => {
          return html`<div class="kanban-cell">${cell.text}</div>`;
        }
      )}
      <div class="kanban-cell new">
        <div class="kanban-cell-icon">${PlusIcon} Add</div>
      </div>
    </div>`;
  }
}
