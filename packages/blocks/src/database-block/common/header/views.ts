import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  popFilterableSimpleMenu,
  popMenu,
} from '../../../components/menu/index.js';
import { AddCursorIcon, DeleteIcon } from '../../../icons/index.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import { viewManager, viewRendererManager } from '../data-view.js';

@customElement('data-view-header-views')
export class DataViewHeaderViews extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    data-view-header-views {
      display: flex;
      user-select: none;
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
      white-space: nowrap;
    }

    .database-view-button .name {
      height: 22px;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
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
          select: () => {
            this.model.page.captureSync();
            const view = this.model.addView(v.type);
            this.setViewId(view.id);
            this.model.applyViewsUpdate();
          },
        };
      })
    );
  }

  _showMore(event: MouseEvent) {
    popFilterableSimpleMenu(event.target as HTMLElement, [
      ...this.model.views.map(v => ({
        type: 'action' as const,
        icon: html`<uni-lit
          .uni=${viewRendererManager.getView(v.mode).icon}
        ></uni-lit>`,
        name: v.name,
        select: () => {
          this.setViewId(v.id);
        },
      })),
      {
        type: 'group',
        name: '',
        children: () =>
          viewManager.all.map(v => {
            return {
              type: 'action',
              name: `Create ${v.defaultName}`,
              icon: html`<uni-lit
                .uni=${viewRendererManager.getView(v.type).icon}
              ></uni-lit>`,
              select: () => {
                this.model.page.captureSync();
                const view = this.model.addView(v.type);
                this.setViewId(view.id);
                this.model.applyViewsUpdate();
              },
            };
          }),
      },
    ]);
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
            this.model.updateView(view.id, _data => ({
              name: text,
            }));
            this.model.applyViewsUpdate();
          },
        },
        items: [
          {
            type: 'action',
            name: 'Delete',
            icon: DeleteIcon,
            select: () => {
              this.model.deleteView(view.id);
              this.model.applyViewsUpdate();
            },
            class: 'delete-item',
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

  renderMore() {
    if (this.model.views.length <= 3) {
      return html`<div
        class="database-view-button"
        @click="${this._addViewMenu}"
      >
        ${AddCursorIcon}
      </div>`;
    }
    return html`
      <div class="database-view-button" @click="${this._showMore}">
        ${this.model.views.length - 3} More
      </div>
    `;
  }

  override render() {
    const views = this.model.views;
    const i = views.findIndex(v => v.id === this.currentView);
    const needShow =
      i > 2 ? [...views.slice(0, 2), views[i]] : views.slice(0, 3);
    return html`
      ${repeat(
        needShow,
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
      ${this.renderMore()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-views': DataViewHeaderViews;
  }
}
