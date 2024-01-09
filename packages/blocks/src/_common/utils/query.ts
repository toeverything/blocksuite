import type { ViewStore } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { InlineEditor } from '@blocksuite/inline';
import { INLINE_ROOT_ATTR } from '@blocksuite/inline';
import type { BlockElement, EditorHost } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';

import type { Loader } from '../../_common/components/loader.js';
import type { RichText } from '../../_common/components/rich-text/rich-text.js';
import type { PageBlockComponent } from '../../index.js';
import type { DocPageBlockComponent } from '../../page-block/doc/doc-page-block.js';
import type { EdgelessCanvasTextEditor } from '../../page-block/edgeless/components/text/types.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT as PADDING_LEFT,
  BLOCK_ID_ATTR as ATTR,
} from '../consts.js';
import { type AbstractEditor } from '../types.js';
import { clamp } from './math.js';
import { matchFlavours } from './model.js';
import type { Point, Rect } from './rect.js';

const ATTR_SELECTOR = `[${ATTR}]`;

// margin-top: calc(var(--affine-paragraph-space) + 24px);
// h1.margin-top = 8px + 24px = 32px;
const MAX_SPACE = 32;
const STEPS = MAX_SPACE / 2 / 2;

// Fix use unknown type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockComponent = BlockElement<any>;

