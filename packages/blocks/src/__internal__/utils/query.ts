import { assertExists, clamp } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import { matchFlavours } from '../../__internal__/utils/model.js';
import { type AbstractEditor } from '../../__internal__/utils/types.js';
import type { Loader } from '../../components/loader.js';
import type { DocPageBlockComponent } from '../../page-block/doc/doc-page-block.js';
import type { EdgelessCanvasTextEditor } from '../../page-block/edgeless/components/text/types.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import type { PageBlockComponent } from '../../page-block/types.js';
import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT as PADDING_LEFT,
  BLOCK_ID_ATTR as ATTR,
} from '../consts.js';
import type { RichText } from '../rich-text/rich-text.js';
import type { Rect } from './rect.js';
import { type Point } from './rect.js';

const ATTR_SELECTOR = `[${ATTR}]`;

// margin-top: calc(var(--affine-paragraph-space) + 24px);
// h1.margin-top = 8px + 24px = 32px;
const MAX_SPACE = 32;
const STEPS = MAX_SPACE / 2 / 2;

// Fix use unknown type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockComponentElement = BlockElement<any>;

interface ContainerBlock {
  model?: BaseBlockModel;
}

/**
 *
 * @example
 * ```md
 * page
 * - note
 *  - paragraph <- when invoked here, the traverse order will be following
 *    - child <- 1
 *  - sibling <- 2
 * - note <- 3 (will be skipped)
 *   - paragraph <- 4
 * ```
 *
 * NOTE: this method will skip the `affine:note` block
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
      if (matchFlavours(nextSibling, ['affine:note'])) {
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
 * - note
 *   - paragraph <- 5
 * - note <- 4 (will be skipped)
 *  - paragraph <- 3
 *    - child <- 2
 *      - child <- 1
 *  - paragraph <- when invoked here, the traverse order will be above
 * ```
 *
 * NOTE: this method will skip the `affine:note` and `affine:page` block
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
        'affine:note',
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
    // Assume children is not possible to be `affine:note` or `affine:page`
    return lastChild;
  }

  if (matchFlavours(previousBlock, ['affine:surface'])) {
    return getPreviousBlock(previousBlock);
  }

  return previousBlock;
}

/**
 * Returns `DefaultPageBlockComponent` | `EdgelessPageBlockComponent` if it exists
 * otherwise return `null`.
 */
export function getPageBlock(model: BaseBlockModel): PageBlockComponent | null {
  assertExists(model.page.root);
  return document.querySelector(`[${ATTR}="${model.page.root.id}"]`);
}

/**
 * If it's not in the page mode, it will return `null` directly.
 */
export function getDocPage(page: Page) {
  const editor = getEditorContainer(page);
  if (editor.mode !== 'page') return null;
  const pageComponent = editor.querySelector('affine-doc-page');
  return pageComponent;
}

/**
 * If it's not in the page mode, it will return `null` directly.
 */
export function getDocPageByElement(ele: Element) {
  const editor = getClosestEditorContainer(ele);
  if (editor.mode !== 'page') return null;
  const pageComponent = editor.querySelector('affine-doc-page');
  return pageComponent;
}

/**
 * If it's not in the edgeless mode, it will return `null` directly.
 */
export function getEdgelessPage(page: Page) {
  const editor = getEditorContainer(page);
  if (editor.mode !== 'edgeless') return null;
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

export const getClosestEditorContainer = (ele: Element) => {
  const editorContainer = ele.closest('editor-container');
  assertExists(editorContainer);
  return editorContainer as AbstractEditor;
};

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
  return editor.mode === 'page';
}

export function checkIsPageModeByDom(ele: Element) {
  const editor = ele?.closest('editor-container');
  if (!editor || !('mode' in editor)) {
    throw new Error('Failed to check page mode! Editor mode is not exists!');
  }
  return editor.mode === 'page';
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
    defaultPageBlock.closest('affine-doc-page') !== defaultPageBlock
  ) {
    throw new Error('Failed to get viewport element!');
  }
  return (defaultPageBlock as DocPageBlockComponent).viewportElement;
}

export function getBlockElementByModel(
  model: BaseBlockModel
): BlockComponentElement | null {
  assertExists(model.page.root);
  const pageElement = getPageBlock(model);
  if (!pageElement) return null;

  if (model.id === model.page.root.id) {
    return pageElement;
  }

  return pageElement.querySelector<BlockComponentElement>(
    `[${ATTR}="${model.id}"]`
  );
}

