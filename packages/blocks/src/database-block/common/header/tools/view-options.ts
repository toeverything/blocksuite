import { DeleteIcon, MoreHorizontalIcon } from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, svg } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { popMenu } from '../../../../components/menu/menu.js';
import { DataViewKanbanManager } from '../../../kanban/kanban-view-manager.js';
import { popPropertiesSetting } from '../../properties.js';

export const viewOpIcons = {
  properties: svg`<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path fill-rule='evenodd' clip-rule='evenodd' d='M17.2917 4.99998C17.2917 5.34516 17.0118 5.62498 16.6667 5.62498L8.87207 5.62498C8.60002 6.58686 7.71565 7.29165 6.66667 7.29165C5.61769 7.29165 4.73332 6.58686 4.46127 5.62498L3.33334 5.62498C2.98816 5.62498 2.70834 5.34516 2.70834 4.99998C2.70834 4.6548 2.98816 4.37498 3.33334 4.37498L4.46127 4.37498C4.73332 3.4131 5.61769 2.70831 6.66667 2.70831C7.71565 2.70831 8.60002 3.4131 8.87208 4.37498L16.6667 4.37498C17.0118 4.37498 17.2917 4.6548 17.2917 4.99998ZM17.2917 9.99998C17.2917 10.3452 17.0118 10.625 16.6667 10.625L15.5387 10.625C15.2667 11.5869 14.3823 12.2916 13.3333 12.2916C12.2844 12.2916 11.4 11.5869 11.1279 10.625L3.33334 10.625C2.98816 10.625 2.70834 10.3452 2.70834 9.99998C2.70834 9.6548 2.98816 9.37498 3.33334 9.37498L11.1279 9.37498C11.4 8.4131 12.2844 7.70831 13.3333 7.70831C14.3823 7.70831 15.2667 8.4131 15.5387 9.37498L16.6667 9.37498C17.0118 9.37498 17.2917 9.6548 17.2917 9.99998ZM17.2917 15C17.2917 15.3452 17.0118 15.625 16.6667 15.625L8.87207 15.625C8.60002 16.5869 7.71565 17.2916 6.66667 17.2916C5.61769 17.2916 4.73332 16.5869 4.46127 15.625L3.33334 15.625C2.98816 15.625 2.70834 15.3452 2.70834 15C2.70834 14.6548 2.98816 14.375 3.33334 14.375L4.46127 14.375C4.73332 13.4131 5.61769 12.7083 6.66667 12.7083C7.71565 12.7083 8.60002 13.4131 8.87207 14.375L16.6667 14.375C17.0118 14.375 17.2917 14.6548 17.2917 15ZM14.375 9.99998C14.375 9.42468 13.9086 8.95831 13.3333 8.95831C12.758 8.95831 12.2917 9.42468 12.2917 9.99998C12.2917 10.5753 12.758 11.0416 13.3333 11.0416C13.9086 11.0416 14.375 10.5753 14.375 9.99998ZM7.70834 4.99998C7.70834 4.42468 7.24197 3.95831 6.66667 3.95831C6.09138 3.95831 5.62501 4.42468 5.62501 4.99998C5.62501 5.57528 6.09138 6.04165 6.66667 6.04165C7.24197 6.04165 7.70834 5.57528 7.70834 4.99998ZM7.70834 15C7.70834 14.4247 7.24197 13.9583 6.66667 13.9583C6.09138 13.9583 5.62501 14.4247 5.62501 15C5.62501 15.5753 6.09138 16.0416 6.66667 16.0416C7.24197 16.0416 7.70834 15.5753 7.70834 15Z' fill='#77757D'/>
</svg>

`,
  filter: svg`<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path fill-rule='evenodd' clip-rule='evenodd' d='M3.125 10C3.125 6.20304 6.20304 3.125 10 3.125C13.797 3.125 16.875 6.20304 16.875 10C16.875 13.797 13.797 16.875 10 16.875C6.20304 16.875 3.125 13.797 3.125 10ZM10 1.875C5.51269 1.875 1.875 5.51269 1.875 10C1.875 14.4873 5.51269 18.125 10 18.125C14.4873 18.125 18.125 14.4873 18.125 10C18.125 5.51269 14.4873 1.875 10 1.875ZM6.66667 7.29167C6.32149 7.29167 6.04167 7.57149 6.04167 7.91667C6.04167 8.26184 6.32149 8.54167 6.66667 8.54167H13.3333C13.6785 8.54167 13.9583 8.26184 13.9583 7.91667C13.9583 7.57149 13.6785 7.29167 13.3333 7.29167H6.66667ZM6.875 10.4167C6.875 10.0715 7.15482 9.79167 7.5 9.79167H12.5C12.8452 9.79167 13.125 10.0715 13.125 10.4167C13.125 10.7618 12.8452 11.0417 12.5 11.0417H7.5C7.15482 11.0417 6.875 10.7618 6.875 10.4167ZM9.16667 12.2917C8.82149 12.2917 8.54167 12.5715 8.54167 12.9167C8.54167 13.2618 8.82149 13.5417 9.16667 13.5417H10.8333C11.1785 13.5417 11.4583 13.2618 11.4583 12.9167C11.4583 12.5715 11.1785 12.2917 10.8333 12.2917H9.16667Z' fill='#77757D'/>
</svg>

`,
  groupBy: svg`<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
<path fill-rule='evenodd' clip-rule='evenodd' d='M2.29167 4.99998C2.29167 3.73433 3.31769 2.70831 4.58334 2.70831H7.50001H12.5H15.4167C16.6823 2.70831 17.7083 3.73433 17.7083 4.99998V15C17.7083 16.2656 16.6823 17.2916 15.4167 17.2916H4.58334C3.31769 17.2916 2.29167 16.2656 2.29167 15V4.99998ZM11.875 3.95831H8.12501V16.0416H11.875V3.95831ZM13.125 16.0416V3.95831H15.4167C15.992 3.95831 16.4583 4.42468 16.4583 4.99998V15C16.4583 15.5753 15.992 16.0416 15.4167 16.0416H13.125ZM4.58334 3.95831H6.87501V16.0416H4.58334C4.00804 16.0416 3.54167 15.5753 3.54167 15V4.99998C3.54167 4.42468 4.00804 3.95831 4.58334 3.95831Z' fill='#77757D'/>
</svg>

`,
};
const styles = css`
  .affine-database-toolbar-item.more-action {
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .affine-database-toolbar-item.more-action:hover {
    background: var(--affine-hover-color);
  }

  .affine-database-toolbar-item.more-action svg {
    width: 20px;
    height: 20px;
    fill: var(--affine-icon-color);
  }

  .more-action.active {
    background: var(--affine-hover-color);
  }
`;