interface ContainerBlock {
  model?: BlockModel;
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
  editorHost: EditorHost,
  model: BlockModel,
  map: Record<string, true> = {}
): BlockModel | null {
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
        // in edgeless mode, limit search for the next block within the same note
        if (isInsideEdgelessEditor(editorHost)) {
          return null;
        }

        return getNextBlock(editorHost, nextSibling);
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
 * NOTE: this method will just return blocks with `content` role
 */
export function getPreviousBlock(
  editorHost: EditorHost,
  model: BlockModel
): BlockModel | null {
  const getPrev = (model: BlockModel) => {
    const parent = model.page.getParent(model);
    if (!parent) return null;

    const index = parent.children.indexOf(model);
    if (index > 0) {
      let prev = parent.children[index - 1];
      while (prev.children.length > 0) {
        prev = prev.children[prev.children.length - 1];
      }
      return prev;
    }

    // in edgeless mode, limit search for the previous block within the same note
    if (
      isInsideEdgelessEditor(editorHost) &&
      matchFlavours(parent, ['affine:note'])
    ) {
      return null;
    }

    return parent;
  };

  const map: Record<string, true> = {};
  const iterate: (model: BlockModel) => BlockModel | null = (
    model: BlockModel
  ) => {
    if (model.id in map) {
      throw new Error(
        "Can't get previous block! There's a loop in the block tree!"
      );
    }
    map[model.id] = true;

    const prev = getPrev(model);
    if (prev) {
      if (prev.role === 'content' && !matchFlavours(prev, ['affine:frame'])) {
        return prev;
      } else {
        return iterate(prev);
      }
    } else {
      return null;
    }
  };

  return iterate(model);
}

/**
 * This function is used to build model's "normal" block path.
 * If this function does not meet your needs, you may need to build path manually to satisfy your needs.
 * You should not modify this function.
 */
export function buildPath(model: BlockModel | null): string[] {
  const path: string[] = [];
  let current = model;
  while (current) {
    path.unshift(current.id);
    current = current.page.getParent(current);
  }
  return path;
}

export function blockElementGetter(model: BlockModel, view: ViewStore) {
  if (matchFlavours(model, ['affine:image', 'affine:frame'])) {
    let current: BlockModel | null = model;
    const path: string[] = [];
    while (current) {
      // Top level image render under page block not surface block
      if (!matchFlavours(current, ['affine:surface'])) {
        path.unshift(current.id);
      }
      current = current.page.getParent(current);
    }

    return view.viewFromPath('block', path);
  } else {
    return view.viewFromPath('block', buildPath(model));
  }
}

export function getPageByElement(element: Element): PageBlockComponent | null {
  const docPageElement = getDocPageByElement(element);
  if (docPageElement) return docPageElement;

  const edgelessPageElement = getEdgelessPageByElement(element);
  if (edgelessPageElement) return edgelessPageElement;

  return null;
}

export function getPageByEditorHost(
  editorHost: EditorHost
): PageBlockComponent | null {
  if (isInsideDocEditor(editorHost)) {
    return getDocPageByEditorHost(editorHost);
  }

  if (isInsideEdgelessEditor(editorHost)) {
    return getEdgelessPageByEditorHost(editorHost);
  }

  return null;
}

/** If it's not in the page mode, it will return `null` directly */
export function getDocPageByElement(element: Element) {
  return element.closest('affine-doc-page');
}

/** If it's not in the page mode, it will return `null` directly */
export function getDocPageByEditorHost(editorHost: EditorHost) {
  return editorHost.querySelector('affine-doc-page');
}

/** If it's not in the edgeless mode, it will return `null` directly */
export function getEdgelessPageByElement(element: Element) {
  return element.closest('affine-edgeless-page');
}

/** If it's not in the edgeless mode, it will return `null` directly */
export function getEdgelessPageByEditorHost(editorHost: EditorHost) {
  return editorHost.querySelector('affine-edgeless-page');
}

/** @deprecated */
export function getEditorContainer(editorHost: EditorHost): AbstractEditor {
  const editorContainer = editorHost.closest('affine-editor-container');
  assertExists(editorContainer);
  return editorContainer as AbstractEditor;
}

export function isInsideDocEditor(host: EditorHost) {
  return !!host.closest('doc-editor');
}

export function isInsideEdgelessEditor(host: EditorHost) {
  return !!host.closest('edgeless-editor');
}

/**
 * Get editor viewport element.
 * @example
 * ```ts
 * const viewportElement = getViewportElement(this.model.page);
 * if (!viewportElement) return;
 * this._disposables.addFromEvent(viewportElement, 'scroll', () => {
 *   updatePosition();
 * });
 * ```
 */
export function getViewportElement(editorHost: EditorHost) {
  if (!isInsideDocEditor(editorHost)) return null;
  const page = editorHost.page;
  assertExists(page.root);
  const pageComponent = editorHost.view.viewFromPath('block', [page.root.id]);

  if (
    !pageComponent ||
    pageComponent.closest('affine-doc-page') !== pageComponent
  ) {
    throw new Error('Failed to get viewport element!');
  }
  return (pageComponent as DocPageBlockComponent).viewportElement;
}

/**
 * Get block component by model.
 * Note that this function is used for compatibility only, and may be removed in the future.
 *
 * Use `root.view.viewFromPath` instead.
 * @deprecated
 */
export function getBlockComponentByModel(
  editorHost: EditorHost,
  model: BlockModel | null
) {
  return getBlockComponentByPath(editorHost, buildPath(model));
}

export function getBlockComponentByPath(
  editorHost: EditorHost,
  path: string[]
) {
  return editorHost.view.viewFromPath('block', path);
}

/**
 * Get block component by its model and wait for the page element to finish updating.
 * Note that this function is used for compatibility only, and may be removed in the future.
 *
 * Use `root.view.viewFromPath` instead.
 * @deprecated
 */
export async function asyncGetBlockComponentByModel(
  editorHost: EditorHost,
  model: BlockModel
): Promise<BlockComponent | null> {
  assertExists(model.page.root);
  const pageComponent = getPageByEditorHost(editorHost);
  if (!pageComponent) return null;
  await pageComponent.updateComplete;

  if (model.id === model.page.root.id) {
    return pageComponent;
  }

  const blockComponent = editorHost.view.viewFromPath(
    'block',
    buildPath(model)
  );
  return blockComponent;
}

/**
 * @deprecated In most cases, you not need RichText, you can use {@link getInlineEditorByModel} instead.
 */
export function getRichTextByModel(editorHost: EditorHost, model: BlockModel) {
  const blockComponent = editorHost.view.viewFromPath(
    'block',
    buildPath(model)
  );
  const richText = blockComponent?.querySelector<RichText>('rich-text');
  if (!richText) return null;
  return richText;
}

export async function asyncGetRichTextByModel(
  editorHost: EditorHost,
  model: BlockModel
) {
  const blockComponent = await asyncGetBlockComponentByModel(editorHost, model);
  if (!blockComponent) return null;
  await blockComponent.updateComplete;
  const richText = blockComponent?.querySelector<RichText>('rich-text');
  if (!richText) return null;
  return richText;
}

export function getInlineEditorByModel(
  editorHost: EditorHost,
  model: BlockModel
) {
  if (matchFlavours(model, ['affine:database'])) {
    // Not support database model since it's may be have multiple inline editor instances.
    // Support to enter the editing state through the Enter key in the database.
    return null;
  }
  const richText = getRichTextByModel(editorHost, model);
  if (!richText) return null;
  return richText.inlineEditor;
}

export async function asyncGetInlineEditorByModel(
  editorHost: EditorHost,
  model: BlockModel
) {
  if (matchFlavours(model, ['affine:database'])) {
    // Not support database model since it's may be have multiple inline editor instances.
    throw new Error('Cannot get inline editor by database model!');
  }
  const richText = await asyncGetRichTextByModel(editorHost, model);
  if (!richText) return null;
  return richText.inlineEditor;
}

export function getModelByElement(element: Element): BlockModel {
  const closestBlock = element.closest(ATTR_SELECTOR);
  assertExists(closestBlock, 'Cannot find block element by element');
  return getModelByBlockComponent(closestBlock);
}

export function getDocTitleByEditorHost(
  editorHost: EditorHost
): HTMLElement | null {
  const docViewport = editorHost.closest('.affine-doc-viewport');
  if (!docViewport) return null;
  return docViewport.querySelector('doc-title');
}

export function getDocTitleInlineEditor(
  editorHost: EditorHost
): InlineEditor | null {
  const docTitle = getDocTitleByEditorHost(editorHost);
  if (!docTitle) return null;
  const titleRichText = docTitle.querySelector<RichText>('rich-text');
  assertExists(titleRichText);
  return titleRichText.inlineEditor;
}

export function isInsideDocTitle(
  editorHost: EditorHost,
  element: unknown
): boolean {
  const titleElement = getDocTitleByEditorHost(editorHost);
  if (!titleElement) return false;
  return titleElement.contains(element as Node);
}

export function isInsideEdgelessTextEditor(
  editorHost: EditorHost,
  element: unknown
): boolean {
  const edgelessPageElement = getEdgelessPageByEditorHost(editorHost);
  const textElement = getEdgelessCanvasTextEditor(
    edgelessPageElement ?? document
  );
  if (!textElement) return false;

  return textElement.contains(element as Node);
}

export function isDatabaseInput(element: unknown): boolean {
  return (
    element instanceof HTMLElement &&
    element.getAttribute(INLINE_ROOT_ATTR) === 'true' &&
    !!element.closest('affine-database')
  );
}

/**
 * Returns `16` if node is contained in the parent.
 * Otherwise return `0`.
 */
function contains(parent: Element, node: Element) {
  return (
    parent.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
  );
}

/**
 * Returns `true` if element has `data-block-id` attribute.
 */
function hasBlockId(element: Element): element is BlockComponent {
  return element.hasAttribute(ATTR);
}

/**
 * Returns `true` if element is doc page.
 */
function isDocPage({ tagName }: Element) {
  return tagName === 'AFFINE-DOC-PAGE';
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
    isDocPage(element) ||
    isEdgelessPage(element) ||
    isNote(element) ||
    isSurface(element)
  );
}

