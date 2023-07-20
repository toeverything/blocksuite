// related component

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { DataViewKanbanManager } from './kanban-view-manager.js';

const styles = css`
  affine-data-view-kanban-card {
  }
`;

@customElement('affine-data-view-kanban-card')
export class KanbanCard extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;

  override render() {
    return html` <div></div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-card': KanbanCard;
  }
}
