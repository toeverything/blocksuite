import { IS_IOS, IS_MAC } from '@blocksuite/global/env';

export function isTouchPadPinchEvent(e: WheelEvent) {
  // two finger pinches on touch pad, ctrlKey is always true.
  // https://bugs.chromium.org/p/chromium/issues/detail?id=397027
  if (IS_IOS || IS_MAC) {
    return e.ctrlKey || e.metaKey;
  }
  return e.ctrlKey;
}

// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
export enum MOUSE_BUTTONS {
  AUXILIARY = 4,
  FIFTH = 16,
  FORTH = 8,
  NO_BUTTON = 0,
  PRIMARY = 1,
  SECONDARY = 2,
}

export enum MOUSE_BUTTON {
  AUXILIARY = 1,
  FIFTH = 4,
  FORTH = 3,
  MAIN = 0,
  SECONDARY = 2,
}

export function isMiddleButtonPressed(e: MouseEvent) {
  return (MOUSE_BUTTONS.AUXILIARY & e.buttons) === MOUSE_BUTTONS.AUXILIARY;
}

export function isRightButtonPressed(e: MouseEvent) {
  return (MOUSE_BUTTONS.SECONDARY & e.buttons) === MOUSE_BUTTONS.SECONDARY;
}

export function stopPropagation(event: Event) {
  event.stopPropagation();
}

export function isControlledKeyboardEvent(e: KeyboardEvent) {
  return e.ctrlKey || e.metaKey || e.altKey;
}

export function on<
  T extends HTMLElement,
  K extends keyof M,
  M = HTMLElementEventMap,
>(
  element: T,
  event: K,
  handler: (ev: M[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function on<T extends HTMLElement>(
  element: T,
  event: string,
  handler: (ev: Event) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function on<T extends Document, K extends keyof M, M = DocumentEventMap>(
  element: T,
  event: K,
  handler: (ev: M[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function on<
  T extends HTMLElement | Document,
  K extends keyof HTMLElementEventMap,
>(
  element: T,
  event: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
) {
  const dispose = () => {
    element.removeEventListener(
      event as string,
      handler as unknown as EventListenerObject,
      options
    );
  };

  element.addEventListener(
    event as string,
    handler as unknown as EventListenerObject,
    options
  );

  return dispose;
}

export function once<
  T extends HTMLElement,
  K extends keyof M,
  M = HTMLElementEventMap,
>(
  element: T,
  event: K,
  handler: (ev: M[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function once<T extends HTMLElement>(
  element: T,
  event: string,
  handler: (ev: Event) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function once<
  T extends Document,
  K extends keyof M,
  M = DocumentEventMap,
>(
  element: T,
  event: K,
  handler: (ev: M[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function once<
  T extends HTMLElement,
  K extends keyof HTMLElementEventMap,
>(
  element: T,
  event: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
) {
  const onceHandler = (e: HTMLElementEventMap[K]) => {
    dispose();
    handler(e);
  };
  const dispose = () => {
    element.removeEventListener(event, onceHandler, options);
  };

  element.addEventListener(event, onceHandler, options);

  return dispose;
}

export function delayCallback(callback: () => void, delay: number = 0) {
  const timeoutId = setTimeout(callback, delay);

  return () => clearTimeout(timeoutId);
}

/**
 * A wrapper around `requestAnimationFrame` that only calls the callback if the
 * element is still connected to the DOM.
 */
export function requestConnectedFrame(
  callback: () => void,
  element?: HTMLElement
) {
  return requestAnimationFrame(() => {
    // If element is not provided, fallback to `requestAnimationFrame`
    if (element === undefined) {
      callback();
      return;
    }

    // Only calls callback if element is still connected to the DOM
    if (element.isConnected) callback();
  });
}

/**
 * A wrapper around `requestConnectedFrame` that only calls at most once in one frame
 */
export function requestThrottledConnectedFrame<
  T extends (...args: unknown[]) => void,
>(func: T, element?: HTMLElement): T {
  let raqId: number | undefined = undefined;
  let latestArgs: unknown[] = [];

  return ((...args: unknown[]) => {
    latestArgs = args;

    if (raqId) return;

    raqId = requestConnectedFrame(() => {
      raqId = undefined;
      func(...latestArgs);
    }, element);
  }) as T;
}

export const captureEventTarget = (target: EventTarget | null) => {
  const isElementOrNode = target instanceof Element || target instanceof Node;
  return isElementOrNode
    ? target instanceof Element
      ? target
      : target.parentElement
    : null;
};
