import { autoPlacement, computePosition } from '@floating-ui/dom';

import { onClickOutside } from '../utils.js';

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
  }).then(({ x, y }) => {
    Object.assign(content.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });
  onClickOutside(
    content,
    () => {
      content.remove();
      options?.onClose?.();
    },
    'mousedown'
  );
};
