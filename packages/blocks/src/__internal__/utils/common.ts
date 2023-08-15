import { matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import type { Detail } from './types.js';

/**
 * Whether the block supports rendering its children.
 */
export function supportsChildren(model: BaseBlockModel): boolean {
  if (
    matchFlavours(model, [
      // 'affine:database',
      'affine:image',
      'affine:divider',
      'affine:code',
    ])
  ) {
    return false;
  }
  if (
    matchFlavours(model, ['affine:paragraph']) &&
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'quote'].includes(model.type ?? '')
  ) {
    return false;
  }
  return true;
}

export function isEmpty(model: BaseBlockModel): boolean {
  if (model.flavour === 'affine:database') return model.children.length === 0;
  if (model.children.length !== 0) {
    const found = model.children.find(c => !isEmpty(c));
    return !found;
  }
  return (
    !model.text?.length &&
    !model.sourceId &&
    model.flavour !== 'affine:code' &&
    model.flavour !== 'affine:bookmark'
  );
}

export function createEvent<
  T extends keyof WindowEventMap | keyof HTMLElementEventMap
>(type: T, detail: Detail<T>) {
  return new CustomEvent<Detail<T>>(type, { detail });
}

export function isControlledKeyboardEvent(e: KeyboardEvent) {
  return e.ctrlKey || e.metaKey || e.altKey;
}

export function on<
  T extends HTMLElement,
  K extends keyof M,
  M = HTMLElementEventMap
>(
  element: T,
  event: K,
  handler: (ev: M[K]) => void,
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
  K extends keyof HTMLElementEventMap
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
  M = HTMLElementEventMap
>(
  element: T,
  event: K,
  handler: (ev: M[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function once<
  T extends Document,
  K extends keyof M,
  M = DocumentEventMap
>(
  element: T,
  event: K,
  handler: (ev: M[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function once<
  T extends HTMLElement,
  K extends keyof HTMLElementEventMap
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
