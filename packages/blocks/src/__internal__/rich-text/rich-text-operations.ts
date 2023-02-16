// operations used in rich-text level

import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import {
  assertExists,
  caretRangeFromPoint,
  matchFlavours,
} from '@blocksuite/global/utils';
import { BaseBlockModel, Page, Text } from '@blocksuite/store';
import { Utils } from '@blocksuite/store';
import type { Quill } from 'quill';

import type { PageBlockModel } from '../../models.js';
import {
  asyncFocusRichText,
  convertToDivider,
  convertToList,
  convertToParagraph,
  ExtendedModel,
  focusBlockByModel,
  focusTitle,
  getCurrentRange,
  getModelByElement,
  getPreviousBlock,
  getRichTextByModel,
  supportsChildren,
} from '../utils/index.js';

export function handleBlockEndEnter(page: Page, model: ExtendedModel) {
  const parent = page.getParent(model);
  if (!parent) {
    return;
  }
  if (Utils.doesInsideBlockByFlavour(page, model, 'affine:database')) {
    // todo: jump into next row
    return;
  }
  const index = parent.children.indexOf(model);
  if (index === -1) {
    return;
  }
  // make adding text block by enter a standalone operation
  page.captureSync();

  const shouldInheritFlavour = matchFlavours(model, ['affine:list']);
  const blockProps = shouldInheritFlavour
    ? {
        flavour: model.flavour,
        type: model.type,
      }
    : {
        flavour: 'affine:paragraph',
        type: 'text',
      };

  const id = !model.children.length
    ? page.addBlock(blockProps, parent, index + 1)
    : // If the block has children, insert a new block as the first child
      page.addBlock(blockProps, model, 0);

  asyncFocusRichText(page, id);
}

export function handleSoftEnter(
  page: Page,
  model: ExtendedModel,
  index: number,
  length: number
) {
  if (!model.text) {
    console.error('Failed to handle soft enter! No text found!', model);
    return;
  }
  page.captureSync();
  model.text.replace(index, length, '\n');
}

export function handleBlockSplit(
  page: Page,
  model: ExtendedModel,
  splitIndex: number,
  splitLength: number
) {
  if (!(model.text instanceof Text)) return;

  const parent = page.getParent(model);
  if (!parent) return;

  page.captureSync();
  const right = model.text.split(splitIndex, splitLength);

  let newParent = parent;
  let newBlockIndex = newParent.children.indexOf(model) + 1;
  if (matchFlavours(model, ['affine:list']) && model.children.length > 0) {
    newParent = model;
    newBlockIndex = 0;
  }
  const children = [...model.children];
  page.updateBlockById(model.id, { children: [] });
  const id = page.addBlockByFlavour(
    model.flavour,
    {
      text: right,
      type: model.type,
      children,
    },
    newParent,
    newBlockIndex
  );
  asyncFocusRichText(page, id);
}

/**
 * Move down
 * @example
 * ```
 * [ ]
 *  └─ [ ]
 * [x]     <- tab
 *  └─ [ ]
 *
 * ↓
 *
 * [ ]
 *  ├─ [ ]
 *  ├─ [x] <-
 *  └─ [ ]
 * ```
 */
export function handleIndent(page: Page, model: ExtendedModel, offset = 0) {
  const previousSibling = page.getPreviousSibling(model);
  if (!previousSibling || !supportsChildren(previousSibling)) {
    // Bottom, can not indent, do nothing
    return;
  }

  const parent = page.getParent(model);
  if (!parent) return;
  page.captureSync();

  // 1. backup target block children and remove them from target block
  const children = model.children;
  page.updateBlock(model, {
    children: [],
  });

  // 2. remove target block from parent block
  page.updateBlock(parent, {
    children: parent.children.filter(child => child.id !== model.id),
  });

  // 3. append target block and children to previous sibling block
  page.updateBlock(previousSibling, {
    children: [...previousSibling.children, model, ...children],
  });

  // FIXME: after quill onload
  requestAnimationFrame(() => {
    assertExists(model);
    const richText = getRichTextByModel(model);
    richText?.quill.setSelection(offset, 0);
  });
}

