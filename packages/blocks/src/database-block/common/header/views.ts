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
import { viewManager, viewRendererManager } from '../data-view.js';
import type { ViewSource } from '../view-source.js';

@customElement('data-view-header-views')
export class DataViewHeaderViews extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    data-view-header-views {
      height: 32px;
      display: flex;
      user-select: none;
      gap: 4px;
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
      display: flex;
      align-items: center;
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
      background-color: var(--affine-hover-color-filled);
    }
  `;
  @property({ attribute: false })
  viewSource!: ViewSource;
  get readonly() {
    return this.viewSource.readonly;
  }

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
            const id = this.viewSource.viewAdd(v.type);
            this.viewSource.selectView(id);
          },
        };
      })
    );
  }

  _showMore(event: MouseEvent) {
    const views = this.viewSource.views;
    popFilterableSimpleMenu(event.target as HTMLElement, [
      ...views.map(v => ({
        type: 'action' as const,
        icon: html`<uni-lit
          .uni=${viewRendererManager.getView(v.view.mode).icon}
        ></uni-lit>`,
        name: v.view.name,
        isSelected: this.viewSource.currentViewId === v.view.id,
        select: () => {
          this.viewSource.selectView(v.view.id);
        },
      })),
      {
        type: 'group',
        name: '',
        hide: () => this.readonly,
        children: () =>
          viewManager.all.map(v => {
            return {
              type: 'action',
              name: `Create ${v.defaultName}`,
              icon: html`<uni-lit
                .uni=${viewRendererManager.getView(v.type).icon}
              ></uni-lit>`,
              select: () => {
                const id = this.viewSource.viewAdd(v.type);
                this.viewSource.selectView(id);
              },
            };
          }),
      },
    ]);
  }

  _clickView(event: MouseEvent, id: string) {
    if (this.viewSource.currentViewId !== id) {
      this.viewSource.selectView(id);
      return;
    }
    if (this.readonly) {
      return;
    }
    const view = this.viewSource.views.find(v => v.view.id === id);
    if (!view) {
      return;
    }
    popMenu(event.target as HTMLElement, {
      options: {
        input: {
          initValue: view.view.name,
          onComplete: text => {
            view.updateView(_data => ({
              name: text,
            }));
          },
        },
        items: [
          {
            type: 'action',
            name: 'Delete',
            icon: DeleteIcon,
            select: () => {
              view.delete();
            },
            class: 'delete-item',
          },
        ],
      },
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.viewSource.updateSlot.on(() => {
        this.requestUpdate();
      })
    );
  }

  renderMore() {
    const views = this.viewSource.views;
    if (views.length <= 3) {
      if (this.readonly) {
        return;
      }
      return html`<div
        class="database-view-button dv-icon-16 dv-hover"
        @click="${this._addViewMenu}"
      >
        ${AddCursorIcon}
      </div>`;
    }
    return html`
      <div class="database-view-button dv-hover" @click="${this._showMore}">
        ${views.length - 3} More
      </div>
    `;
  }

  override render() {
    const views = this.viewSource.views;
    const i = views.findIndex(v => v.view.id === this.viewSource.currentViewId);
    const needShow =
      i > 2 ? [...views.slice(0, 2), views[i]] : views.slice(0, 3);
    return html`
      ${repeat(
        needShow,
        v => v.view.id,
        view => {
          const classList = classMap({
            'database-view-button': true,
            'dv-hover': true,
            active: this.viewSource.currentViewId === view.view.id,
          });
          return html` <div
            class="${classList}"
            @click="${(event: MouseEvent) =>
              this._clickView(event, view.view.id)}"
          >
            <uni-lit
              class="icon"
              .uni="${viewRendererManager.getView(view.view.mode).icon}"
            ></uni-lit>
            <div class="name">${view.view.name}</div>
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
