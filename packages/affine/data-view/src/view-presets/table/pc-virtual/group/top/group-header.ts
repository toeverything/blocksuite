import {
  menu,
  popFilterableSimpleMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { computed } from '@preact/signals-core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';

import { TableViewAreaSelection } from '../../../selection';
import type { VirtualTableView } from '../../table-view';
import type { TableGridGroup } from '../../types';
import * as styles from './group-header.css';
import { GroupTitle } from './group-title';
export class TableGroupHeader extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  @property({ attribute: false })
  accessor tableView!: VirtualTableView;

  @property({ attribute: false })
  accessor gridGroup!: TableGridGroup;

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(styles.groupHeader);
    this.disposables.addFromEvent(this, 'mouseenter', () => {
      this.gridGroup.data.headerHover$.value = true;
    });
    this.disposables.addFromEvent(this, 'mouseleave', () => {
      this.gridGroup.data.headerHover$.value = false;
    });
  }

  group$ = computed(() => {
    return this.tableView.groupTrait$.value?.groupsDataList$.value?.find(
      g => g.key === this.gridGroup.groupId
    );
  });

  groupKey$ = computed(() => {
    return this.group$.value?.key;
  });

  get tableViewManager() {
    return this.tableView.props.view;
  }

  get selectionController() {
    return this.tableView.selectionController;
  }

  private readonly clickAddRowInStart = () => {
    const group = this.group$.value;
    if (!group) {
      return;
    }
    this.tableViewManager.rowAdd('start', group.key);
    const selectionController = this.selectionController;
    selectionController.selection = undefined;
    requestAnimationFrame(() => {
      const index = this.tableViewManager.properties$.value.findIndex(
        v => v.type$.value === 'title'
      );
      selectionController.selection = TableViewAreaSelection.create({
        groupKey: group.key,
        focus: {
          rowIndex: 0,
          columnIndex: index,
        },
        isEditing: true,
      });
    });
  };

  private readonly clickGroupOptions = (e: MouseEvent) => {
    const group = this.group$.value;
    if (!group) {
      return;
    }
    const ele = e.currentTarget as HTMLElement;
    popFilterableSimpleMenu(popupTargetFromElement(ele), [
      menu.action({
        name: 'Ungroup',
        hide: () => group.value == null,
        select: () => {
          group.rows.forEach(id => {
            group.manager.removeFromGroup(id, group.key);
          });
        },
      }),
      menu.action({
        name: 'Delete Cards',
        select: () => {
          this.tableViewManager.rowDelete(group.rows);
        },
      }),
    ]);
  };

  private readonly renderGroupHeader = () => {
    const group = this.group$.value;
    if (!group) {
      return null;
    }
    return html`
      <div
        style="position: sticky;left: 0;width: max-content;padding: 6px 0;margin-bottom: 4px;display:flex;align-items:center;gap: 12px;max-width: 400px"
      >
        ${GroupTitle(group, {
          groupHover: this.gridGroup.data.headerHover$.value,
          readonly: this.tableViewManager.readonly$.value,
          clickAdd: this.clickAddRowInStart,
          clickOps: this.clickGroupOptions,
        })}
      </div>
    `;
  };

  override render() {
    return html`
      ${this.renderGroupHeader()}
      <virtual-table-header
        .tableViewManager="${this.tableViewManager}"
      ></virtual-table-header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'virtual-table-group-header': TableGroupHeader;
  }
}
