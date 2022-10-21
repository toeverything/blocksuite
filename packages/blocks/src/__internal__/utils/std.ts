import type { BaseBlockModel } from '@blocksuite/store';
import type { Detail } from './types';

export function assertExists<T>(val: T | null | undefined): asserts val is T {
  if (!val) throw new Error('val does not exist');
}

export function assertFlavours(model: BaseBlockModel, allowed: string[]) {
  if (!allowed.includes(model.flavour)) {
    throw new Error(`model flavour ${model.flavour} is not allowed`);
  }
}

export function caretRangeFromPoint(x: number, y: number) {
  return document.caretRangeFromPoint(x, y);
}

export function fixCurrentRangeToText(
  x: number,
  y: number,
  range: Range,
  isForward: boolean
) {
  const endContainer = isForward ? range.endContainer : range.startContainer;
  let newRange: Range | null = range;
  if (endContainer.nodeType !== Node.TEXT_NODE) {
    const texts = Array.from(
      (range.commonAncestorContainer as HTMLElement).querySelectorAll(
        '.ql-editor'
      )
    );
    if (texts.length) {
      let text: Element | undefined = undefined;
      if (isForward) {
        text = texts.reverse().find(t => {
          const rect = t.getBoundingClientRect();
          return y >= rect.bottom;
        });
        if (text) {
          const rect = text.getBoundingClientRect();
          const y = rect.bottom - 6;
          newRange = caretRangeFromPoint(x, y);
          if (newRange) {
            range.setEnd(newRange.endContainer, newRange.endOffset);
          }
        }
      } else {
        text = texts.find(t => {
          const rect = t.getBoundingClientRect();
          return y <= rect.top;
        });
        if (text) {
          const rect = text.getBoundingClientRect();
          const y = rect.top + 6;
          newRange = caretRangeFromPoint(x, y);
          if (newRange) {
            range.setStart(newRange.endContainer, newRange.endOffset);
          }
        }
      }
    }
  }
  return range;
}

export function createEvent<
  T extends keyof WindowEventMap | keyof HTMLElementEventMap
>(type: T, detail: Detail<T>) {
  return new CustomEvent<Detail<T>>(type, { detail });
}

export function noop() {
  return;
}

/**
 * Sleep is not a good practice.
 * Please use it sparingly!
 */
export const sleep = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));
