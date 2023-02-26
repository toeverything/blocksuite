function findTextNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node;
  }
  // Try to find the text node in the child nodes
  for (let i = 0; i < node.childNodes.length; i++) {
    const textNode = findTextNode(node.childNodes[i]);
    if (textNode) {
      return textNode;
    }
  }
  return null;
}

/**
 * Find the next text node from the given node.
 *
 * Note: this function will skip the given node itself. And the boundary node will be included.
 */
function findNextTextNode(
  node: Node,
  checkWalkBoundary = (node: Node) => node === document.body
): Node | null {
  while (node.parentNode) {
    const parentNode = node.parentNode;
    if (!parentNode) {
      console.warn('Failed to find text node from node! no parent node', node);
      return null;
    }
    const nodeIdx = Array.from(parentNode.childNodes).indexOf(
      node as ChildNode
    );
    if (nodeIdx === -1) {
      console.warn('Failed to find text node from node! no node index', node);
      return null;
    }
    for (let i = nodeIdx + 1; i < parentNode.childNodes.length; i++) {
      const textNode = findTextNode(parentNode.childNodes[i]);
      if (textNode) {
        return textNode;
      }
    }

    if (checkWalkBoundary(parentNode)) {
      return null;
    }
    node = parentNode;
  }
  return null;
}

/**
 * Try to shift the range to the next caret point.
 * If the range is already at the end of the block, return null.
 *
 * NOTE: In extreme situations, this function need to traverse the DOM tree.
 * It may cause performance issues, so use it carefully.
 *
 * You can see the definition of the range in the spec for more details.
 * https://www.w3.org/TR/2000/REC-DOM-Level-2-Traversal-Range-20001113/ranges.html
 */
function shiftRange(range: Range): Range | null {
  if (!range.collapsed) {
    throw new Error('Failed to shift range! expected a collapsed range');
  }
  const startContainer = range.startContainer;

  // If the startNode is a Node of type Text, Comment, or CDataSection,
  // then startOffset is the number of characters from the start of startNode.
  // For other Node types, startOffset is the number of child nodes between the start of the startNode.
  // https://developer.mozilla.org/en-US/docs/Web/API/Range/setStart
  const isTextLikeNode =
    startContainer.nodeType === Node.TEXT_NODE ||
    startContainer.nodeType === Node.COMMENT_NODE ||
    startContainer.nodeType === Node.CDATA_SECTION_NODE;
  if (!isTextLikeNode) {
    // Although we can shift the range if the node is a not text node.
    // But in most normal situations, the node should be a text node.
    // To simplify the processing, we just skip the case.
    // If we really need to support this case, we can add it later.
    //
    // If in the empty line, the startContainer is a `<p><br></p>` node,
    // it's expected but hard to distinguish, so we remove the warning temporarily.
    // console.warn(
    //   'Failed to shiftRange! Unexpected startContainer nodeType',
    //   startContainer
    // );
    return null;
  }
  const textContent = startContainer.textContent;
  if (typeof textContent !== 'string') {
    // If the node is a `document` or a `doctype`, textContent returns `null`.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
    throw new Error('Failed to shift range! unexpected startContainer');
  }

  // const maxOffset = isTextLikeNode
  //   ? textContent.length
  //   : startContainer.childNodes.length;
  const maxOffset = textContent.length;

  if (maxOffset > range.startOffset) {
    // Just shift to the next character simply
    const nextRange = range.cloneRange();
    nextRange.setStart(range.startContainer, range.startOffset + 1);
    nextRange.setEnd(range.startContainer, range.startOffset + 1);
    return nextRange;
  }

  // If the range is already at the end of the node,
  // we need traverse the DOM tree to find the next text node.
  // And this may be inefficient.
  const nextTextNode = findNextTextNode(
    startContainer,
    (node: Node) =>
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable
      node instanceof HTMLElement && node.contentEditable === 'true'
  );
  if (!nextTextNode) {
    return null;
  }

  const nextRange = range.cloneRange();
  nextRange.setStart(nextTextNode, 0);
  nextRange.setEnd(nextTextNode, 0);
  return nextRange;
}