export function handleMultiBlockIndent(page: Page, models: BaseBlockModel[]) {
  const previousSibling = page.getPreviousSibling(models[0]);

  if (!previousSibling || !supportsChildren(previousSibling)) {
    // Bottom, can not indent, do nothing
    return;
  }
  if (
    !models.every((model, idx, array) => {
      const previousModel = array.at(idx - 1);
      if (!previousModel) {
        return false;
      }
      const p1 = page.getParent(model);
      const p2 = page.getParent(previousModel);
      return p1 && p2 && p1.id === p2.id;
    })
  ) {
    return;
  }
  page.captureSync();
  const parent = page.getParent(models[0]);
  assertExists(parent);
  models.forEach(model => {
    // 1. backup target block children and remove them from target block
    const children = model.children;
    page.updateBlock(model, {
      children: [],
    });

    // 2. remove target block from parent block
    page.updateBlock(parent, {
      children: parent.children.filter(child => child.id !== model.id),
    });

    // 3. append target block and children to previous sibling block
    page.updateBlock(previousSibling, {
      children: [...previousSibling.children, model, ...children],
    });

    // FIXME: after quill onload
    requestAnimationFrame(() => {
      assertExists(model);
      const richText = getRichTextByModel(model);
      richText?.quill.setSelection(0, 0);
    });
  });
}

/**
 * Move up
 * @example
 * ```
 * [ ]
 *  ├─ [ ]
 *  ├─ [x] <- shift + tab
 *  └─ [ ]
 *
 * ↓
 *
 * [ ]
 *  └─ [ ]
 * [x]     <-
 *  └─ [ ]
 * ```
 * Refer to https://github.com/toeverything/AFFiNE/blob/b59b010decb9c5decd9e3090f1a417696ce86f54/libs/components/editor-blocks/src/utils/indent.ts#L23-L122
 */
export function handleUnindent(page: Page, model: ExtendedModel, offset = 0) {
  const parent = page.getParent(model);
  if (!parent || matchFlavours(parent, ['affine:frame'])) {
    // Topmost, do nothing
    return;
  }

  const grandParent = page.getParent(parent);
  if (!grandParent) return;
  page.captureSync();

  // 1. save child blocks of the parent block
  const previousSiblings = page.getPreviousSiblings(model);
  const nextSiblings = page.getNextSiblings(model);
  // 2. remove all child blocks after the target block from the parent block
  page.updateBlock(parent, {
    children: previousSiblings,
  });

  // 3. append child blocks after the target block to the target block
  page.updateBlock(model, {
    children: [...model.children, ...nextSiblings],
  });

  // 4. insert target block to the grand block
  const index = grandParent.children.indexOf(parent);
  page.updateBlock(grandParent, {
    children: [
      ...grandParent.children.slice(0, index + 1),
      model,
      ...grandParent.children.slice(index + 1),
    ],
  });

  // FIXME: after quill onload
  requestAnimationFrame(() => {
    assertExists(model);
    const richText = getRichTextByModel(model);
    richText?.quill.setSelection(offset, 0);
  });
}