@customElement('data-view-header-tools-view-options')
export class DataViewHeaderToolsViewOptions extends WithDisposable(
  ShadowlessElement
) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;

  @query('.more-action')
  private _moreActionContainer!: HTMLDivElement;

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  private _clickMoreAction = () => {
    this.showToolBar(true);
    popMenu(this._moreActionContainer, {
      options: {
        input: {
          initValue: this.view.name,
          onComplete: text => {
            this.view.updateName(text);
          },
        },
        items: [
          // {
          //   type: 'sub-menu',
          //   name: 'Layout',
          //   icon: viewOpIcons.groupBy,
          //   hide: () => !(this.view instanceof DataViewKanbanManager),
          //   options: {
          //     input: {
          //       search: true,
          //       placeholder: 'Search',
          //     },
          //     items: this.view.columnsWithoutFilter.map(id => {
          //       const column = this.view.columnGet(id);
          //       return {
          //         type: 'action',
          //         name: column.name,
          //         select: () => {
          //           this.view.changeGroup(id);
          //         },
          //       };
          //     }),
          //   },
          // },
          {
            type: 'action',
            name: 'Properties',
            icon: viewOpIcons.properties,
            select: () => {
              popPropertiesSetting(this._moreActionContainer, {
                view: this.view,
              });
            },
          },
          {
            type: 'action',
            name: 'Filter',
            hide: () =>
              !this.closest(
                'affine-database'
              )?.root.page.awarenessStore.getFlag('enable_database_filter'),
            icon: viewOpIcons.filter,
            select: () => {
              //
            },
          },
          {
            type: 'sub-menu',
            name: 'Group By',
            icon: viewOpIcons.groupBy,
            hide: () => !(this.view instanceof DataViewKanbanManager),
            options: {
              input: {
                search: true,
                placeholder: 'Search',
              },
              items: this.view.columnsWithoutFilter.map(id => {
                const column = this.view.columnGet(id);
                return {
                  type: 'action',
                  name: column.name,
                  select: () => {
                    this.view.changeGroup(id);
                  },
                };
              }),
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
                  //
                },
                class: 'delete-item',
              },
            ],
          },
        ],
        onClose: () => {
          this.showToolBar(false);
        },
      },
    });
  };

  override render() {
    return html` <div
      class="affine-database-toolbar-item more-action"
      @click="${this._clickMoreAction}"
    >
      ${MoreHorizontalIcon}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-view-options': DataViewHeaderToolsViewOptions;
  }
}
