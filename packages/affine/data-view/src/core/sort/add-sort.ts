import type { ReadonlySignal } from '@preact/signals-core';

import {
  menu,
  popMenu,
  type PopupTarget,
} from '@blocksuite/affine-components/context-menu';

import type { Variable } from '../expression/index.js';
import type { SortBy } from './types.js';

import { renderUniLit } from '../utils/index.js';

export const popCreateSort = (
  target: PopupTarget,
  props: {
    vars: ReadonlySignal<Variable[]>;
    onSelect: (sort: SortBy) => void;
    onClose?: () => void;
    onBack?: () => void;
  }
) => {
  popMenu(target, {
    options: {
      onClose: props.onClose,
      title: {
        text: 'New sort',
        onBack: props.onBack,
      },
      items: props.vars.value.map(v =>
        menu.action({
          name: v.name,
          prefix: renderUniLit(v.icon, {}),
          select: () => {
            props.onSelect({
              ref: {
                type: 'ref',
                name: v.id,
              },
              desc: false,
            });
          },
        })
      ),
    },
  });
};
