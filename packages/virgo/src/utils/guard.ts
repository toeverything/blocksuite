import { VirgoElement, VirgoLine } from '../components/index.js';

export function isNativeTextInVText(text: unknown): text is Text {
  return (
    text instanceof Text &&
    (text.parentElement?.dataset.virgoText === 'true' ?? false)
  );
}

export function isVElement(element: unknown): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    (element.dataset.virgoElement === 'true' || element instanceof VirgoElement)
  );
}

export function isVLine(element: unknown): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    (element instanceof VirgoLine || element.parentElement instanceof VirgoLine)
  );
}

export function isVRoot(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement && element.dataset.virgoRoot === 'true';
}

export function isInEmbedElement(node: Node): boolean {
  if (node instanceof Element) {
    if (node instanceof VirgoElement) {
      return node.querySelector('[data-virgo-embed="true"]') !== null;
    }
    const vElement = node.closest('[data-virgo-embed="true"]');
    return !!vElement;
  } else {
    const vElement = node.parentElement?.closest('[data-virgo-embed="true"]');
    return !!vElement;
  }
}

export function isInEmbedGap(node: Node): boolean {
  if (node instanceof Element) {
    const vText = node.closest('[data-virgo-text="true"]');
    if (vText && (vText as HTMLElement).dataset.virgoEmbedGap === 'true') {
      return true;
    }
    return false;
  } else {
    const vText = node.parentElement?.closest('[data-virgo-text="true"]');
    if (vText && (vText as HTMLElement).dataset.virgoEmbedGap === 'true') {
      return true;
    }
    return false;
  }
}
