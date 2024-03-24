import type { ReferenceElement } from '@floating-ui/dom';
import { html } from 'lit';

import {
  type Menu,
  popFilterableSimpleMenu,
} from '../../../_common/components/menu/index.js';
import {
  DeleteIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '../../../_common/icons/index.js';
import type { RootBlockComponent } from '../../../root-block/types.js';
import type { DataViewColumnManager } from '../../common/data-view-manager.js';
import { popSideDetail } from '../../common/detail/layout.js';
import type { TableSelectionController } from '../controller/selection.js';
import {
  baseFormulas,
  type CalculationType,
  type IFormula,
  mathFormulas,
} from '../formulas.js';

export const openDetail = (
  rootElement: RootBlockComponent | null,
  rowId: string,
  selection: TableSelectionController
) => {
  const old = selection.selection;
  selection.selection = undefined;
  popSideDetail({
    rootElement,
    view: selection.host.view,
    rowId: rowId,
    onClose: () => {
      selection.selection = old;
    },
  });
};

export const popRowMenu = (
  rootElement: RootBlockComponent | null,
  ele: ReferenceElement,
  rowId: string,
  selection: TableSelectionController
) => {
  popFilterableSimpleMenu(ele, [
    {
      type: 'action',
      name: 'Expand Row',
      icon: ExpandFullIcon,
      select: () => {
        openDetail(rootElement, rowId, selection);
      },
    },
    // {
    //   type: 'group',
    //   name: '',
    //   children: () => [
    //     {
    //       type: 'action',
    //       name: 'Copy',
    //       icon: CopyIcon,
    //       select: () => {
    //         //TODO
    //       },
    //     },
    //     {
    //       type: 'action',
    //       name: 'Paste',
    //       icon: PasteIcon,
    //       select: () => {
    //         //TODO
    //       },
    //     },
    //   ],
    // },
    {
      type: 'group',
      name: '',
      children: () => [
        {
          type: 'action',
          name: 'Insert Before',
          icon: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveLeftIcon}
          </div>`,
          select: () => {
            selection.insertRowBefore(rowId);
          },
        },
        {
          type: 'action',
          name: 'Insert After',
          icon: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveRightIcon}
          </div>`,
          select: () => {
            selection.insertRowAfter(selection.selection?.groupKey, rowId);
          },
        },
        // {
        //   type: 'action',
        //   name: 'Duplicate',
        //   icon: DuplicateIcon,
        //   select: () => {
        //     selection.duplicateRow(rowId);
        //   },
        // },
      ],
    },
    {
      type: 'group',
      name: '',
      children: () => [
        {
          type: 'action',
          name: 'Delete Row',
          class: 'delete-item',
          icon: DeleteIcon,
          select: () => {
            selection.deleteRow(rowId);
          },
        },
      ],
    },
  ]);
};

export const popFormulaMenu = (
  _rootElement: RootBlockComponent | null,
  elem: ReferenceElement,
  _column: DataViewColumnManager,
  calcType: CalculationType,
  onSelect: (formula: IFormula) => void
) => {
  const formulas = calcType === 'math' ? mathFormulas : baseFormulas;
  const menus: Menu[] = formulas.map(f => ({
    type: 'action',
    name: f.label,
    select: () => {
      onSelect(f);
    },
  }));

  return popFilterableSimpleMenu(elem, menus);
};
