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

export function isInEmbedElement(node: Node): boolean {
  if (node instanceof Element) {
    if (node instanceof VElement) {
      return node.querySelector('[data-v-embed="true"]') !== null;
    }
    const vElement = node.closest('[data-v-embed="true"]');
    return !!vElement;
  } else {
    const vElement = node.parentElement?.closest('[data-v-embed="true"]');
    return !!vElement;
  }
}

export function isInEmbedGap(node: Node): boolean {
  if (node instanceof Element) {
    const vText = node.closest('[data-v-text="true"]');
    if (vText && (vText as HTMLElement).dataset.vEmbedGap === 'true') {
      return true;
    }
    return false;
  } else {
    const vText = node.parentElement?.closest('[data-v-text="true"]');
    if (vText && (vText as HTMLElement).dataset.vEmbedGap === 'true') {
      return true;
    }
    return false;
  }
}
