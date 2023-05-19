import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT as PADDING_LEFT,
  BLOCK_ID_ATTR as ATTR,
} from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import { activeEditorManager } from '../../__internal__/utils/active-editor-manager.js';
import { type AbstractEditor } from '../../__internal__/utils/types.js';
import type { Loader } from '../../components/loader.js';
import type { DefaultPageBlockComponent } from '../../page-block/default/default-page-block.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import type { RichText } from '../rich-text/rich-text.js';
import { type Point, Rect } from './rect.js';
import { getCurrentNativeRange } from './selection.js';
import { clamp } from './std.js';

const ATTR_SELECTOR = `[${ATTR}]`;

// margin-top: calc(var(--affine-paragraph-space) + 24px);
// h1.margin-top = 8px + 24px = 32px;
const MAX_SPACE = 32;
const STEPS = MAX_SPACE / 2 / 2;

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

/**
 * @deprecated Use `page.getParent` instead
 */
export function getParentBlockById<T extends ElementTagName>(
  id: string,
  ele: Element = document.body
) {
  const currentBlock = getBlockElementById(id, ele);
  return (
    (currentBlock?.parentElement?.closest<T>(
      ATTR_SELECTOR as T
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
      if (matchFlavours(nextSibling, ['affine:frame'])) {
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
    if (
      matchFlavours(parentBlock, [
        'affine:frame',
        'affine:page',
        'affine:database',
      ])
    ) {
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
 * @deprecated Use {@link getDefaultPage} instead. This method only works in the paper mode!
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

/**
 * If it's not in the page mode, it will return `null` directly.
 */
export function getDefaultPage(page: Page) {
  if (!isPageMode(page)) {
    return null;
  }
  const editor = getEditorContainer(page);
  const pageComponent = editor.querySelector('affine-default-page');
  return pageComponent;
}

/**
 * If it's not in the edgeless mode, it will return `null` directly.
 */
export function getEdgelessPage(page: Page) {
  const editor = getEditorContainer(page);
  const pageComponent = editor.querySelector('affine-edgeless-page');
  return pageComponent;
}

/**
 * This function exposes higher levels of abstraction.
 *
 * PLEASE USE IT WITH CAUTION!
 */
export function getEditorContainer(page: Page): AbstractEditor {
  assertExists(
    page.root,
    'Failed to check page mode! Page root is not exists!'
  );
  const pageBlock = getBlockElementById(page.root.id);
  // EditorContainer
  const editorContainer = pageBlock?.closest('editor-container');
  assertExists(editorContainer);
  return editorContainer as AbstractEditor;
}

export function getEditorContainerByElement(ele: Element) {
  // EditorContainer
  const editorContainer = ele.closest('editor-container');
  assertExists(editorContainer);
  return editorContainer;
}

export function isPageMode(page: Page) {
  const editor = getEditorContainer(page);
  if (!('mode' in editor)) {
    throw new Error('Failed to check page mode! Editor mode is not exists!');
  }
  const mode = editor.mode;
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
  const editor = activeEditorManager.getActiveEditor();
  const page = (editor ?? document).querySelector<
    DefaultPageBlockComponent | EdgelessPageBlockComponent
  >(`[${ATTR}="${model.page.root.id}"]`);
  if (!page) return null;

  if (model.id === model.page.root.id) {
    return page;
  }

  return page.querySelector<BlockComponentElement>(`[${ATTR}="${model.id}"]`);
}

export function asyncGetBlockElementByModel(
  model: BaseBlockModel
): Promise<BlockComponentElement | null> {
  assertExists(model.page.root);
  const editor = activeEditorManager.getActiveEditor();
  const page = (editor ?? document).querySelector<
    DefaultPageBlockComponent | EdgelessPageBlockComponent
  >(`[${ATTR}="${model.page.root.id}"]`);
  if (!page) return Promise.resolve(null);

  if (model.id === model.page.root.id) {
    return Promise.resolve(page);
  }

  let resolved = false;
  return new Promise<BlockComponentElement>((resolve, reject) => {
    const onSuccess = (element: BlockComponentElement) => {
      resolved = true;
      observer.disconnect();
      resolve(element);
    };

    const onFail = () => {
      observer.disconnect();
      reject(
        new Error(
          `Cannot find block element by model: ${model.flavour} id: ${model.id}`
        )
      );
    };

    const observer = new MutationObserver(() => {
      const blockElement = page.querySelector<BlockComponentElement>(
        `[${ATTR}="${model.id}"]`
      );
      if (blockElement) {
        onSuccess(blockElement);
      }
    });

    observer.observe(page, {
      childList: true,
      subtree: true,
    });

    requestAnimationFrame(() => {
      if (!resolved) {
        const blockElement = getBlockElementByModel(model);
        if (blockElement) {
          onSuccess(blockElement);
        } else {
          onFail();
        }
      }
    });
  });
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
  if (matchFlavours(startModel, ['affine:frame', 'affine:page'])) {
    return null;
  }
  return startModel;
}

/**
 * @deprecated In most cases, you not need RichText, you can use {@link getVirgoByModel} instead.
 */
export function getRichTextByModel(model: BaseBlockModel) {
  const blockElement = getBlockElementByModel(model);
  const richText = blockElement?.querySelector<RichText>('rich-text');
  if (!richText) return null;
  return richText;
}

export async function asyncGetRichTextByModel(model: BaseBlockModel) {
  const blockElement = await asyncGetBlockElementByModel(model);
  const richText = blockElement?.querySelector<RichText>('rich-text');
  if (!richText) return null;
  return richText;
}

export function getVirgoByModel(model: BaseBlockModel) {
  if (matchFlavours(model, ['affine:database'] as const)) {
    // Not support database model since it's may be have multiple Virgo instances.
    throw new Error('Cannot get virgo by database model!');
  }
  const richText = getRichTextByModel(model);
  if (!richText) return null;
  return richText.vEditor;
}

export async function asyncGetVirgoByModel(model: BaseBlockModel) {
  if (matchFlavours(model, ['affine:database'] as const)) {
    // Not support database model since it's may be have multiple Virgo instances.
    throw new Error('Cannot get virgo by database model!');
  }
  const richText = await asyncGetRichTextByModel(model);
  if (!richText) return null;
  return richText.vEditor;
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
    const parentElement = commonAncestor.closest(ATTR_SELECTOR)
      ?.parentElement as HTMLElement;
    if (parentElement != null) {
      commonAncestor = parentElement;
    }
  }

  const intersectedModels: BaseBlockModel[] = [];
  const blockElements = commonAncestor.querySelectorAll(ATTR_SELECTOR);

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

      const mainElement = matchFlavours(block.model, ['affine:page'])
        ? element?.querySelector('.affine-default-page-block-title-container')
        : element?.querySelector('rich-text') || element?.querySelector('img');
      if (
        mainElement &&
        range.intersectsNode(mainElement) &&
        !matchFlavours(block.model, ['affine:frame', 'affine:page'])
      ) {
        intersectedModels.push(block.model);
      }
    });
  return intersectedModels;
}

export function getModelByElement(element: Element): BaseBlockModel {
  const closestBlock = element.closest(ATTR_SELECTOR);
  assertExists(closestBlock, 'Cannot find block element by element');
  return getModelByBlockElement(closestBlock);
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
  const editor = activeEditorManager.getActiveEditor();
  const titleElement = (editor ?? document).querySelector(
    '[data-block-is-title="true"]'
  );
  if (!titleElement) return false;

  return titleElement.contains(element as Node);
}

export function isInsideEdgelessTextEditor(element: unknown): boolean {
  const editor = activeEditorManager.getActiveEditor();
  const titleElement = (editor ?? document).querySelector(
    '[data-block-is-edgeless-text="true"]'
  );
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
    element.getAttribute('data-virgo-root') === 'true'
  );
}

export function isRawInput(element: unknown): boolean {
  return (
    element instanceof HTMLInputElement && !!element.closest('affine-database')
  );
}

export function isInsideDatabaseTitle(element: unknown): boolean {
  const titleElement = document.querySelector(
    '[data-block-is-database-title="true"]'
  );
  if (!titleElement) return false;

  return titleElement.contains(element as Node);
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

/**
 * Returns `16` if node is contained in the parent.
 * Otherwise return `0`.
 */
export function contains(parent: Element, node: Element) {
  return (
    parent.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
  );
}

/**
 * Returns `true` if node is contained in the elements.
 */
export function isContainedIn(elements: Element[], node: Element) {
  return elements.some(parent => contains(parent, node));
}

/**
 * Returns `true` if element has `data-block-id` attribute.
 */
export function hasBlockId(element: Element) {
  return element.hasAttribute(ATTR);
}

/**
 * Returns `true` if element is default page.
 */
export function isDefaultPage({ tagName }: Element) {
  return tagName === 'AFFINE-DEFAULT-PAGE';
}

/**
 * Returns `true` if element is edgeless page.
 */
export function isEdgelessPage({ tagName }: Element) {
  return tagName === 'AFFINE-EDGELESS-PAGE';
}

/**
 * Returns `true` if element is default/edgeless page or frame.
 */
export function isPageOrFrame(element: Element) {
  return isDefaultPage(element) || isEdgelessPage(element) || isFrame(element);
}

/**
 * Returns `true` if element is not page or frame.
 */
export function isBlock(element: Element) {
  return !isPageOrFrame(element);
}

/**
 * Returns `true` if element is image.
 */
export function isImage({ tagName, firstElementChild }: Element) {
  return (
    tagName === 'AFFINE-EMBED' && firstElementChild?.tagName === 'AFFINE-IMAGE'
  );
}

/**
 * Returns `true` if element is frame.
 */
function isFrame({ tagName }: Element) {
  return tagName === 'AFFINE-FRAME';
}

/**
 * Returns `true` if element is embed.
 */
function isEmbed({ tagName }: Element) {
  return tagName === 'AFFINE-EMBED';
}

/**
 * Returns `true` if element is database.
 */
function isDatabase({ tagName }: Element) {
  return tagName === 'AFFINE-DATABASE-TABLE';
}

/**
 * Returns `true` if element is edgeless block child.
 */
export function isEdgelessBlockChild({ classList }: Element) {
  return classList.contains('affine-edgeless-block-child');
}

/**
 * Returns the closest block element by a point in the rect.
 *
 * ```
 * ############### block
 * ||############# block
 * ||||########### block
 * ||||    ...
 * ||||  y - 2 * n
 * ||||    ...
 * ||||----------- cursor
 * ||||    ...
 * ||||  y + 2 * n
 * ||||    ...
 * ||||########### block
 * ||############# block
 * ############### block
 * ```
 */
export function getClosestBlockElementByPoint(
  point: Point,
  state: {
    rect?: Rect;
    container?: Element;
    snapToEdge?: { x: boolean; y: boolean };
  } | null = null,
  scale = 1
): Element | null {
  const { y } = point;

  let container;
  let element = null;
  let bounds = null;
  let childBounds = null;
  let diff = 0;
  let n = 1;

  if (state) {
    const { snapToEdge = { x: true, y: false } } = state;
    container = state.container;
    const rect = state.rect || container?.getBoundingClientRect();
    if (rect) {
      if (snapToEdge.x) {
        point.x = Math.min(
          Math.max(point.x, rect.left) + PADDING_LEFT * scale - 1,
          rect.right - PADDING_LEFT * scale - 1
        );
      }
      if (snapToEdge.y) {
        // TODO handle scale
        if (scale !== 1) {
          console.warn('scale is not supported yet');
        }
        point.y = clamp(point.y, rect.top + 1, rect.bottom - 1);
      }
    }
  }

  // find block element
  element = findBlockElement(
    document.elementsFromPoint(point.x, point.y),
    container
  );

  // Horizontal direction: for nested structures
  if (element) {
    // Database
    if (isDatabase(element)) {
      bounds = element.getBoundingClientRect();
      const rows = getDatabaseBlockRowsElement(element);
      assertExists(rows);
      childBounds = rows.getBoundingClientRect();

      if (childBounds.height) {
        if (point.y < childBounds.top || point.y > childBounds.bottom) {
          return element;
        }
        childBounds = null;
      } else {
        return element;
      }
    } else {
      // Indented paragraphs or list
      bounds = getRectByBlockElement(element);
      childBounds = element
        .querySelector('.affine-block-children-container')
        ?.firstElementChild?.getBoundingClientRect();

      if (childBounds && childBounds.height) {
        if (bounds.x < point.x && point.x <= childBounds.x) {
          return element;
        }
        childBounds = null;
      } else {
        return element;
      }
    }

    bounds = null;
    element = null;
  }

  // Vertical direction
  do {
    point.y = y - n * 2;

    if (n < 0) n--;
    n *= -1;

    // find block element
    element = findBlockElement(
      document.elementsFromPoint(point.x, point.y),
      container
    );

    if (element) {
      bounds = getRectByBlockElement(element);
      diff = bounds.bottom - point.y;
      if (diff >= 0 && diff <= STEPS * 2) {
        return element;
      }
      diff = point.y - bounds.top;
      if (diff >= 0 && diff <= STEPS * 2) {
        return element;
      }
      bounds = null;
      element = null;
    }
  } while (n <= STEPS);

  return element;
}

/**
 * Returns the closest block element by element that does not contain the page element and frame element.
 */
export function getClosestBlockElementByElement(element: Element | null) {
  if (!element) return null;
  if (hasBlockId(element) && isBlock(element)) {
    return element;
  }
  element = element.closest(ATTR_SELECTOR);
  if (element && isBlock(element)) {
    return element;
  }
  return null;
}

/**
 * Returns the model of the block element.
 */
export function getModelByBlockElement(element: Element) {
  const containerBlock = element as ContainerBlock;
  // In extreme cases, the block may be loading, and the model is not yet available.
  // For example
  // // `<loader-element data-block-id="586080495:15" data-service-loading="true"></loader-element>`
  if ('hostModel' in containerBlock) {
    const loader = containerBlock as Loader;
    assertExists(loader.hostModel);
    return loader.hostModel;
  }
  assertExists(containerBlock.model);
  return containerBlock.model;
}

/**
 * Returns all block elements in an element.
 */
export function getBlockElementsByElement(
  element: BlockComponentElement | Document | Element = document
) {
  return Array.from(element.querySelectorAll(ATTR_SELECTOR)).filter(isBlock);
}

/**
 * Returns the block element by id with the parent.
 */
export function getBlockElementById(
  id: string,
  parent:
    | BlockComponentElement
    | Document
    | Element = activeEditorManager.getActiveEditor() ?? document
) {
  return parent.querySelector(`[${ATTR}="${id}"]`);
}

/**
 * Returns the closest frame block element by id with the parent.
 */
export function getClosestFrameBlockElementById(
  id: string,
  parent: BlockComponentElement | Document | Element = document
) {
  const element = getBlockElementById(id, parent);
  if (!element) return null;
  if (isFrame(element)) return element;
  return element.closest('affine-frame');
}

/**
 * Returns rect of the block element.
 *
 * Compatible with Safari!
 * https://github.com/toeverything/blocksuite/issues/902
 * https://github.com/toeverything/blocksuite/pull/1121
 */
export function getRectByBlockElement(
  element: Element | BlockComponentElement
) {
  if (isDatabase(element)) return element.getBoundingClientRect();
  return (element.firstElementChild ?? element).getBoundingClientRect();
}

/**
 * Returns selected state rect of the block element.
 */
export function getSelectedStateRectByBlockElement(
  element: Element | BlockComponentElement
) {
  if (isImage(element)) {
    const wrapper = element.querySelector('.affine-image-wrapper');
    const resizable = element.querySelector('.resizable-img');
    assertExists(wrapper);
    assertExists(resizable);
    const w = Rect.fromDOM(wrapper);
    const r = Rect.fromDOM(resizable);
    const d = w.intersect(r);
    return d.toDOMRect();
  }
  return getRectByBlockElement(element);
}

/**
 * Returns block elements excluding their subtrees.
 * Only keep block elements of same level.
 */
export function getBlockElementsExcludeSubtrees(
  elements: Element[] | BlockComponentElement[]
) {
  if (elements.length <= 1) return elements;
  let parent = elements[0];
  return elements.filter((node, index) => {
    if (index === 0) return true;
    if (contains(parent, node)) {
      return false;
    } else {
      parent = node;
      return true;
    }
  });
}

/**
 * Returns block elements including their subtrees.
 */
export function getBlockElementsIncludeSubtrees(elements: Element[]) {
  return elements.reduce<Element[]>((elements, element) => {
    elements.push(element, ...getBlockElementsByElement(element));
    return elements;
  }, []);
}

/**
 * Find block element from an `Element[]`.
 * In Chrome/Safari, `document.elementsFromPoint` does not include `affine-image`.
 */
function findBlockElement(elements: Element[], parent?: Element) {
  const len = elements.length;
  let element = null;
  let i = 0;
  while (i < len) {
    element = elements[i];
    i++;
    // if parent does not contain element, it's ignored
    if (parent && !contains(parent, element)) continue;
    if (hasBlockId(element) && isBlock(element)) return element;
    if (isEmbed(element)) {
      if (i < len && hasBlockId(elements[i]) && isBlock(elements[i])) {
        return elements[i];
      }
      return getClosestBlockElementByElement(element);
    }
  }
  return null;
}

/**
 * query current mode whether is light or dark
 */
export function queryCurrentMode(): 'light' | 'dark' {
  const mode = getComputedStyle(document.documentElement).getPropertyValue(
    '--affine-theme-mode'
  );

  if (mode.trim() === 'dark') {
    return 'dark';
  } else {
    return 'light';
  }
}

/**
 * Get hovering frame with given a point in edgeless mode.
 */
export function getHoveringFrame(point: Point) {
  return (
    document.elementsFromPoint(point.x, point.y).find(isEdgelessBlockChild) ||
    null
  );
}

/**
 * Returns `true` if the database is empty.
 */
export function isEmptyDatabase(model: BaseBlockModel) {
  return matchFlavours(model, ['affine:database'] as const) && model.isEmpty();
}

/**
 * Gets the table of the database.
 */
export function getDatabaseBlockTableElement(element: Element) {
  return element.querySelector('.affine-database-block-table');
}

/**
 * Gets the column header of the database.
 */
export function getDatabaseBlockColumnHeaderElement(element: Element) {
  return element.querySelector('.affine-database-column-header');
}

/**
 * Gets the rows of the database.
 */
export function getDatabaseBlockRowsElement(element: Element) {
  return element.querySelector('.affine-database-block-rows');
}

/**
 * Returns a flag for the drop target.
 */
export enum DropFlags {
  Normal,
  Database,
  EmptyDatabase,
}

/**
 * Gets the drop rect by block and point.
 */
export function getDropRectByPoint(
  point: Point,
  model: BaseBlockModel,
  element: Element
): {
  rect: DOMRect;
  flag: DropFlags;
} {
  const result = {
    rect: getRectByBlockElement(element),
    flag: DropFlags.Normal,
  };

  const isDatabase = matchFlavours(model, ['affine:database'] as const);
  const tempElement = isDatabase
    ? element
    : element.parentElement?.classList.contains(
        'affine-database-block-row-cell-content'
      )
    ? element.parentElement
    : null;

  // Inside the database
  if (tempElement) {
    // If the database is empty
    if (isDatabase && model.isEmpty()) {
      result.flag = DropFlags.EmptyDatabase;
      const table = getDatabaseBlockTableElement(element);
      assertExists(table);
      const bounds = table.getBoundingClientRect();
      if (point.y < bounds.top) return result;
      const header = getDatabaseBlockColumnHeaderElement(element);
      assertExists(header);
      const headerBounds = header.getBoundingClientRect();
      result.rect = new DOMRect(
        headerBounds.left,
        headerBounds.bottom,
        result.rect.width,
        1
      );
    } else {
      result.flag = DropFlags.Database;
      result.rect = tempElement.getBoundingClientRect();
    }
  }

  return result;
}

/**
 * Returns `true` if the target is `Element`.
 */
export function isElement(target: EventTarget | null) {
  return target && target instanceof Element;
}

/**
 * Returns `true` if the target is `affine-selected-blocks`.
 */
export function isSelectedBlocks(target: Element) {
  return target.tagName === 'AFFINE-SELECTED-BLOCKS';
}

/**
 * Returns `true` if the target is `affine-drag-handle`.
 */
export function isDragHandle(target: Element) {
  return target.tagName === 'AFFINE-DRAG-HANDLE';
}

/**
 * Returns `true` if block elements have database block element.
 */
export function hasDatabase(elements: Element[]) {
  return elements.some(isDatabase);
}
