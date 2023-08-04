import type * as Y from 'yjs';

import { VirgoElement } from '../components/virgo-element.js';
import type { VRange } from '../types.js';
import { isInEmbedElement } from './guard.js';
import {
  nativePointToTextPoint,
  textPointToDomPoint,
} from './point-conversion.js';
import { calculateTextLength, getTextNodesFromElement } from './text.js';

type VRangeRunnerContext = {
  rootElement: HTMLElement;
  range: Range;
  yText: Y.Text;
  startNode: Node | null;
  startOffset: number;
  startText: Text;
  startTextOffset: number;
  endNode: Node | null;
  endOffset: number;
  endText: Text;
  endTextOffset: number;
};

type Predict = (context: VRangeRunnerContext) => boolean;
type Handler = (context: VRangeRunnerContext) => VRange | null;

const rangeHasAnchorAndFocus: Predict = ({
  rootElement,
  startText,
  endText,
}) => {
  return rootElement.contains(startText) && rootElement.contains(endText);
};

const rangeHasAnchorAndFocusHandler: Handler = ({
  rootElement,
  startText,
  endText,
  startTextOffset,
  endTextOffset,
}) => {
  const anchorDomPoint = textPointToDomPoint(
    startText,
    startTextOffset,
    rootElement
  );
  const focusDomPoint = textPointToDomPoint(
    endText,
    endTextOffset,
    rootElement
  );

  if (!anchorDomPoint || !focusDomPoint) {
    return null;
  }

  return {
    index: Math.min(anchorDomPoint.index, focusDomPoint.index),
    length: Math.abs(anchorDomPoint.index - focusDomPoint.index),
  };
};

const rangeOnlyHasFocus: Predict = ({ rootElement, startText, endText }) => {
  return !rootElement.contains(startText) && rootElement.contains(endText);
};

const rangeOnlyHasFocusHandler: Handler = ({
  rootElement,
  endText,
  endTextOffset,
}) => {
  const focusDomPoint = textPointToDomPoint(
    endText,
    endTextOffset,
    rootElement
  );

  if (!focusDomPoint) {
    return null;
  }

  return {
    index: 0,
    length: focusDomPoint.index,
  };
};

const rangeOnlyHasAnchor: Predict = ({ rootElement, startText, endText }) => {
  return rootElement.contains(startText) && !rootElement.contains(endText);
};

const rangeOnlyHasAnchorHandler: Handler = ({
  yText,
  rootElement,
  startText,
  startTextOffset,
}) => {
  const startDomPoint = textPointToDomPoint(
    startText,
    startTextOffset,
    rootElement
  );

  if (!startDomPoint) {
    return null;
  }

  return {
    index: startDomPoint.index,
    length: yText.length - startDomPoint.index,
  };
};

const rangeHasNoAnchorAndFocus: Predict = ({
  rootElement,
  startText,
  endText,
  range,
}) => {
  return (
    !rootElement.contains(startText) &&
    !rootElement.contains(endText) &&
    range.intersectsNode(rootElement)
  );
};

const rangeHasNoAnchorAndFocusHandler: Handler = ({ yText }) => {
  return {
    index: 0,
    length: yText.length,
  };
};

const buildContext = (
  range: Range,
  rootElement: HTMLElement,
  yText: Y.Text
): VRangeRunnerContext | null => {
  const { startContainer, startOffset, endContainer, endOffset } = range;

  const startTextPoint = nativePointToTextPoint(startContainer, startOffset);
  const endTextPoint = nativePointToTextPoint(endContainer, endOffset);

  if (!startTextPoint || !endTextPoint) {
    return null;
  }

  const [startText, startTextOffset] = startTextPoint;
  const [endText, endTextOffset] = endTextPoint;

  return {
    rootElement,
    range,
    yText,
    startNode: startContainer,
    startOffset,
    endNode: endContainer,
    endOffset,
    startText,
    startTextOffset,
    endText,
    endTextOffset,
  };
};

