import { assertExists } from '@blocksuite/global/utils';

// more than 100% due to the shadow
const leaveToPercent = `calc(100% + 10px)`;

export interface MenuPopper<T extends HTMLElement> {
  element: T;
  dispose: () => void;
  cancel?: () => void;
}

// store active poppers
const popMap = new WeakMap<HTMLElement, Map<string, MenuPopper<HTMLElement>>>();

function animateEnter(el: HTMLElement) {
  el.style.transform = 'translateY(0)';
}
function animateLeave(el: HTMLElement) {
  el.style.transform = `translateY(${leaveToPercent})`;
}

export function createPopper<T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  reference: HTMLElement,
  options?: {
    x?: number;
    y?: number;
    /** transition duration in ms */
    duration?: number;
  }
) {
  const duration = options?.duration ?? 230;

  if (!popMap.has(reference)) popMap.set(reference, new Map());
  const elMap = popMap.get(reference);
  assertExists(elMap);
  // if there is already a popper, cancel leave transition and apply enter transition
  if (elMap.has(tagName)) {
    const popper = elMap.get(tagName);
    assertExists(popper);
    popper.cancel?.();
    requestAnimationFrame(() => animateEnter(popper.element));
    return popper;
  }

  const menu = document.createElement(tagName);
  assertExists(reference.shadowRoot);
  reference.shadowRoot.appendChild(menu);

  // apply enter transition
  menu.style.transition = `transform ${duration}ms ease`;
  animateLeave(menu);
  requestAnimationFrame(() => animateEnter(menu));

  // TODO - calculate x and y automatically
  const x = options?.x ?? 0;
  const y = options?.y ?? 0;

  Object.assign(menu.style, {
    left: `${x}px`,
    top: `${y}px`,
  });

  const remove = () => {
    menu.remove();
    popMap.get(reference)?.delete(tagName);
  };

  const popper: MenuPopper<HTMLElementTagNameMap[T]> = {
    element: menu,
    dispose: function () {
      // apply leave transition
      animateLeave(menu);
      menu.addEventListener('transitionend', remove, { once: true });
      popper.cancel = () => menu.removeEventListener('transitionend', remove);
    },
  };

  popMap.get(reference)?.set(tagName, popper);
  return popper;
}
