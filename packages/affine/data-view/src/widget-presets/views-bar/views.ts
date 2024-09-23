import {
  popFilterableSimpleMenu,
  popMenu,
} from '@blocksuite/affine-components/context-menu';
import {
  AddCursorIcon,
  DeleteIcon,
  DuplicateIcon,
  MoreHorizontalIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '@blocksuite/icons/lit';
import { css, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

import { renderUniLit } from '../../core/index.js';
import { WidgetBase } from '../../core/widget/widget-base.js';

export class DataViewHeaderViews extends WidgetBase {
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
      height: 100%;
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
      align-items: center;
      height: 22px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .database-view-button .icon {
      margin-right: 6px;
      display: block;
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

  _addViewMenu = (event: MouseEvent) => {
    popFilterableSimpleMenu(
      event.target as HTMLElement,
      this.dataSource.viewMetas.map(v => {
        return {
          type: 'action',
          name: v.model.defaultName,
          icon: html`<uni-lit .uni=${v.renderer.icon}></uni-lit>`,
          select: () => {
            const id = this.viewManager.viewAdd(v.type);
            this.viewManager.setCurrentView(id);
          },
        };
      })
    );
  };

  _showMore = (event: MouseEvent) => {
    const views = this.viewManager.views$.value;
    popFilterableSimpleMenu(event.target as HTMLElement, [
      ...views.map(id => {
        const openViewOption = (event: MouseEvent) => {
          event.stopPropagation();
          this.openViewOption(event.target as HTMLElement, id);
        };
        const view = this.viewManager.viewGet(id);
        return {
          type: 'action' as const,
          icon: html`<uni-lit .uni=${this.getRenderer(id).icon}></uni-lit>`,
          name: view.data$.value?.name ?? '',
          label: () => html`${view.data$.value?.name}`,
          isSelected: this.viewManager.currentViewId$.value === id,
          select: () => {
            this.viewManager.setCurrentView(id);
          },
          postfix: html`<div
            class="dv-hover dv-round-4"
            @click="${openViewOption}"
            style="display:flex;align-items:center;"
          >
            ${MoreHorizontalIcon()}
          </div>`,
        };
      }),
      {
        type: 'group',
        name: '',
        hide: () => this.readonly,
        children: () =>
          this.dataSource.viewMetas.map(v => {
            return {
              type: 'action',
              name: `Create ${v.model.defaultName}`,
              icon: html`<uni-lit .uni=${v.renderer.icon}></uni-lit>`,
              select: () => {
                const id = this.viewManager.viewAdd(v.type);
                this.viewManager.setCurrentView(id);
              },
            };
          }),
      },
    ]);
  };

  openViewOption = (target: HTMLElement, id: string) => {
    if (this.readonly) {
      return;
    }
    const views = this.viewManager.views$.value;
    const index = views.findIndex(v => v === id);
    const view = this.viewManager.viewGet(views[index]);
    if (!view) {
      return;
    }
    popMenu(target, {
      options: {
        input: {
          initValue: view.data$.value?.name,
          onComplete: text => {
            view.dataUpdate(_data => ({
              name: text,
            }));
          },
        },
        items: [
          {
            type: 'action',
            name: 'Edit View',
            icon: renderUniLit(this.getRenderer(id).icon, {}),
            select: () => {
              this.closest('affine-data-view-renderer')
                ?.querySelector('data-view-header-tools-view-options')
                ?.openMoreAction(target);
            },
          },
          {
            type: 'action',
            name: 'Move Left',
            hide: () => index === 0,
            icon: MoveLeftIcon(),
            select: () => {
              const targetId = views[index - 1];
              this.viewManager.moveTo(
                id,
                targetId ? { before: true, id: targetId } : 'start'
              );
            },
          },
          {
            type: 'action',
            name: 'Move Right',
            icon: MoveRightIcon(),
            hide: () => index === views.length - 1,
            select: () => {
              const targetId = views[index + 1];
              this.viewManager.moveTo(
                id,
                targetId ? { before: false, id: targetId } : 'end'
              );
            },
          },
          {
            type: 'action',
            name: 'Duplicate',
            icon: DuplicateIcon(),
            select: () => {
              this.viewManager.viewDuplicate(id);
            },
          },
          {
            type: 'group',
            name: '',
            children: () => [
              {
                type: 'action',
                name: 'Delete View',
                icon: DeleteIcon(),
                select: () => {
                  view.delete();
                },
                class: 'delete-item',
              },
            ],
          },
        ],
      },
    });
  };

  renderMore = (count: number) => {
    const views = this.viewManager.views$.value;
    if (count === views.length) {
      if (this.readonly) {
        return;
      }
      return html`<div
        class="database-view-button dv-icon-16 dv-hover"
        data-testid="database-add-view-button"
        @click="${this._addViewMenu}"
      >
        ${AddCursorIcon()}
      </div>`;
    }
    return html`
      <div class="database-view-button dv-hover" @click="${this._showMore}">
        ${views.length - count} More
      </div>
    `;
  };

  renderViews = () => {
    const views = this.viewManager.views$.value;
    return views.map(id => () => {
      const classList = classMap({
        'database-view-button': true,
        'dv-hover': true,
        active: this.viewManager.currentViewId$.value === id,
      });
      const view = this.viewManager.viewDataGet(id);
      return html`
        <div
          class="${classList}"
          style="margin-right: 4px;"
          @click="${(event: MouseEvent) => this._clickView(event, id)}"
        >
          <uni-lit class="icon" .uni="${this.getRenderer(id).icon}"></uni-lit>
          <div class="name">${view?.name}</div>
        </div>
      `;
    });
  };

  get readonly() {
    return this.viewManager.readonly$.value;
  }

  private getRenderer(viewId: string) {
    return this.dataSource.viewMetaGetById(viewId).renderer;
  }

  _clickView(event: MouseEvent, id: string) {
    if (this.viewManager.currentViewId$.value !== id) {
      this.viewManager.setCurrentView(id);
      return;
    }
    this.openViewOption(event.target as HTMLElement, id);
  }

  override render() {
    return html`
      <component-overflow
        .renderItem="${this.renderViews()}"
        .renderMore="${this.renderMore}"
      ></component-overflow>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-views': DataViewHeaderViews;
  }
}
