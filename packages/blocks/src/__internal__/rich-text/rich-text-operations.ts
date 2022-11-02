// operations used in rich-text level

import { Store, Text } from '@blocksuite/store';
import Quill from 'quill';
import {
  ExtendedModel,
  assertExists,
  getRichTextByModel,
  getContainerByModel,
  getPreviousBlock,
  ALLOW_DEFAULT,
  caretRangeFromPoint,
  focusNextBlock,
  focusPreviousBlock,
  getNextBlock,
  Point,
  PREVENT_DEFAULT,
  asyncFocusRichText,
  convertToList,
  convertToParagraph,
} from '../utils';

export function handleBlockEndEnter(store: Store, model: ExtendedModel) {
  const parent = store.getParent(model);
  const index = parent?.children.indexOf(model);
  if (parent && index !== undefined && index > -1) {
    // make adding text block by enter a standalone operation
    store.captureSync();

    let id = '';
    if (model.flavour === 'list') {
      const blockProps = {
        flavour: model.flavour,
        type: model.type,
      };
      if (model.children.length === 0) {
        id = store.addBlock(blockProps, parent, index + 1);
      } else {
        id = store.addBlock(blockProps, model, 0);
      }
    } else {
      const blockProps = {
        flavour: model.flavour,
        type: 'text',
      };
      id = store.addBlock(blockProps, parent, index + 1);
    }
    id && asyncFocusRichText(store, id);
  }
}

export function handleSoftEnter(
  store: Store,
  model: ExtendedModel,
  index: number
) {
  store.captureSync();
  model.text?.insert('\n', index);
}

export function handleBlockSplit(
  store: Store,
  model: ExtendedModel,
  splitIndex: number
) {
  if (!(model.text instanceof Text)) return;

  const parent = store.getParent(model);
  if (!parent) return;

  const [left, right] = model.text.split(splitIndex);
  store.captureSync();
  store.markTextSplit(model.text, left, right);
  store.updateBlock(model, { text: left });

  let newParent = parent;
  let newBlockIndex = newParent.children.indexOf(model) + 1;
  if (model.flavour === 'list' && model.children.length > 0) {
    newParent = model;
    newBlockIndex = 0;
  }
  const id = store.addBlock(
    { flavour: model.flavour, text: right, type: model.type },
    newParent,
    newBlockIndex
  );
  asyncFocusRichText(store, id);
}

export function handleIndent(
  store: Store,
  model: ExtendedModel,
  offset: number
) {
  const previousSibling = store.getPreviousSibling(model);
  if (previousSibling) {
    store.captureSync();

    const blockProps = {
      flavour: model.flavour,
      type: model.type,
      text: model?.text?.clone(), // should clone before `deleteBlock`
      children: model.children,
    };
    store.deleteBlock(model);
    const id = store.addBlock(blockProps, previousSibling);
    // FIXME: after quill onload
    requestAnimationFrame(() => {
      const block = store.getBlockById(id);
      assertExists(block);
      const richText = getRichTextByModel(block);
      richText?.quill.setSelection(offset, 0);
    });
  }
}

export async function handleUnindent(
  store: Store,
  model: ExtendedModel,
  offset: number
) {
  const parent = store.getParent(model);
  if (!parent || parent?.flavour === 'group') return;

  const grandParent = store.getParent(parent);
  if (!grandParent) return;

  const index = grandParent.children.indexOf(parent);
  const blockProps = {
    flavour: model.flavour,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
    type: model.type,
  };

  store.captureSync();
  store.deleteBlock(model);
  const id = store.addBlock(blockProps, grandParent, index + 1);

  // FIXME: after quill onload
  requestAnimationFrame(() => {
    const block = store.getBlockById(id);
    assertExists(block);

    const richText = getRichTextByModel(block);
    richText?.quill.setSelection(offset, 0);
  });
}

export function handleLineStartBackspace(store: Store, model: ExtendedModel) {
  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (model.flavour === 'paragraph') {
    if (model.type !== 'text') {
      store.captureSync();
      store.updateBlock(model, { type: 'text' });
    } else {
      const parent = store.getParent(model);
      if (!parent || parent?.flavour === 'group') {
        const container = getContainerByModel(model);
        const previousSibling = getPreviousBlock(container, model.id);
        if (previousSibling) {
          store.captureSync();
          let preTextLength = model.text?.length || 0;
          previousSibling.text?.join(model.text as Text);
          store.deleteBlock(model);
          asyncFocusRichText(store, previousSibling.id);
          const richText = getRichTextByModel(previousSibling);
          richText?.quill?.setSelection(preTextLength, 0);
        }
      } else {
        const grandParent = store.getParent(parent);
        if (!grandParent) return;
        const index = grandParent.children.indexOf(parent);
        const blockProps = {
          flavour: model.flavour,
          text: model?.text?.clone(), // should clone before `deleteBlock`
          children: model.children,
          type: model.type,
        };

        store.captureSync();
        store.deleteBlock(model);
        store.addBlock(blockProps, grandParent, index + 1);
      }
    }
  }
  // When deleting at line start of a list block,
  // switch it to normal paragraph block.
  else if (model.flavour === 'list') {
    const parent = store.getParent(model);
    if (!parent) return;

    const index = parent.children.indexOf(model);
    store.captureSync();

    const blockProps = {
      flavour: 'paragraph',
      type: 'text',
      text: model?.text?.clone(),
      children: model.children,
    };
    store.deleteBlock(model);
    const id = store.addBlock(blockProps, parent, index);
    asyncFocusRichText(store, id);
  }
}

