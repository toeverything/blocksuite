import { BLOCK_ID_ATTR as ATTR } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import type { Loader } from '../../components/loader.js';
import type { DefaultPageBlockComponent } from '../../index.js';
import type { RichText } from '../rich-text/rich-text.js';
import type { IPoint } from './gesture.js';
import { getCurrentNativeRange } from './selection.js';

type ElementTagName = keyof HTMLElementTagNameMap;

export type BlockComponentElement =
  HTMLElementTagNameMap[keyof HTMLElementTagNameMap] extends infer U
    ? U extends { model: infer M }
      ? M extends BaseBlockModel
        ? U
        : never
      : never
    : never;

interface ContainerBlock {
  model?: BaseBlockModel;
}

export function getBlockById<T extends ElementTagName>(
  id: string,
  container: Element = document.body
) {
  return container.querySelector<T>(
    `[${ATTR}="${id}"]` as T
  ) as BlockComponentElement | null;
}

export function getBlockByPoint(
  point: IPoint
): BlockComponentElement | null | undefined {
  return document.elementFromPoint(point.x, point.y)?.closest(`[${ATTR}]`);
}

/**
 * @deprecated Use `page.getParent` instead
 */
export function getParentBlockById<T extends ElementTagName>(
  id: string,
  ele: Element = document.body
) {
  const currentBlock = getBlockById(id, ele);
  return (
    (currentBlock?.parentElement?.closest<T>(
      `[${ATTR}]` as T
    ) as BlockComponentElement) || null
  );
}

/**
 *
 * @example
 * ```md
 * page
 * - frame
 *  - paragraph <- when invoked here, the traverse order will be following
 *    - child <- 1
 *  - sibling <- 2
 * - frame <- 3 (will be skipped)
 *   - paragraph <- 4
 * ```
 *
 * NOTE: this method will skip the `affine:frame` block
 */
export function getNextBlock(
  model: BaseBlockModel,
  map: Record<string, true> = {}
): BaseBlockModel | null {
  if (model.id in map) {
    throw new Error("Can't get next block! There's a loop in the block tree!");
  }
  map[model.id] = true;

  const page = model.page;
  if (model.children.length) {
    return model.children[0];
  }
  let currentBlock: typeof model | null = model;
  while (currentBlock) {
    const nextSibling = page.getNextSibling(currentBlock);
    if (nextSibling) {
      // Assert nextSibling is not possible to be `affine:page`
      if (matchFlavours(nextSibling, ['affine:frame'] as const)) {
        return getNextBlock(nextSibling);
      }
      return nextSibling;
    }
    currentBlock = page.getParent(currentBlock);
  }
  return null;
}

/**
 *
 * @example
 * ```md
 * page
 * - frame
 *   - paragraph <- 5
 * - frame <- 4 (will be skipped)
 *  - paragraph <- 3
 *    - child <- 2
 *      - child <- 1
 *  - paragraph <- when invoked here, the traverse order will be above
 * ```
 *
 * NOTE: this method will skip the `affine:frame` and `affine:page` block
 */
export function getPreviousBlock(
  model: BaseBlockModel,
  map: Record<string, true> = {}
): BaseBlockModel | null {
  if (model.id in map) {
    throw new Error(
      "Can't get previous block! There's a loop in the block tree!"
    );
  }
  map[model.id] = true;

  const page = model.page;
  const parentBlock = page.getParent(model);
  if (!parentBlock) {
    return null;
  }
  const previousBlock = page.getPreviousSibling(model);
  if (!previousBlock) {
    if (matchFlavours(parentBlock, ['affine:frame', 'affine:page'] as const)) {
      return getPreviousBlock(parentBlock);
    }
    return parentBlock;
  }
  if (previousBlock.children.length) {
    let lastChild = previousBlock.children[previousBlock.children.length - 1];
    while (lastChild.children.length) {
      lastChild = lastChild.children[lastChild.children.length - 1];
    }
    // Assume children is not possible to be `affine:frame` or `affine:page`
    return lastChild;
  }
  return previousBlock;
}

/**
 * Note: this method will return `DefaultPageBlockComponent` | `EdgelessPageBlockComponent`!
 *
 * @deprecated This method only works in the paper mode!
 */
export function getDefaultPageBlock(model: BaseBlockModel) {
  assertExists(model.page.root);
  const page = document.querySelector(
    `[${ATTR}="${model.page.root.id}"]`
  ) as DefaultPageBlockComponent;
  // | EdgelessPageBlockComponent | null;
  return page;
}

/**
 * @deprecated Use {@link getEditorContainer} instead
 */
export function getContainerByModel(model: BaseBlockModel) {
  const page = getDefaultPageBlock(model);
  const container = page.closest('editor-container');
  assertExists(container);
  return container;
}

