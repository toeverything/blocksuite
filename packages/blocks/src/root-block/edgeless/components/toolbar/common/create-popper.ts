import { assertExists } from '@blocksuite/global/utils';

// more than 100% due to the shadow
const leaveToPercent = `calc(100% + 10px)`;

export interface MenuPopper<T extends HTMLElement> {
  cancel?: () => void;
  dispose: () => void;
  element: T;
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
    /** transition duration in ms */
    duration?: number;
    onDispose?: () => void;
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
    return popper as MenuPopper<HTMLElementTagNameMap[T]>;
  }

  const clipWrapper = document.createElement('div');
  const menu = document.createElement(tagName);
  assertExists(reference.shadowRoot);
  clipWrapper.append(menu);
  reference.shadowRoot.append(clipWrapper);

  // apply enter transition
  menu.style.transition = `all ${duration}ms ease`;
  animateLeave(menu);
  requestAnimationFrame(() => animateEnter(menu));

  Object.assign(clipWrapper.style, {
    alignItems: 'end',
    bottom: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    height: '100px',
    left: '0px',
    maxWidth: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
  });

  Object.assign(menu.style, {
    bottom: '0%',
    marginLeft: '30px',
    maxWidth: 'calc(100% - 60px)',
    pointerEvents: 'auto',
    width: '100%',
  });
  const remove = () => {
    clipWrapper.remove();
    menu.remove();
    popMap.get(reference)?.delete(tagName);
    options?.onDispose?.();
  };

  const popper: MenuPopper<HTMLElementTagNameMap[T]> = {
    dispose: function () {
      // apply leave transition
      animateLeave(menu);
      menu.addEventListener('transitionend', remove, { once: true });
      popper.cancel = () => menu.removeEventListener('transitionend', remove);
    },
    element: menu,
  };

  popMap.get(reference)?.set(tagName, popper);
  return popper;
}
