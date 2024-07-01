import '../../common/component/overflow/overflow.js';

import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import {
  popFilterableSimpleMenu,
  popMenu,
} from '../../../../_common/components/index.js';
import {
  AddCursorIcon,
  DuplicateIcon,
  MoreHorizontalIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '../../../../_common/icons/index.js';
import { DeleteIcon } from '../../common/icons/index.js';
import type { SingleViewSource } from '../../common/index.js';
import { renderUniLit } from '../../utils/uni-component/index.js';
import { WidgetBase } from '../widget-base.js';

@customElement('data-view-header-views')
export class DataViewHeaderViews extends WidgetBase {
  get readonly() {
    return this.viewSource.readonly;
  }

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
      max-width: 100px;
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

  private getRenderer(view: SingleViewSource) {
    return this.viewSource.getViewMeta(view.view.mode).renderer;
  }

  _addViewMenu = (event: MouseEvent) => {
    popFilterableSimpleMenu(
      event.target as HTMLElement,
      this.viewSource.allViewMeta.map(v => {
        return {
          type: 'action',
          name: v.model.defaultName,
          icon: html`<uni-lit .uni=${v.renderer.icon}></uni-lit>`,
          select: () => {
            const id = this.viewSource.viewAdd(v.type);
            this.viewSource.selectView(id);
          },
        };
      })
    );
  };

  _showMore = (event: MouseEvent) => {
    const views = this.viewSource.views;
    popFilterableSimpleMenu(event.target as HTMLElement, [
      ...views.map(v => {
        const openViewOption = (event: MouseEvent) => {
          event.stopPropagation();
          this.openViewOption(event.target as HTMLElement, v.view.id);
        };
        return {
          type: 'action' as const,
          icon: html`<uni-lit .uni=${this.getRenderer(v).icon}></uni-lit>`,
          name: v.view.name,
          isSelected: this.viewSource.currentViewId === v.view.id,
          select: () => {
            this.viewSource.selectView(v.view.id);
          },
          postfix: html`<div
            class="dv-hover dv-round-4"
            @click="${openViewOption}"
            style="display:flex;align-items:center;"
          >
            ${MoreHorizontalIcon}
          </div>`,
        };
      }),
      {
        type: 'group',
        name: '',
        hide: () => this.readonly,
        children: () =>
          this.viewSource.allViewMeta.map(v => {
            return {
              type: 'action',
              name: `Create ${v.model.defaultName}`,
              icon: html`<uni-lit .uni=${v.renderer.icon}></uni-lit>`,
              select: () => {
                const id = this.viewSource.viewAdd(v.type);
                this.viewSource.selectView(id);
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
    const views = this.viewSource.views;
    const index = views.findIndex(v => v.view.id === id);
    const view = views[index];
    if (!view) {
      return;
    }
    popMenu(target, {
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
            name: 'Edit View',
            icon: renderUniLit(this.getRenderer(view).icon, {}),
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
            icon: MoveLeftIcon,
            select: () => {
              const target = views[index - 1];
              this.viewSource.moveTo(
                view.view.id,
                target ? { before: true, id: target.view.id } : 'start'
              );
            },
          },
          {
            type: 'action',
            name: 'Move Right',
            icon: MoveRightIcon,
            hide: () => index === views.length - 1,
            select: () => {
              const target = views[index + 1];
              this.viewSource.moveTo(
                view.view.id,
                target ? { before: false, id: target.view.id } : 'end'
              );
            },
          },
          {
            type: 'action',
            name: 'Duplicate',
            icon: DuplicateIcon,
            select: () => {
              this.viewSource.duplicate(view.view.id);
            },
          },
          {
            type: 'group',
            name: '',
            children: () => [
              {
                type: 'action',
                name: 'Delete View',
                icon: DeleteIcon,
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

  _clickView(event: MouseEvent, id: string) {
    if (this.viewSource.currentViewId !== id) {
      this.viewSource.selectView(id);
      return;
    }
    this.openViewOption(event.target as HTMLElement, id);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.viewSource.updateSlot.on(() => {
        this.requestUpdate();
      })
    );
  }

  renderMore = (count: number) => {
    const views = this.viewSource.views;
    if (count === views.length) {
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
        ${views.length - count} More
      </div>
    `;
  };

  renderViews = () => {
    const views = this.viewSource.views;
    return views.map(view => () => {
      const classList = classMap({
        'database-view-button': true,
        'dv-hover': true,
        active: this.viewSource.currentViewId === view.view.id,
      });
      return html`
        <div
          class="${classList}"
          style="margin-right: 4px;"
          @click="${(event: MouseEvent) =>
            this._clickView(event, view.view.id)}"
        >
          <uni-lit class="icon" .uni="${this.getRenderer(view).icon}"></uni-lit>
          <div class="name">${view.view.name}</div>
        </div>
      `;
    });
  };

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