export function getEditorContainer(page: Page) {
  assertExists(
    page.root,
    'Failed to check paper mode! Page root is not exists!'
  );
  const pageBlock = document.querySelector(`[${ATTR}="${page.root.id}"]`);
  // EditorContainer
  const editorContainer = pageBlock?.closest('editor-container');
  assertExists(editorContainer);
  return editorContainer;
}

export function isPageMode(page: Page) {
  const editor = getEditorContainer(page);
  if (!('mode' in editor)) {
    throw new Error('Failed to check page mode! Editor mode is not exists!');
  }
  const mode = editor.mode as 'page' | 'edgeless'; // | undefined;
  return mode === 'page';
}

/**
 * Get editor viewport element.
 *
 * @example
 * ```ts
 * const viewportElement = getViewportElement(this.model.page);
 * if (!viewportElement) return;
 * this._disposables.addFromEvent(viewportElement, 'scroll', () => {
 *   updatePosition();
 * });
 * ```
 */
export function getViewportElement(page: Page) {
  const isPage = isPageMode(page);
  if (!isPage) return null;
  assertExists(page.root);
  const defaultPageBlock = document.querySelector(
    `[${ATTR}="${page.root.id}"]`
  );

  if (
    !defaultPageBlock ||
    defaultPageBlock.closest('affine-default-page') !== defaultPageBlock
  ) {
    throw new Error('Failed to get viewport element!');
  }
  return (defaultPageBlock as DefaultPageBlockComponent).viewportElement;
}

export function getBlockElementByModel(
  model: BaseBlockModel
): BlockComponentElement | null {
  assertExists(model.page.root);
  const page = document.querySelector(
    `[${ATTR}="${model.page.root.id}"]`
  ) as DefaultPageBlockComponent;
  if (!page) return null;

  if (model.id === model.page.root.id) {
    return page;
  }

  const element = page.querySelector(`[${ATTR}="${model.id}"]`);
  return element as BlockComponentElement | null;
}

export function getStartModelBySelection(range = getCurrentNativeRange()) {
  const startContainer =
    range.startContainer instanceof Text
      ? (range.startContainer.parentElement as HTMLElement)
      : (range.startContainer as HTMLElement);

  const startComponent = startContainer.closest(
    `[${ATTR}]`
  ) as ContainerBlock | null;
  if (!startComponent) {
    return null;
  }
  const startModel = startComponent.model as BaseBlockModel;
  if (matchFlavours(startModel, ['affine:frame', 'affine:page'] as const)) {
    return null;
  }
  return startModel;
}

export function getRichTextByModel(model: BaseBlockModel) {
  const blockElement = getBlockElementByModel(model);
  const richText = blockElement?.querySelector('rich-text') as RichText;
  if (!richText) return null;
  return richText;
}

// TODO fix find embed model
export function getModelsByRange(range: Range): BaseBlockModel[] {
  // filter comment
  if (
    range.startContainer.nodeType === Node.COMMENT_NODE ||
    range.endContainer.nodeType === Node.COMMENT_NODE ||
    range.commonAncestorContainer.nodeType === Node.COMMENT_NODE
  ) {
    return [];
  }

  let commonAncestor = range.commonAncestorContainer as HTMLElement;
  if (commonAncestor.nodeType === Node.TEXT_NODE) {
    const model = getStartModelBySelection(range);
    if (!model) return [];
    return [model];
  }

  if (
    commonAncestor.attributes &&
    !commonAncestor.attributes.getNamedItem(ATTR)
  ) {
    const parentElement = commonAncestor.closest(`[${ATTR}]`)
      ?.parentElement as HTMLElement;
    if (parentElement != null) {
      commonAncestor = parentElement;
    }
  }

  const intersectedModels: BaseBlockModel[] = [];
  const blockElements = commonAncestor.querySelectorAll(`[${ATTR}]`);

  if (!blockElements.length) return [];

  if (blockElements.length === 1) {
    const model = getStartModelBySelection(range);
    if (!model) return [];
    return [model];
  }

  Array.from(blockElements)
    .filter(element => 'model' in element)
    .forEach(element => {
      const block = element as ContainerBlock;
      if (!block.model) return;

      const mainElement = matchFlavours(block.model, ['affine:page'] as const)
        ? element?.querySelector('.affine-default-page-block-title-container')
        : element?.querySelector('rich-text');
      if (
        mainElement &&
        range.intersectsNode(mainElement) &&
        !matchFlavours(block.model, ['affine:frame', 'affine:page'] as const)
      ) {
        intersectedModels.push(block.model);
      }
    });
  return intersectedModels;
}