function isBlock(element: BlockComponent) {
  return !isPageOrNoteOrSurface(element);
}

function isImage({ tagName }: Element) {
  return tagName === 'AFFINE-IMAGE';
}

function isNote({ tagName }: Element) {
  return tagName === 'AFFINE-NOTE';
}

function isSurface({ tagName }: Element) {
  return tagName === 'AFFINE-SURFACE';
}

function isDatabase({ tagName }: Element) {
  return tagName === 'AFFINE-DATABASE-TABLE' || tagName === 'AFFINE-DATABASE';
}

function isEdgelessChildNote({ classList }: Element) {
  return classList.contains('edgeless-block-portal-note');
}

function isEdgelessChildImage({ classList }: Element) {
  return classList.contains('edgeless-block-portal-image');
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
  container: BlockComponent,
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
): BlockComponent | null {
  if (!element) return null;
  if (hasBlockId(element) && isBlock(element)) {
    return element;
  }
  const blockComponent = element.closest<BlockComponent>(ATTR_SELECTOR);
  if (blockComponent && isBlock(blockComponent)) {
    return blockComponent;
  }
  return null;
}

/**
 * Returns the model of the block element.
 */
export function getModelByBlockComponent(component: Element) {
  const containerBlock = component as ContainerBlock;
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
 * Returns rect of the block element.
 *
 * Compatible with Safari!
 * https://github.com/toeverything/blocksuite/issues/902
 * https://github.com/toeverything/blocksuite/pull/1121
 */
export function getRectByBlockElement(element: Element | BlockComponent) {
  if (isDatabase(element)) return element.getBoundingClientRect();
  return (element.firstElementChild ?? element).getBoundingClientRect();
}

/**
 * Returns block elements excluding their subtrees.
 * Only keep block elements of same level.
 */
export function getBlockElementsExcludeSubtrees(
  elements: Element[] | BlockComponent[]
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

export function getThemeMode(): 'light' | 'dark' {
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
 * Get hovering top level image with given a point in edgeless mode.
 */
export function getHoveringImage(point: Point) {
  return (
    document.elementsFromPoint(point.x, point.y).find(isEdgelessChildImage) ||
    null
  );
}

/**
 * Gets the table of the database.
 */
function getDatabaseBlockTableElement(element: Element) {
  return element.querySelector('.affine-database-block-table');
}

/**
 * Gets the column header of the database.
 */
function getDatabaseBlockColumnHeaderElement(element: Element) {
  return element.querySelector('.affine-database-column-header');
}

/**
 * Gets the rows of the database.
 */
function getDatabaseBlockRowsElement(element: Element) {
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
  model: BlockModel,
  element: Element
): {
  rect: DOMRect;
  flag: DropFlags;
} {
  const result = {
    rect: getRectByBlockElement(element),
    flag: DropFlags.Normal,
  };

  const isDatabase = matchFlavours(model, ['affine:database']);

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
