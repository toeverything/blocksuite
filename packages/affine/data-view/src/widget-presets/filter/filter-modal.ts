import type { ReadonlySignal } from '@preact/signals-core';

import {
  popMenu,
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { DeleteIcon, PlusIcon } from '@blocksuite/icons/lit';
import { html } from 'lit';

import type { SingleView } from '../../core/index.js';

import {
  emptyFilterGroup,
  type FilterGroup,
  type Variable,
} from '../../core/common/ast.js';
import { popAddNewFilter } from './condition.js';

export const popFilterRoot = (
  target: PopupTarget,
  props: {
    view: SingleView;
    onBack: () => void;
  }
) => {
  popMenu(target, {
    options: {
      title: {
        text: 'Filters',
        onBack: props.onBack,
      },
      items: [
        {
          type: 'group',
          items: [
            {
              type: 'custom',
              render: () => {
                const view = props.view;
                const onChange = view.filterSet.bind(view);
                return html` <filter-root-view
                  .onBack=${props.onBack}
                  .vars="${view.vars$}"
                  .filterGroup="${view.filter$}"
                  .onChange="${onChange}"
                ></filter-root-view>`;
              },
            },
          ],
        },
        {
          type: 'group',
          items: [
            {
              type: 'action',
              name: 'Add',
              prefix: PlusIcon(),
              select: ele => {
                const view = props.view;
                const vars = view.vars$.value;
                const value = view.filter$.value ?? emptyFilterGroup;
                const onChange = view.filterSet.bind(view);
                popAddNewFilter(popupTargetFromElement(ele), {
                  value: value,
                  onChange: onChange,
                  vars: vars,
                });
                return false;
              },
            },
          ],
        },
      ],
    },
  });
};
export const popFilterGroup = (
  target: PopupTarget,
  props: {
    vars: ReadonlySignal<Variable[]>;
    value$: ReadonlySignal<FilterGroup>;
    onChange: (value?: FilterGroup) => void;
    onBack?: () => void;
  }
) => {
  popMenu(target, {
    options: {
      title: {
        text: 'Filter group',
        onBack: props.onBack,
      },
      items: [
        {
          type: 'group',
          items: [
            {
              type: 'custom',
              render: () => {
                return html` <filter-group-view
                  .vars="${props.vars}"
                  .filterGroup="${props.value$}"
                  .onChange="${props.onChange}"
                ></filter-group-view>`;
              },
            },
          ],
        },
        {
          type: 'group',
          items: [
            {
              type: 'action',
              name: 'Delete',
              class: 'delete-item',
              prefix: DeleteIcon(),
              select: () => {
                props.onChange();
              },
            },
          ],
        },
      ],
    },
  });
};
