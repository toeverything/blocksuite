import { ZERO_WIDTH_SPACE } from '../constant.js';

export function calculateTextLength(text: Text): number {
  if (text.wholeText === ZERO_WIDTH_SPACE) {
    return 0;
  } else {
    return text.wholeText.length;
  }
}

export function getTextNodesFromElement(element: Element): Text[] {
  const textSpanElements = Array.from(
    element.querySelectorAll('[data-virgo-text="true"]')
  );
  const textNodes = textSpanElements.map(textSpanElement => {
    const textNode = Array.from(textSpanElement.childNodes).find(
      (node): node is Text => node instanceof Text
    );

    if (!textNode) {
      throw new Error('text node not found');
    }

    return textNode;
  });

  return textNodes;
}
