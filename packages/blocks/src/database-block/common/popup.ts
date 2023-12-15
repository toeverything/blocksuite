import { autoPlacement, computePosition } from '@floating-ui/dom';

import { onClickOutside } from '../utils/utils.js';

export const createDatabasePopup = (
  target: HTMLElement,
  content: HTMLElement,
  options?: {
    onClose?: () => void;
  }
) => {
  target.parentElement?.append(content);
  computePosition(target, content, {
    middleware: [autoPlacement()],
  })
    .then(({ x, y }) => {
      Object.assign(content.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    })
    .catch(console.error);
  onClickOutside(
    content,
    () => {
      content.remove();
      options?.onClose?.();
    },
    'mousedown'
  );
};
