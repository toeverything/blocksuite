import type { ReadonlySignal } from '@preact/signals-core';

import {
  menu,
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
        menu.group({
          items: [
            () => {
              const view = props.view;
              const onChange = view.filterSet.bind(view);
              return html` <microsheet-filter-root-view
                .onBack=${props.onBack}
                .vars="${view.vars$}"
                .filterGroup="${view.filter$}"
                .onChange="${onChange}"
              ></microsheet-filter-root-view>`;
            },
          ],
        }),
        menu.group({
          items: [
            menu.action({
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
            }),
          ],
        }),
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
        menu.group({
          items: [
            () => {
              return html` <microsheet-filter-group-view
                .vars="${props.vars}"
                .filterGroup="${props.value$}"
                .onChange="${props.onChange}"
              ></microsheet-filter-group-view>`;
            },
          ],
        }),
        menu.group({
          items: [
            menu.action({
              name: 'Delete',
              class: 'delete-item',
              prefix: DeleteIcon(),
              select: () => {
                props.onChange();
              },
            }),
          ],
        }),
      ],
    },
  });
};