export function asyncGetBlockElementByModel(
  model: BaseBlockModel
): Promise<BlockComponentElement | null> {
  assertExists(model.page.root);
  const pageElement = getPageBlock(model);
  if (!pageElement) return Promise.resolve(null);

  if (model.id === model.page.root.id) {
    return Promise.resolve(pageElement);
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
      const blockElement = pageElement.querySelector<BlockComponentElement>(
        `[${ATTR}="${model.id}"]`
      );
      if (blockElement) {
        onSuccess(blockElement);
      }
    });

    observer.observe(pageElement, {
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
  if (matchFlavours(model, ['affine:database'])) {
    // Not support database model since it's may be have multiple Virgo instances.
    // Support to enter the editing state through the Enter key in the database.
    return null;
  }
  const richText = getRichTextByModel(model);
  if (!richText) return null;
  return richText.vEditor;
}

export async function asyncGetVirgoByModel(model: BaseBlockModel) {
  if (matchFlavours(model, ['affine:database'])) {
    // Not support database model since it's may be have multiple Virgo instances.
    throw new Error('Cannot get virgo by database model!');
  }
  const richText = await asyncGetRichTextByModel(model);
  if (!richText) return null;
  return richText.vEditor;
}

export function getModelByElement(element: Element): BaseBlockModel {
  const closestBlock = element.closest(ATTR_SELECTOR);
  assertExists(closestBlock, 'Cannot find block element by element');
  return getModelByBlockElement(closestBlock);
}

export function isInsidePageTitle(element: unknown): boolean {
  const editor = document.querySelector('editor-container');
  const titleElement = (editor ?? document).querySelector(
    '[data-block-is-title="true"]'
  );
  if (!titleElement) return false;

  return titleElement.contains(element as Node);
}

export function isInsideEdgelessTextEditor(element: unknown): boolean {
  const editor = document.querySelector('editor-container');
  const textElement = getEdgelessCanvasTextEditor(editor ?? document);
  if (!textElement) return false;

  return textElement.contains(element as Node);
}

export function isDatabaseInput(element: unknown): boolean {
  return (
    element instanceof HTMLElement &&
    element.getAttribute('data-virgo-root') === 'true' &&
    !!element.closest('affine-database')
  );
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
 * Returns `true` if element has `data-block-id` attribute.
 */
function hasBlockId(element: Element): element is BlockComponentElement {
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
 *
 * @deprecated Use context instead. The edgeless page may be customized by the user so it's not recommended to use this method. \
 */
export function isEdgelessPage(
  element: Element
): element is EdgelessPageBlockComponent {
  return element.tagName === 'AFFINE-EDGELESS-PAGE';
}

/**
 * Returns `true` if element is default/edgeless page or note.
 */
function isPageOrNoteOrSurface(element: Element) {
  return (
    isDefaultPage(element) ||
    isEdgelessPage(element) ||
    isNote(element) ||
    isSurface(element)
  );
}

/**
 * Returns `true` if element is not page or note.
 */
function isBlock(element: BlockComponentElement) {
  return !isPageOrNoteOrSurface(element);
}

/**
 * Returns `true` if element is image.
 */
export function isImage({ tagName }: Element) {
  return tagName === 'AFFINE-IMAGE';
}

/**
 * Returns `true` if element is note.
 */
function isNote({ tagName }: Element) {
  return tagName === 'AFFINE-NOTE';
}

/**
 * Returns `true` if element is surface.
 */
function isSurface({ tagName }: Element) {
  return tagName === 'AFFINE-SURFACE';
}

/**
 * Returns `true` if element is database.
 */
function isDatabase({ tagName }: Element) {
  return tagName === 'AFFINE-DATABASE-TABLE' || tagName === 'AFFINE-DATABASE';
}

/**
 * Returns `true` if element is edgeless child note.
 */
export function isEdgelessChildNote({ classList }: Element) {
  return classList.contains('affine-edgeless-child-note');
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
    snapToEdge?: {
      x: boolean;
      y: boolean;
    };
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
    const {
      snapToEdge = {
        x: true,
        y: false,
      },
    } = state;
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
      if (rows) {
        childBounds = rows.getBoundingClientRect();

        if (childBounds.height) {
          if (point.y < childBounds.top || point.y > childBounds.bottom) {
            return element;
          }
          childBounds = null;
        } else {
          return element;
        }
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
 * Find the most close block on the given position
 * @param container container which the blocks can be found inside
 * @param point position
 */
export function findClosestBlockElement(
  container: BlockComponentElement,
  point: Point,
  selector: string
) {
  const children = Array.from(container.querySelectorAll(selector));
  let lastDistance = Number.POSITIVE_INFINITY;
  let lastChild = null;

  if (!children.length) return null;

  for (const child of children) {
    const rect = child.getBoundingClientRect();
    if (rect.height === 0 || point.y > rect.bottom || point.y < rect.top)
      continue;
    const distance =
      Math.pow(point.y - (rect.y + rect.height / 2), 2) +
      Math.pow(point.x - rect.x, 2);

    if (distance <= lastDistance) {
      lastDistance = distance;
      lastChild = child;
    } else {
      return lastChild;
    }
  }

  return lastChild;
}

/**
 * Returns the closest block element by element that does not contain the page element and note element.
 */
export function getClosestBlockElementByElement(
  element: Element | null
): BlockComponentElement | null {
  if (!element) return null;
  if (hasBlockId(element) && isBlock(element)) {
    return element;
  }
  const blockElement = element.closest<BlockComponentElement>(ATTR_SELECTOR);
  if (blockElement && isBlock(blockElement)) {
    return blockElement;
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
  return Array.from(
    element.querySelectorAll<BlockComponentElement>(ATTR_SELECTOR)
  ).filter(isBlock);
}

/**
 * Returns the block element by id with the parent.
 */
export function getBlockElementById(
  id: string,
  parent: BlockComponentElement | Document | Element = document
) {
  return parent.querySelector(`[${ATTR}="${id}"]`);
}

/**
 * Returns the closest note block element by id with the parent.
 */
export function getClosestNoteBlockElementById(
  id: string,
  parent: BlockComponentElement | Document | Element = document
) {
  const element = getBlockElementById(id, parent);
  if (!element) return null;
  if (isNote(element)) return element;
  return element.closest('affine-note');
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
    if (isImage(element)) {
      const element = elements[i];
      if (i < len && hasBlockId(element) && isBlock(element)) {
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
 * Get hovering note with given a point in edgeless mode.
 */
export function getHoveringNote(point: Point) {
  return (
    document.elementsFromPoint(point.x, point.y).find(isEdgelessChildNote) ||
    null
  );
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

  if (isDatabase) {
    const table = getDatabaseBlockTableElement(element);
    assertExists(table);
    let bounds = table.getBoundingClientRect();
    if (model.isEmpty()) {
      result.flag = DropFlags.EmptyDatabase;

      if (point.y < bounds.top) return result;

      const header = getDatabaseBlockColumnHeaderElement(element);
      assertExists(header);
      bounds = header.getBoundingClientRect();
      result.rect = new DOMRect(
        result.rect.left,
        bounds.bottom,
        result.rect.width,
        1
      );
    } else {
      result.flag = DropFlags.Database;
      const rows = getDatabaseBlockRowsElement(element);
      assertExists(rows);
      const rowsBounds = rows.getBoundingClientRect();

      if (point.y < rowsBounds.top || point.y > rowsBounds.bottom)
        return result;

      const elements = document.elementsFromPoint(point.x, point.y);
      const len = elements.length;
      let e;
      let i = 0;
      for (; i < len; i++) {
        e = elements[i];

        if (e.classList.contains('affine-database-block-row-cell-content')) {
          result.rect = getCellRect(e, bounds);
          return result;
        }

        if (e.classList.contains('affine-database-block-row')) {
          e = e.querySelector(ATTR_SELECTOR);
          assertExists(e);
          result.rect = getCellRect(e, bounds);
          return result;
        }
      }
    }
  } else {
    const parent = element.parentElement;
    if (parent?.classList.contains('affine-database-block-row-cell-content')) {
      result.flag = DropFlags.Database;
      result.rect = getCellRect(parent);
      return result;
    }
  }

  return result;
}

function getCellRect(element: Element, bounds?: DOMRect) {
  if (!bounds) {
    const table = element.closest('.affine-database-block-table');
    assertExists(table);
    bounds = table.getBoundingClientRect();
  }
  // affine-database-block-row-cell
  const col = element.parentElement;
  assertExists(col);
  // affine-database-block-row
  const row = col.parentElement;
  assertExists(row);
  const colRect = col.getBoundingClientRect();
  return new DOMRect(
    bounds.left,
    colRect.top,
    colRect.right - bounds.left,
    colRect.height
  );
}

export function getEdgelessCanvasTextEditor(element: Element | Document) {
  return element.querySelector(
    'edgeless-text-editor,edgeless-shape-text-editor'
  ) as EdgelessCanvasTextEditor | null;
}

/**
 * Return `true` if the element has class name in the class list.
 */
export function hasClassNameInList(element: Element, classList: string[]) {
  return classList.some(className => element.classList.contains(className));
}