/**
 * It will return the next range if the cursor is at the edge of the block, otherwise return false.
 *
 * We should determine if the cursor is at the edge of the block, since a cursor at edge may have two cursor points
 * but only one bounding rect.
 * If a cursor is at the edge of a block, its previous cursor rect will not equal to the next one.
 *
 * See the following example:
 * ```markdown
 * long text| <- `range.getBoundingClientRect()` will return rect at here
 * |line wrap <- caret at the start of the second line
 * ```
 *
 * See https://stackoverflow.com/questions/59767515/incorrect-positioning-of-getboundingclientrect-after-newline-character
 */
export function isAtLineEdge(range: Range) {
  if (!range.collapsed) {
    // FIXME
    // console.warn(
    //   'Failed to determine if the caret is at line edge! expected a collapsed range but got',
    //   range
    // );
    return false;
  }
  const nextRange = shiftRange(range);
  if (!nextRange) {
    return false;
  }
  const nextRangeRect = nextRange.getBoundingClientRect();
  const noLineEdge = range.getBoundingClientRect().top === nextRangeRect.top;
  if (noLineEdge) {
    return false;
  }
  return nextRange;
}

export function checkFirstLine(range: Range, container: Element) {
  if (!range.collapsed) {
    throw new Error(
      'Failed to determine if the caret is at the first line! expected a collapsed range but got' +
        range
    );
  }
  if (!container.contains(range.commonAncestorContainer)) {
    throw new Error(
      'Failed to determine if the caret is at the first line! expected the range to be inside the container but got' +
        range +
        ' and ' +
        container
    );
  }
  const containerRect = container.getBoundingClientRect();
  const rangeRect = range.getBoundingClientRect();
  if (rangeRect.left === 0 && rangeRect.top === 0) {
    // Workaround select to empty line will get empty range
    // See https://w3c.github.io/csswg-drafts/cssom-view/#dom-range-getboundingclientrect
    // At empty line, it is the first line and also is the last line
    return true;
  }
  const lineHeight = rangeRect.height;
  // If the caret at the start of second line, as known as line edge,
  // the range bounding rect may be incorrect, we need to check the scenario.
  const isFirstLine =
    containerRect.top > rangeRect.top - lineHeight / 2 && !isAtLineEdge(range);
  return isFirstLine;
}

export function checkLastLine(range: Range, container: HTMLElement) {
  if (!range.collapsed) {
    throw new Error(
      'Failed to determine if the caret is at the last line! expected a collapsed range but got' +
        range
    );
  }
  if (!container.contains(range.commonAncestorContainer)) {
    throw new Error(
      'Failed to determine if the caret is at the first line! expected the range to be inside the container but got' +
        range +
        ' and ' +
        container
    );
  }
  const containerRect = container.getBoundingClientRect();
  const rangeRect = range.getBoundingClientRect();
  if (rangeRect.left === 0 && rangeRect.bottom === 0) {
    // Workaround select to empty line will get empty range
    // See https://w3c.github.io/csswg-drafts/cssom-view/#dom-range-getboundingclientrect
    // At empty line, it is the first line and also is the last line
    return true;
  }
  const lineHeight = rangeRect.height;
  const isLastLineWithoutEdge =
    rangeRect.bottom + lineHeight / 2 > containerRect.bottom;
  if (isLastLineWithoutEdge) {
    // If the caret is at the first line of the block,
    // default behavior will move the caret to the start of the line,
    // which is not expected. so we need to prevent default behavior.
    return true;
  }
  const atLineEdgeRange = isAtLineEdge(range);
  if (!atLineEdgeRange) {
    return false;
  }
  // If the caret is at the line edge, the range bounding rect is wrong,
  // we need to check the next range again.
  const nextRangeRect = atLineEdgeRange.getBoundingClientRect();
  const nextLineHeight = nextRangeRect.height;
  return nextRangeRect.bottom + nextLineHeight / 2 > containerRect.bottom;
}
