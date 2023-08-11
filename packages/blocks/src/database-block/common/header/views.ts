import { AddCursorIcon } from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  popFilterableSimpleMenu,
  popMenu,
} from '../../../components/menu/index.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import { viewManager, viewRendererManager } from '../data-view.js';

@customElement('data-view-header-views')
export class DataViewHeaderViews extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    data-view-header-views {
      display: flex;
      user-select: none;
      overflow-x: scroll;
    }
    data-view-header-views::-webkit-scrollbar-thumb {
      width: 1px;
    }

    .database-view-button {
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      display: flex;
      align-items: center;
      color: var(--affine-text-secondary-color);
    }

    .database-view-button .name {
      height: 22px;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .database-view-button .icon {
      margin-right: 6px;
    }

    .database-view-button .icon svg {
      width: 16px;
      height: 16px;
    }

    .database-view-button.active {
      color: var(--affine-text-primary-color);
      background-color: var(--affine-hover-color);
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
      viewManager.all.map(v => {
        return {
          type: 'action',
          name: v.defaultName,
          icon: html`<uni-lit
            .uni=${viewRendererManager.getView(v.type).icon}
          ></uni-lit>`,
          hide: () =>
            v.type === 'kanban' &&
            !this.model.page.awarenessStore.getFlag('enable_database_filter'),
          select: () => {
            const view = this.model.addView(v.type);
            this.setViewId(view.id);
            this.model.applyViewsUpdate();
          },
        };
      })
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
      ${repeat(
        views,
        v => v.id,
        view => {
          const classList = classMap({
            'database-view-button': true,
            active: this.currentView === view.id,
          });
          return html` <div
            class="${classList}"
            @click="${(event: MouseEvent) => this._clickView(event, view.id)}"
          >
            <uni-lit
              class="icon"
              .uni="${viewRendererManager.getView(view.mode).icon}"
            ></uni-lit>
            <div class="name">${view.name}</div>
          </div>`;
        }
      )}
      <div class="database-view-button" @click="${this._addViewMenu}">
        ${AddCursorIcon}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-views': DataViewHeaderViews;
  }
}
