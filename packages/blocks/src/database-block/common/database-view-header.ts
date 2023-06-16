import './menu.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { DatabaseMenuComponent } from '../common/menu.js';
import { ViewOperationMap } from '../common/view-manager.js';
import type { DatabaseBlockModel } from '../database-model.js';
import { createDatabasePopup } from './popup.js';

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
  @property()
  model!: DatabaseBlockModel;

  @property()
  currentView?: string;

  @property()
  setViewId!: (id: string) => void;

  @query('.database-view-header')
  private _container!: HTMLDivElement;

  popupContainer() {
    return this._container.parentElement?.parentElement?.parentElement;
  }

  _addViewMenu(event: MouseEvent) {
    const menu = new DatabaseMenuComponent();
    menu.style.zIndex = '2';
    menu.menuGroup = Object.keys(ViewOperationMap).map(type => ({
      type: 'action',
      label: type,
      click: () => {
        const view = this.model.addView(type as keyof typeof ViewOperationMap);
        this.setViewId(view.id);
        this.model.applyViewsUpdate();
      },
    }));
    createDatabasePopup(event.target as HTMLElement, menu);
  }

  _viewMenu(event: MouseEvent, id: string) {
    event.preventDefault();
    const menu = new DatabaseMenuComponent();
    menu.menuGroup = [
      {
        label: 'Delete',
        click: () => {
          if (this.model.getViewList().length <= 1) {
            return;
          }
          this.model.deleteView(id);
          this.model.applyViewsUpdate();
        },
        type: 'action',
      },
    ];
    createDatabasePopup(event.target as HTMLElement, menu);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.model.propsUpdated.on(() => {
      this.requestUpdate();
    });
  }

  override render() {
    const views = this.model.getViewList();

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
                @contextmenu="${(event: MouseEvent) =>
                  this._viewMenu(event, view.id)}"
                @click="${() => this.setViewId(view.id)}"
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
