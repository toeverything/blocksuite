import type * as Y from 'yjs';

import type { VRange } from '../types.js';
import {
  nativePointToTextPoint,
  textPointToDomPoint,
} from './point-conversion.js';
import { isSelectionBackwards } from './selection.js';
import { calculateTextLength, getTextNodesFromElement } from './text.js';

type VRangeRunnerContext = {
  rootElement: HTMLElement;
  selection: Selection;
  yText: Y.Text;
  anchorNode: Node | null;
  anchorOffset: number;
  anchorText: Text;
  anchorTextOffset: number;
  focusNode: Node | null;
  focusOffset: number;
  focusText: Text;
  focusTextOffset: number;
};

type Predict = (context: VRangeRunnerContext) => boolean;
type Handler = (context: VRangeRunnerContext) => VRange | null;

const rangeHasAnchorAndFocus: Predict = ({
  rootElement,
  anchorText,
  focusText,
}) => {
  return rootElement.contains(anchorText) && rootElement.contains(focusText);
};

const rangeHasAnchorAndFocusHandler: Handler = ({
  rootElement,
  anchorText,
  focusText,
  anchorTextOffset,
  focusTextOffset,
}) => {
  const anchorDomPoint = textPointToDomPoint(
    anchorText,
    anchorTextOffset,
    rootElement
  );
  const focusDomPoint = textPointToDomPoint(
    focusText,
    focusTextOffset,
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

const rangeOnlyHasFocus: Predict = ({ rootElement, anchorText, focusText }) => {
  return !rootElement.contains(anchorText) && rootElement.contains(focusText);
};

const rangeOnlyHasFocusHandler: Handler = ({
  selection,
  yText,
  rootElement,
  anchorText,
  focusText,
  anchorTextOffset,
  focusTextOffset,
}) => {
  if (isSelectionBackwards(selection)) {
    const anchorDomPoint = textPointToDomPoint(
      anchorText,
      anchorTextOffset,
      rootElement
    );

    if (!anchorDomPoint) {
      return null;
    }

    return {
      index: anchorDomPoint.index,
      length: yText.length - anchorDomPoint.index,
    };
  } else {
    const focusDomPoint = textPointToDomPoint(
      focusText,
      focusTextOffset,
      rootElement
    );

    if (!focusDomPoint) {
      return null;
    }

    return {
      index: 0,
      length: focusDomPoint.index,
    };
  }
};

const rangeOnlyHasAnchor: Predict = ({
  rootElement,
  anchorText,
  focusText,
}) => {
  return rootElement.contains(anchorText) && !rootElement.contains(focusText);
};

const rangeOnlyHasAnchorHandler: Handler = ({
  selection,
  yText,
  rootElement,
  anchorText,
  focusText,
  anchorTextOffset,
  focusTextOffset,
}) => {
  if (isSelectionBackwards(selection)) {
    const focusDomPoint = textPointToDomPoint(
      focusText,
      focusTextOffset,
      rootElement
    );

    if (!focusDomPoint) {
      return null;
    }

    return {
      index: 0,
      length: focusDomPoint.index,
    };
  } else {
    const anchorDomPoint = textPointToDomPoint(
      anchorText,
      anchorTextOffset,
      rootElement
    );

    if (!anchorDomPoint) {
      return null;
    }

    return {
      index: anchorDomPoint.index,
      length: yText.length - anchorDomPoint.index,
    };
  }
};

const rangeHasNoAnchorAndFocus: Predict = ({
  rootElement,
  anchorText,
  focusText,
}) => {
  return !rootElement.contains(anchorText) && !rootElement.contains(focusText);
};

const rangeHasNoAnchorAndFocusHandler: Handler = ({ yText }) => {
  return {
    index: 0,
    length: yText.length,
  };
};

const buildContext = (
  selection: Selection,
  rootElement: HTMLElement,
  yText: Y.Text
): VRangeRunnerContext | null => {
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;

  const anchorTextPoint = nativePointToTextPoint(anchorNode, anchorOffset);
  const focusTextPoint = nativePointToTextPoint(focusNode, focusOffset);

  if (!anchorTextPoint || !focusTextPoint) {
    return null;
  }

  const [anchorText, anchorTextOffset] = anchorTextPoint;
  const [focusText, focusTextOffset] = focusTextPoint;

  return {
    rootElement,
    selection,
    yText,
    anchorNode,
    anchorOffset,
    focusNode,
    focusOffset,
    anchorText,
    anchorTextOffset,
    focusText,
    focusTextOffset,
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
  selection: Selection,
  rootElement: HTMLElement,
  yText: Y.Text
): VRange | null {
  const context = buildContext(selection, rootElement, yText);

  if (!context) return null;

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
  let anchorText: Text | null = null;
  let focusText: Text | null = null;
  let anchorOffset = 0;
  let focusOffset = 0;
  let index = 0;

  for (let i = 0; i < lineElements.length; i++) {
    if (anchorText && focusText) {
      break;
    }

    const texts = getTextNodesFromElement(lineElements[i]);
    for (const text of texts) {
      const textLength = calculateTextLength(text);

      if (!anchorText && index + textLength >= vRange.index) {
        anchorText = text;
        anchorOffset = vRange.index - index;
      }
      if (!focusText && index + textLength >= vRange.index + vRange.length) {
        focusText = text;
        focusOffset = vRange.index + vRange.length - index;
      }

      if (anchorText && focusText) {
        break;
      }

      index += textLength;
    }

    // the one because of the line break
    index += 1;
  }

  if (!anchorText || !focusText) {
    return null;
  }

  const range = document.createRange();
  range.setStart(anchorText, anchorOffset);
  range.setEnd(focusText, focusOffset);

  return range;
}
