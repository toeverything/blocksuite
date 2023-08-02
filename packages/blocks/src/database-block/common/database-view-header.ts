import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  popFilterableSimpleMenu,
  popMenu,
} from '../../components/menu/menu.js';
import { ViewOperationMap } from '../common/view-manager.js';
import type { DatabaseBlockModel } from '../database-model.js';

@customElement('database-view-header')
export class DatabaseViewHeader extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .database-view-header {
      display: flex;
      user-select: none;
      border-bottom: 1px solid #e0e0e0;
    }

    .database-view-button-wrapper {
      padding: 0 0 4px 0;
      margin-right: 4px;
    }

    .database-view-button-wrapper.active {
      border-bottom: 2px solid;
      font-weight: 600;
    }

    .database-view-button {
      cursor: pointer;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 14px;
    }

    .database-view-button:hover {
      background-color: #e0e0e0;
    }
  `;
  @property({ attribute: false })
  model!: DatabaseBlockModel;

  @property({ attribute: false })
  currentView?: string;

  @property({ attribute: false })
  setViewId!: (id: string) => void;

  _addViewMenu(event: MouseEvent) {
    popFilterableSimpleMenu(
      event.target as HTMLElement,
      Object.keys(ViewOperationMap).map(type => ({
        type: 'action',
        name: type,
        select: () => {
          const view = this.model.addView(
            type as keyof typeof ViewOperationMap
          );
          this.setViewId(view.id);
          this.model.applyViewsUpdate();
        },
      }))
    );
  }

  _clickView(event: MouseEvent, id: string) {
    if (this.currentView !== id) {
      this.setViewId(id);
      return;
    }
    const view = this.model.views.find(v => v.id === id);
    if (!view) {
      return;
    }
    popMenu(event.target as HTMLElement, {
      options: {
        input: {
          initValue: view.name,
          onComplete: text => {
            this.model.updateView(view.id, data => ({
              name: text,
            }));
            this.model.applyViewsUpdate();
          },
        },
        items: [
          {
            type: 'action',
            name: 'Delete',
            select: () => {
              this.model.deleteView(view.id);
              this.model.applyViewsUpdate();
            },
          },
        ],
      },
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.model.propsUpdated.on(() => {
      this.requestUpdate();
    });
  }

  override render() {
    const views = this.model.views;
    return html`
      <div class="database-view-header">
        ${repeat(
          views,
          v => v.id,
          view => {
            return html` <div
              class="database-view-button-wrapper ${this.currentView === view.id
                ? 'active'
                : ''}"
            >
              <div
                @click="${(event: MouseEvent) =>
                  this._clickView(event, view.id)}"
                class="database-view-button"
              >
                ${view.name}
              </div>
            </div>`;
          }
        )}
        <div class="database-view-button-wrapper">
          <div class="database-view-button" @click="${this._addViewMenu}">
            Add
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'database-view-header': DatabaseViewHeader;
  }
}
