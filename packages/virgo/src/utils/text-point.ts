import type { VirgoLine } from '../components/index.js';
import { ZERO_WIDTH_SPACE } from '../constant.js';
import type { DomPoint, TextPoint } from '../types.js';
import { isVElement, isVLine, isVRoot, isVText } from './guard.js';
import { calculateTextLength, getTextNodesFromElement } from './text.js';

export function nativePointToTextPoint(
  node: unknown,
  offset: number
): TextPoint | null {
  if (isVText(node)) {
    return [node, offset];
  }

  if (isVElement(node)) {
    const texts = getTextNodesFromElement(node);
    let textOffset = offset;
    for (const text of texts) {
      if (offset <= text.length) {
        return [text, textOffset];
      }
      textOffset -= text.length;
    }
    return null;
  }

  if (isVLine(node) || isVRoot(node)) {
    const texts = getTextNodesFromElement(node);
    if (texts.length > 0) {
      const [text] = texts;
      return [text, offset === 0 ? offset : text.length];
    }
    return null;
  }

  if (!(node instanceof Node)) {
    return null;
  }

  const vLine = node.parentElement?.closest('v-line');

  if (vLine) {
    return handleInVLine(vLine, node, offset);
  }

  const container =
    node instanceof Element
      ? node.closest('[data-virgo-root="true"]')
      : node.parentElement?.closest('[data-virgo-root="true"]');

  if (container) {
    return handleOutVLine(container, node, offset);
  }

  return null;
}

export function textPointToDomPoint(
  text: Text,
  offset: number,
  rootElement: HTMLElement
): DomPoint | null {
  if (rootElement.dataset.virgoRoot !== 'true') {
    throw new Error(
      'textRangeToDomPoint should be called with editor root element'
    );
  }

  if (!rootElement.contains(text)) {
    return null;
  }

  const texts = getTextNodesFromElement(rootElement);
  const goalIndex = texts.indexOf(text);
  let index = 0;
  for (const text of texts.slice(0, goalIndex)) {
    index += calculateTextLength(text);
  }

  if (text.wholeText !== ZERO_WIDTH_SPACE) {
    index += offset;
  }

  const textParentElement = text.parentElement;
  if (!textParentElement) {
    throw new Error('text element parent not found');
  }

  const lineElement = textParentElement.closest('v-line');

  if (!lineElement) {
    throw new Error('line element not found');
  }

  const lineIndex = Array.from(rootElement.querySelectorAll('v-line')).indexOf(
    lineElement
  );

  return { text, index: index + lineIndex };
}

function handleInVLine(
  vLine: VirgoLine,
  node: Node,
  offset: number
): TextPoint | null {
  const vElements = Array.from(vLine.querySelectorAll('v-element'));
  for (let i = 0; i < vElements.length; i++) {
    const vElement = vElements[i];

    if (i === 0 && AFollowedByB(node, vElement)) {
      const texts = getTextNodesFromElement(vElement);
      if (texts.length === 0) return null;
      const [text] = texts;
      return [text, offset === 0 ? offset : text.length];
    }

    if (AInsideB(node, vElement)) {
      const texts = getTextNodesFromElement(vElements[0]);
      if (texts.length === 0) return null;
      const text = texts[texts.length - 1];
      return [text, offset === 0 ? offset : text.length];
    }

    if (i === vElements.length - 1 && APrecededByB(node, vElement)) {
      const texts = getTextNodesFromElement(vElement);
      if (texts.length === 0) return null;
      const text = texts[texts.length - 1];
      return [text, calculateTextLength(text)];
    }

    if (
      i < vElements.length - 1 &&
      APrecededByB(node, vElement) &&
      AFollowedByB(node, vElements[i + 1])
    ) {
      const texts = getTextNodesFromElement(vElement);
      if (texts.length === 0) return null;
      const text = texts[texts.length - 1];
      return [text, calculateTextLength(text)];
    }
  }

  return null;
}

function handleOutVLine(
  container: Element,
  node: Node,
  offset: number
): TextPoint | null {
  const vLines = Array.from(container.querySelectorAll('v-line'));
  for (let i = 0; i < vLines.length; i++) {
    const vLine = vLines[i];

    if (i === 0 && AFollowedByB(node, vLine)) {
      const texts = getTextNodesFromElement(vLine);
      if (texts.length === 0) return null;
      const [text] = texts;
      return [text, offset === 0 ? offset : text.length];
    }

    if (AInsideB(node, vLine)) {
      const texts = getTextNodesFromElement(vLines[0]);
      if (texts.length === 0) return null;
      const text = texts[texts.length - 1];
      return [text, offset === 0 ? offset : text.length];
    }

    if (i === vLines.length - 1 && APrecededByB(node, vLine)) {
      const texts = getTextNodesFromElement(vLine);
      if (texts.length === 0) return null;
      const text = texts[texts.length - 1];
      return [text, calculateTextLength(text)];
    }

    if (
      i < vLines.length - 1 &&
      APrecededByB(node, vLine) &&
      AFollowedByB(node, vLines[i + 1])
    ) {
      const texts = getTextNodesFromElement(vLine);
      if (texts.length === 0) return null;
      const text = texts[texts.length - 1];
      return [text, calculateTextLength(text)];
    }
  }

  return null;
}

function AInsideB(a: Node, b: Node): boolean {
  return (
    a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_CONTAINED_BY ||
    a.compareDocumentPosition(b) === 20
  );
}

function AFollowedByB(a: Node, b: Node): boolean {
  return a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_FOLLOWING;
}

function APrecededByB(a: Node, b: Node): boolean {
  return a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_PRECEDING;
}