/**
 * calculate the vRange from dom selection for **this Editor**
 * there are three cases when the vRange of this Editor is not null:
 * (In the following, "|" mean anchor and focus, each line is a separate Editor)
 * 1. anchor and focus are in this Editor
 *    aaaaaa
 *    b|bbbb|b
 *    cccccc
 *    the vRange of second Editor is {index: 1, length: 4}, the others are null
 * 2. anchor and focus one in this Editor, one in another Editor
 *    aaa|aaa    aaaaaa
 *    bbbbb|b or bbbbb|b
 *    cccccc     cc|cccc
 *    2.1
 *        the vRange of first Editor is {index: 3, length: 3}, the second is {index: 0, length: 5},
 *        the third is null
 *    2.2
 *        the vRange of first Editor is null, the second is {index: 5, length: 1},
 *        the third is {index: 0, length: 2}
 * 3. anchor and focus are in another Editor
 *    aa|aaaa
 *    bbbbbb
 *    cccc|cc
 *    the vRange of first Editor is {index: 2, length: 4},
 *    the second is {index: 0, length: 6}, the third is {index: 0, length: 4}
 */
export function domRangeToVirgoRange(
  range: Range,
  rootElement: HTMLElement,
  yText: Y.Text
): VRange | null {
  const context = buildContext(range, rootElement, yText);

  if (!context) return null;

  // handle embed
  if (
    context.startNode &&
    context.startNode === context.endNode &&
    isInEmbedElement(context.startNode)
  ) {
    const anchorDomPoint = textPointToDomPoint(
      context.startText,
      context.startTextOffset,
      rootElement
    );

    if (anchorDomPoint) {
      return {
        index: anchorDomPoint.index,
        length: 1,
      };
    }
  }

  // case 1
  if (rangeHasAnchorAndFocus(context)) {
    return rangeHasAnchorAndFocusHandler(context);
  }

  // case 2.1
  if (rangeOnlyHasFocus(context)) {
    return rangeOnlyHasFocusHandler(context);
  }

  // case 2.2
  if (rangeOnlyHasAnchor(context)) {
    return rangeOnlyHasAnchorHandler(context);
  }

  // case 3
  if (rangeHasNoAnchorAndFocus(context)) {
    return rangeHasNoAnchorAndFocusHandler(context);
  }

  return null;
}

/**
 * calculate the dom selection from vRange for **this Editor**
 */
export function virgoRangeToDomRange(
  rootElement: HTMLElement,
  vRange: VRange
): Range | null {
  const lineElements = Array.from(rootElement.querySelectorAll('v-line'));

  // calculate anchorNode and focusNode
  let startText: Text | null = null;
  let endText: Text | null = null;
  let anchorOffset = 0;
  let focusOffset = 0;
  let index = 0;

  for (let i = 0; i < lineElements.length; i++) {
    if (startText && endText) {
      break;
    }

    const texts = getTextNodesFromElement(lineElements[i]);
    for (const text of texts) {
      const textLength = calculateTextLength(text);

      if (!startText && index + textLength >= vRange.index) {
        startText = text;
        anchorOffset = vRange.index - index;
      }
      if (!endText && index + textLength >= vRange.index + vRange.length) {
        endText = text;
        focusOffset = vRange.index + vRange.length - index;
      }

      if (startText && endText) {
        break;
      }

      index += textLength;
    }

    // the one because of the line break
    index += 1;
  }

  if (!startText || !endText) {
    return null;
  }

  if (isInEmbedElement(startText)) {
    const anchorVElement = startText.parentElement?.closest('v-element');
    if (!anchorVElement) {
      throw new Error(
        'failed to find vElement for a text note in an embed element'
      );
    }
    const nextSibling = anchorVElement.nextElementSibling;
    if (!nextSibling) {
      throw new Error('failed to find nextSibling sibling of an embed element');
    }
    if (nextSibling instanceof VirgoElement) {
      const texts = getTextNodesFromElement(nextSibling);
      startText = texts[texts.length - 1];
      anchorOffset = calculateTextLength(startText);
    } else {
      // nextSibling is a gap
      startText = nextSibling.childNodes.item(1) as Text;
      anchorOffset = 0;
    }
  }
  if (isInEmbedElement(endText)) {
    const focusVElement = endText.parentElement?.closest('v-element');
    if (!focusVElement) {
      throw new Error(
        'failed to find vElement for a text note in an embed element'
      );
    }
    const nextSibling = focusVElement.nextElementSibling;
    if (!nextSibling) {
      throw new Error('failed to find nextSibling sibling of an embed element');
    }

    if (nextSibling instanceof VirgoElement) {
      const texts = getTextNodesFromElement(nextSibling);
      endText = texts[0];
      focusOffset = 0;
    } else {
      // nextSibling is a gap
      endText = nextSibling.childNodes.item(1) as Text;
      focusOffset = 0;
    }
  }

  const range = document.createRange();
  range.setStart(startText, anchorOffset);
  range.setEnd(endText, focusOffset);

  return range;
}