export function getModelByElement(element: Element): BaseBlockModel {
  const containerBlock = element.closest(`[${ATTR}]`) as ContainerBlock;
  // In extreme cases, the block may be loading, and the model is not yet available.
  // For example
  // `<loader-element data-block-id="586080495:15" data-service-loading="true"></loader-element>`
  if ('hostModel' in containerBlock) {
    const loader = containerBlock as Loader;
    assertExists(loader.hostModel);
    return loader.hostModel;
  }
  assertExists(containerBlock.model);
  return containerBlock.model;
}

function mergeRect(a: DOMRect, b: DOMRect) {
  return new DOMRect(
    Math.min(a.left, b.left),
    Math.min(a.top, b.top),
    Math.max(a.right, b.right) - Math.min(a.left, b.left),
    Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)
  );
}

export function getDOMRectByLine(
  rectList: DOMRectList,
  lineType: 'first' | 'last'
) {
  const list = Array.from(rectList);

  if (lineType === 'first') {
    let flag = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i].left < 0 && list[i].right < 0 && list[i].height === 1) break;
      flag = i;
    }
    const subList = list.slice(0, flag + 1);
    return subList.reduce(mergeRect);
  } else {
    let flag = list.length - 1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].height === 0) break;
      flag = i;
    }
    const subList = list.slice(flag);
    return subList.reduce(mergeRect);
  }
}

export function getVRangeByNode(node: Node): VRange | null {
  if (!node.parentElement) return null;

  const richText = node.parentElement.closest('rich-text') as RichText;
  const vEditor = richText?.vEditor;
  if (!vEditor) return null;

  return vEditor.getVRange();
}

/**
 * Get the specific text node and offset by the selected block.
 * The reverse implementation of {@link getVRangeByNode}
 * See also {@link getVRangeByNode}
 *
 * ```ts
 * const [startNode, startOffset] = getTextNodeBySelectedBlock(startModel, startOffset);
 * const [endNode, endOffset] = getTextNodeBySelectedBlock(endModel, endOffset);
 *
 * const range = new Range();
 * range.setStart(startNode, startOffset);
 * range.setEnd(endNode, endOffset);
 *
 * const selection = window.getSelection();
 * selection.removeAllRanges();
 * selection.addRange(range);
 * ```
 */
export function getTextNodeBySelectedBlock(model: BaseBlockModel, offset = 0) {
  const text = model.text;
  if (!text) {
    throw new Error("Failed to get block's text!");
  }
  if (offset > text.length) {
    offset = text.length;
    // FIXME enable strict check
    // console.error(
    //   'Offset is out of range! model: ',
    //   model,
    //   'offset: ',
    //   offset,
    //   'text: ',
    //   text.toString(),
    //   'text.length: ',
    //   text.length
    // );
  }
  const blockElement = getBlockById(model.id);
  if (!blockElement) {
    throw new Error('Failed to get block element, block id: ' + model.id);
  }
  const richText = blockElement.querySelector('rich-text');
  if (!richText) {
    throw new Error('Failed to get rich text element');
  }
  const vEditor = richText.vEditor;
  assertExists(vEditor);
  const [leaf, leafOffset] = vEditor.getTextPoint(offset);
  return [leaf, leafOffset] as const;
}

export function getAllBlocks() {
  const blocks: BlockComponentElement[] = Array.from(
    document.querySelectorAll(`[${ATTR}]`)
  );
  return blocks.filter(item => {
    return (
      item.tagName !== 'AFFINE-DEFAULT-PAGE' && item.tagName !== 'AFFINE-FRAME'
    );
  });
}

export function isInsideRichText(element: unknown): element is RichText {
  // Fool-proofing
  if (element instanceof Event) {
    throw new Error('Did you mean "event.target"?');
  }

  if (!element || !(element instanceof Element)) {
    return false;
  }
  const richText = element.closest('rich-text');
  return !!richText;
}

export function isInsidePageTitle(element: unknown): boolean {
  const titleElement = document.querySelector('[data-block-is-title="true"]');
  if (!titleElement) return false;

  return titleElement.contains(element as Node);
}

export function isToggleIcon(element: unknown): element is SVGPathElement {
  return (
    element instanceof SVGPathElement &&
    element.getAttribute('data-is-toggle-icon') === 'true'
  );
}

export function isDatabaseInput(element: unknown): boolean {
  return (
    element instanceof HTMLElement &&
    element.getAttribute('data-block-is-database-input') === 'true'
  );
}

export function isCaptionElement(node: unknown): node is HTMLInputElement {
  if (!(node instanceof Element)) {
    return false;
  }
  return node.classList.contains('affine-embed-wrapper-caption');
}

export function getElementFromEventTarget(
  target: EventTarget | null
): Element | null {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (target instanceof Node) target.parentElement;
  return null;
}