export function handleKeyUp(model: ExtendedModel, editableContainer: Element) {
  const selection = window.getSelection();
  if (selection) {
    const range = selection.getRangeAt(0);
    const { height, left, top } = range.getBoundingClientRect();
    // if cursor is on the first line and has no text, height is 0
    if (height === 0 && top === 0) {
      const rect = range.startContainer.parentElement?.getBoundingClientRect();
      rect && focusPreviousBlock(model, new Point(rect.left, rect.top));
      return PREVENT_DEFAULT;
    }
    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, top - height / 2);
    if (
      (!newRange || !editableContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      const container = getContainerByModel(model);
      const preNodeModel = getPreviousBlock(container, model.id);
      // FIXME: Then it will turn the input into the div
      if (preNodeModel?.flavour === 'group') {
        (
          document.querySelector(
            '.affine-default-page-block-title'
          ) as HTMLInputElement
        ).focus();
      } else {
        focusPreviousBlock(model, new Point(left, top));
      }
      return PREVENT_DEFAULT;
    }
  }
  return ALLOW_DEFAULT;
}

// We should determine if the cursor is at the edge of the block, since a cursor at edge may have two cursor points
// but only one bounding rect.
// If a cursor is at the edge of a block, its previous cursor rect will not equal to the next one.
function isAtLineEdge(range: Range) {
  if (
    range.startOffset > 0 &&
    Number(range.startContainer.textContent?.length) - range.startOffset > 0
  ) {
    const prevRange = range.cloneRange();
    prevRange.setStart(range.startContainer, range.startOffset - 1);
    prevRange.setEnd(range.startContainer, range.startOffset - 1);
    const nextRange = range.cloneRange();
    nextRange.setStart(range.endContainer, range.endOffset + 1);
    nextRange.setEnd(range.endContainer, range.endOffset + 1);
    return (
      prevRange.getBoundingClientRect().top !==
      nextRange.getBoundingClientRect().top
    );
  }
  return false;
}

export function handleKeyDown(
  model: ExtendedModel,
  textContainer: HTMLElement
) {
  const selection = window.getSelection();
  if (selection) {
    const range = selection.getRangeAt(0);
    const { bottom, left, height } = range.getBoundingClientRect();
    // if cursor is on the last line and has no text, height is 0
    if (height === 0 && bottom === 0) {
      const rect = range.startContainer.parentElement?.getBoundingClientRect();
      const nextBlock = getNextBlock(model.id);
      if (!nextBlock) {
        return ALLOW_DEFAULT;
      }
      rect && focusNextBlock(model, new Point(rect.left, rect.top));
      return PREVENT_DEFAULT;
    }
    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, bottom + height / 2);
    if (!newRange || !textContainer.contains(newRange.startContainer)) {
      const nextBlock = getNextBlock(model.id);
      if (!nextBlock) {
        return ALLOW_DEFAULT;
      }
      focusNextBlock(model, new Point(left, bottom));
      return PREVENT_DEFAULT;
    }
    // if cursor is at the edge of a block, it may out of the textContainer after keydown
    if (isAtLineEdge(range)) {
      const {
        height,
        left,
        bottom: nextBottom,
      } = newRange.getBoundingClientRect();
      const nextRange = caretRangeFromPoint(left, nextBottom + height / 2);
      if (!nextRange || !textContainer.contains(nextRange.startContainer)) {
        focusNextBlock(
          model,
          new Point(
            newRange.startContainer.parentElement?.offsetLeft || left,
            bottom
          )
        );
        return PREVENT_DEFAULT;
      }
    }
  }
  return ALLOW_DEFAULT;
}

export function tryMatchSpaceHotkey(
  store: Store,
  model: ExtendedModel,
  quill: Quill,
  prefix: string,
  range: { index: number; length: number }
) {
  const [, offset] = quill.getLine(range.index);
  if (offset > prefix.length) {
    return ALLOW_DEFAULT;
  }
  let isConverted = false;
  switch (prefix.trim()) {
    case '[]':
    case '[ ]':
      isConverted = convertToList(store, model, 'todo', prefix, {
        checked: false,
      });
      break;
    case '[x]':
      isConverted = convertToList(store, model, 'todo', prefix, {
        checked: true,
      });
      break;
    case '-':
    case '*':
      isConverted = convertToList(store, model, 'bulleted', prefix);
      break;
    case '#':
      isConverted = convertToParagraph(store, model, 'h1', prefix);
      break;
    case '##':
      isConverted = convertToParagraph(store, model, 'h2', prefix);
      break;
    case '###':
      isConverted = convertToParagraph(store, model, 'h3', prefix);
      break;
    case '####':
      isConverted = convertToParagraph(store, model, 'h4', prefix);
      break;
    case '#####':
      isConverted = convertToParagraph(store, model, 'h5', prefix);
      break;
    case '######':
      isConverted = convertToParagraph(store, model, 'h6', prefix);
      break;
    case '>':
      isConverted = convertToParagraph(store, model, 'quote', prefix);
      break;
    default:
      isConverted = convertToList(store, model, 'numbered', prefix);
  }

  return isConverted ? PREVENT_DEFAULT : ALLOW_DEFAULT;
}
