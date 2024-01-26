import { VElement, VLine } from '../components/index.js';

export function isNativeTextInVText(text: unknown): text is Text {
  return text instanceof Text && text.parentElement?.dataset.vText === 'true';
}

export function isVElement(element: unknown): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    (element.dataset.vElement === 'true' || element instanceof VElement)
  );
}

export function isVLine(element: unknown): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    (element instanceof VLine || element.parentElement instanceof VLine)
  );
}

export function isInlineRoot(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement && element.dataset.vRoot === 'true';
}
