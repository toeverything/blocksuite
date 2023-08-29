import { assertExists } from '@blocksuite/global/utils';

export interface MenuPopper<T extends HTMLElement> {
  element: T;
  dispose: () => void;
}

export function createPopper<T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  reference: HTMLElement,
  options?: {
    x: number;
    y: number;
  }
): MenuPopper<HTMLElementTagNameMap[T]> {
  const menu = document.createElement(tagName);
  assertExists(reference.shadowRoot);
  reference.shadowRoot.appendChild(menu);
  // TODO - apply enter transition

  // TODO - calculate x and y automatically
  const x = options?.x ?? 0;
  const y = options?.y ?? 0;

  Object.assign(menu.style, {
    left: `${x}px`,
    top: `${y}px`,
  });

  return {
    element: menu,
    dispose: () => {
      // TODO - apply leave transition
      menu.remove();
    },
  };
}
