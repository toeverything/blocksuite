import {
  menu,
  popMenu,
  type PopupTarget,
} from '@blocksuite/affine-components/context-menu';

import { renderUniLit } from '../utils/index.js';
import type { SortUtils } from './utils.js';

export const popCreateSort = (
  target: PopupTarget,
  props: {
    sortUtils: SortUtils;
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
      items: [
        menu.group({
          items: props.sortUtils.vars$.value
            .filter(
              v =>
                !props.sortUtils.sortList$.value.some(
                  sort => sort.ref.name === v.id
                )
            )
            .map(v =>
              menu.action({
                name: v.name,
                prefix: renderUniLit(v.icon, {}),
                select: () => {
                  props.sortUtils.add({
                    ref: {
                      type: 'ref',
                      name: v.id,
                    },
                    desc: false,
                  });
                },
              })
            ),
        }),
      ],
    },
  });
};
