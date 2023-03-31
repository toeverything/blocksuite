import type { VirgoElement, VirgoLine } from '../components/index.js';
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
    return getTextPointFromElementByOffset(node, offset, true);
  }

  if (!(node instanceof Node)) {
    return null;
  }

  const vNodes = getVNodesFromNode(node);

  if (vNodes) {
    return getTextPointFromVNodes(vNodes, node, offset);
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

function getVNodesFromNode(node: Node): VirgoElement[] | VirgoLine[] | null {
  const vLine = node.parentElement?.closest('v-line');

  if (vLine) {
    return Array.from(vLine.querySelectorAll('v-element'));
  }

  const container =
    node instanceof Element
      ? node.closest('[data-virgo-root="true"]')
      : node.parentElement?.closest('[data-virgo-root="true"]');

  if (container) {
    return Array.from(container.querySelectorAll('v-line'));
  }

  return null;
}

function getTextPointFromVNodes(
  vNodes: VirgoLine[] | VirgoElement[],
  node: Node,
  offset: number
): TextPoint | null {
  const first = vNodes[0];
  for (let i = 0; i < vNodes.length; i++) {
    const vLine = vNodes[i];

    if (i === 0 && AFollowedByB(node, vLine)) {
      return getTextPointFromElementByOffset(first, offset, true);
    }

    if (AInsideB(node, vLine)) {
      return getTextPointFromElementByOffset(first, offset, false);
    }

    if (i === vNodes.length - 1 && APrecededByB(node, vLine)) {
      return getTextPointFromElement(vLine);
    }

    if (
      i < vNodes.length - 1 &&
      APrecededByB(node, vLine) &&
      AFollowedByB(node, vNodes[i + 1])
    ) {
      return getTextPointFromElement(vLine);
    }
  }

  return null;
}

function getTextPointFromElement(element: Element): TextPoint | null {
  const texts = getTextNodesFromElement(element);
  if (texts.length === 0) return null;
  const text = texts[texts.length - 1];
  return [text, calculateTextLength(text)];
}

function getTextPointFromElementByOffset(
  element: Element,
  offset: number,
  fromStart: boolean
): TextPoint | null {
  const texts = getTextNodesFromElement(element);
  if (texts.length === 0) return null;
  const text = fromStart ? texts[0] : texts[texts.length - 1];
  return [text, offset === 0 ? offset : text.length];
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