export function handleLineStartBackspace(page: Page, model: ExtendedModel) {
  // When deleting at line start of a code block,
  // select the code block itself
  if (matchFlavours(model, ['affine:code'])) {
    focusBlockByModel(model);
    return;
  }
  if (Utils.doesInsideBlockByFlavour(page, model, 'affine:database')) {
    // Forbid user to delete a block inside database block
    return;
  }

  // When deleting at line start of a list block,
  // switch it to normal paragraph block.
  if (matchFlavours(model, ['affine:list'])) {
    const parent = page.getParent(model);
    if (!parent) return;

    const index = parent.children.indexOf(model);
    const blockProps = {
      type: 'text' as const,
      text: model.text?.clone(),
      children: model.children,
    };
    page.captureSync();
    page.deleteBlock(model);
    const id = page.addBlockByFlavour(
      'affine:paragraph',
      blockProps,
      parent,
      index
    );
    asyncFocusRichText(page, id);
    return;
  }

  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (matchFlavours(model, ['affine:paragraph'])) {
    if (model.type !== 'text') {
      // Try to switch to normal text
      page.captureSync();
      page.updateBlock(model, { type: 'text' });
      return;
    }

    const parent = page.getParent(model);
    if (!parent || matchFlavours(parent, ['affine:frame'])) {
      const previousSibling = getPreviousBlock(model);
      const previousSiblingParent = previousSibling
        ? page.getParent(previousSibling)
        : null;
      if (
        previousSiblingParent &&
        matchFlavours(previousSiblingParent, ['affine:database'])
      ) {
        window.requestAnimationFrame(() => {
          focusBlockByModel(previousSiblingParent, 'end');
          // We can not delete block if the block has content
          if (!model.text?.length) {
            page.captureSync();
            page.deleteBlock(model);
          }
        });
      } else if (
        previousSibling &&
        matchFlavours(previousSibling, ['affine:paragraph', 'affine:list'])
      ) {
        page.captureSync();
        const preTextLength = previousSibling.text?.length || 0;
        model.text?.length && previousSibling.text?.join(model.text as Text);
        page.deleteBlock(model, {
          bringChildrenTo: previousSibling,
        });
        const richText = getRichTextByModel(previousSibling);
        richText?.quill?.setSelection(preTextLength, 0);
      } else if (
        previousSibling &&
        matchFlavours(previousSibling, [
          'affine:embed',
          'affine:divider',
          'affine:code',
        ])
      ) {
        window.requestAnimationFrame(() => {
          focusBlockByModel(previousSibling);
          // We can not delete block if the block has content
          if (!model.text?.length) {
            page.captureSync();
            page.deleteBlock(model);
          }
        });
      } else {
        // No previous sibling, it's the first block
        // Try to merge with the title

        const text = model.text;
        const titleElement = document.querySelector(
          '.affine-default-page-block-title'
        ) as HTMLTextAreaElement;
        const pageModel = getModelByElement(titleElement) as PageBlockModel;
        const title = pageModel.title;

        page.captureSync();
        if (text) {
          title.join(text);
        }
        page.deleteBlock(model);
        focusTitle(title.length);
      }
    }

    // Before
    // - line1
    //   - | <- cursor here, press backspace
    //   - line3
    //
    // After
    // - line1
    // - | <- cursor here
    //   - line3
    handleUnindent(page, model);
    return;
  }

  throw new Error(
    'Failed to handle backspace! Unknown block flavours! flavour:' +
      model.flavour
  );
}

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
    console.warn(
      'Failed to determine if the caret is at line edge! expected a collapsed range but got',
      range
    );
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

function checkFirstLine(range: Range, container: Element) {
  if (!range.collapsed) {
    throw new Error(
      'Failed to determine if the caret is at the last line! expected a collapsed range but got' +
        range
    );
  }
  const { height, left, top } = range.getBoundingClientRect();
  if (left === 0 && top === 0) {
    // Workaround select to empty line will get empty range
    // See https://w3c.github.io/csswg-drafts/cssom-view/#dom-range-getboundingclientrect

    // At empty line, it is the first line and also is the last line
    return true;
  }
  const shiftRange = caretRangeFromPoint(left + 1, top - height / 2);
  // If the caret at the start of second line, as known as line edge,
  // the range bounding rect may be incorrect, we need to check the scenario.
  const isFirstLine =
    (!shiftRange || !container.contains(shiftRange.startContainer)) &&
    !isAtLineEdge(range);
  return isFirstLine;
}

