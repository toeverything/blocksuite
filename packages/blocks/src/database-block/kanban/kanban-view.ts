import './group.js';
import './header.js';
import './drag.js';

import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Text } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { BlockOperation } from '../types.js';
import type { DataViewKanbanManager } from './kanban-view-manager.js';
import { KanbanSelection } from './selection.js';

const styles = css`
  .affine-data-view-kanban-groups {
    display: flex;
    padding: 20px 0;
    gap: 20px;
    overflow-x: auto;
  }
`;

@customElement('affine-data-view-kanban')
export class DataViewKanban extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;

  @property({ attribute: false })
  blockOperation!: BlockOperation;

  @property({ attribute: false })
  titleText!: Text;

  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  modalMode?: boolean;

  selection = new KanbanSelection(this);

  override firstUpdated() {
    this._disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
        this.querySelectorAll('affine-data-view-kanban-cell').forEach(v =>
          v.requestUpdate()
        );
      })
    );

    this._disposables.add({
      dispose: this.root.uiEventDispatcher.add('keyDown', () => {
        //
      }),
    });
  }

  override render() {
    const groups = this.view.groups;
    if (!groups) {
      return html``;
    }
    return html`
      <affine-data-view-kanban-header
        .view="${this.view}"
      ></affine-data-view-kanban-header>
      <div class="affine-data-view-kanban-groups">
        ${repeat(groups, group => {
          return html` <affine-data-view-kanban-group
            data-key="${group.key}"
            .view="${this.view}"
            .group="${group}"
          ></affine-data-view-kanban-group>`;
        })}
      </div>
      <affine-data-view-kanban-drag
        .view="${this.view}"
        .dispatcher="${this.root.uiEventDispatcher}"
      ></affine-data-view-kanban-drag>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban': DataViewKanban;
  }
}
