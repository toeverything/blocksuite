import { VirgoLine } from '../components/index.js';

export function isVText(text: unknown): text is Text {
  return (
    text instanceof Text &&
    (text.parentElement?.dataset.virgoText === 'true' ?? false)
  );
}

export function isVElement(element: unknown): element is HTMLElement {
  return (
    element instanceof HTMLElement && element.dataset.virgoElement === 'true'
  );
}

export function isVLine(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement && element instanceof VirgoLine;
}

export function isVRoot(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement && element.dataset.virgoRoot === 'true';
}