function checkLastLine(range: Range, container: HTMLElement) {
  if (!range.collapsed) {
    throw new Error(
      'Failed to determine if the caret is at the last line! expected a collapsed range but got' +
        range
    );
  }
  const { bottom, left, height } = range.getBoundingClientRect();
  if (left === 0 && bottom === 0) {
    // Workaround select to empty line will get empty range
    // See https://w3c.github.io/csswg-drafts/cssom-view/#dom-range-getboundingclientrect

    // At empty line, it is the first line and also is the last line
    return true;
  }
  const shiftRange = caretRangeFromPoint(left + 1, bottom + height / 2);
  const isLastLineWithoutEdge =
    !shiftRange || !container.contains(shiftRange.startContainer);
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
  const nextRect = atLineEdgeRange.getBoundingClientRect();
  const nextShiftRange = caretRangeFromPoint(
    nextRect.left + 1,
    nextRect.bottom + nextRect.height / 2
  );
  return !nextShiftRange || !container.contains(nextShiftRange.startContainer);
}

export function handleKeyUp(event: KeyboardEvent, editableContainer: Element) {
  const range = getCurrentRange();
  if (!range.collapsed) {
    // If the range is not collapsed,
    // we assume that the caret is at the start of the range.
    range.collapse(true);
  }
  const isFirstLine = checkFirstLine(range, editableContainer);
  if (isFirstLine) {
    // If the caret is at the first line of the block,
    // default behavior will move the caret to the start of the line,
    // which is not expected. so we need to prevent default behavior.
    return PREVENT_DEFAULT;
  }
  // Avoid triggering hotkey bindings
  event.stopPropagation();
  return ALLOW_DEFAULT;
}

export function handleKeyDown(
  event: KeyboardEvent,
  editableContainer: HTMLElement
) {
  const range = getCurrentRange();
  if (!range.collapsed) {
    // If the range is not collapsed,
    // we assume that the caret is at the end of the range.
    range.collapse();
  }
  const isLastLine = checkLastLine(range, editableContainer);
  if (isLastLine) {
    // If the caret is at the last line of the block,
    // default behavior will move the caret to the end of the line,
    // which is not expected. so we need to prevent default behavior.
    return PREVENT_DEFAULT;
  }
  // Avoid triggering hotkey bindings
  event.stopPropagation();
  return ALLOW_DEFAULT;
}

export function tryMatchSpaceHotkey(
  page: Page,
  model: ExtendedModel,
  quill: Quill,
  prefix: string,
  range: { index: number; length: number }
) {
  const [, offset] = quill.getLine(range.index);
  if (offset > prefix.length) {
    return ALLOW_DEFAULT;
  }
  if (matchFlavours(model, ['affine:code'])) {
    return ALLOW_DEFAULT;
  }
  let isConverted = false;
  switch (prefix.trim()) {
    case '[]':
    case '[ ]':
      isConverted = convertToList(page, model, 'todo', prefix, {
        checked: false,
      });
      break;
    case '[x]':
      isConverted = convertToList(page, model, 'todo', prefix, {
        checked: true,
      });
      break;
    case '-':
    case '*':
      isConverted = convertToList(page, model, 'bulleted', prefix);
      break;
    case '***':
    case '---':
      isConverted = convertToDivider(page, model, prefix);
      break;
    case '#':
      isConverted = convertToParagraph(page, model, 'h1', prefix);
      break;
    case '##':
      isConverted = convertToParagraph(page, model, 'h2', prefix);
      break;
    case '###':
      isConverted = convertToParagraph(page, model, 'h3', prefix);
      break;
    case '####':
      isConverted = convertToParagraph(page, model, 'h4', prefix);
      break;
    case '#####':
      isConverted = convertToParagraph(page, model, 'h5', prefix);
      break;
    case '######':
      isConverted = convertToParagraph(page, model, 'h6', prefix);
      break;
    case '>':
      isConverted = convertToParagraph(page, model, 'quote', prefix);
      break;
    default:
      isConverted = convertToList(page, model, 'numbered', prefix);
  }

  return isConverted ? PREVENT_DEFAULT : ALLOW_DEFAULT;
}
