import type { RichText } from '@blocksuite/affine-components/rich-text';
import type { Rect } from '@blocksuite/affine-shared/utils';
import type {
  BlockComponent,
  EditorHost,
  ViewStore,
} from '@blocksuite/block-std';
import type { Point } from '@blocksuite/global/utils';
import type { InlineEditor } from '@blocksuite/inline';
import type { BlockModel } from '@blocksuite/store';

import {
  clamp,
  findAncestorModel,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { Loader } from '../../_common/components/loader.js';
import type { NoteBlockModel, RootBlockComponent } from '../../index.js';
import type { PageRootBlockComponent } from '../../root-block/page/page-root-block.js';

import {
  BLOCK_ID_ATTR as ATTR,
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT as PADDING_LEFT,
} from '../consts.js';

const ATTR_SELECTOR = `[${ATTR}]`;

// margin-top: calc(var(--affine-paragraph-space) + 24px);
// h1.margin-top = 8px + 24px = 32px;
const MAX_SPACE = 32;
const STEPS = MAX_SPACE / 2 / 2;

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
    console.error("Can't get next block! There's a loop in the block tree!");
    return null;
  }
  map[model.id] = true;

  const doc = model.doc;
  if (model.children.length) {
    return model.children[0];
  }
  let currentBlock: typeof model | null = model;
  while (currentBlock) {
    const nextSibling = doc.getNext(currentBlock);
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
    currentBlock = doc.getParent(currentBlock);
  }
  return null;
}

/**
 *
 * @example
 * ```md
 * doc
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
    const parent = model.doc.getParent(model);
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
      console.error(
        "Can't get previous block! There's a loop in the block tree!"
      );
      return null;
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
    current = current.doc.getParent(current);
  }
  return path;
}

export function blockComponentGetter(model: BlockModel, view: ViewStore) {
  if (matchFlavours(model, ['affine:image', 'affine:frame'])) {
    let current: BlockModel | null = model;
    let id: string | null = null;
    while (current) {
      // Top level image render under root block not surface block
      if (!matchFlavours(current, ['affine:surface'])) {
        id = current.id;
        break;
      }
      current = current.doc.getParent(current);
    }

    return view.getBlock(id || model.id);
  } else {
    return view.getBlock(model.id);
  }
}

export function getRootByElement(element: Element): RootBlockComponent | null {
  const pageRoot = getPageRootByElement(element);
  if (pageRoot) return pageRoot;

  const edgelessRoot = getEdgelessRootByElement(element);
  if (edgelessRoot) return edgelessRoot;

  return null;
}

export function getRootByEditorHost(
  editorHost: EditorHost
): RootBlockComponent | null {
  return (
    getPageRootByEditorHost(editorHost) ??
    getEdgelessRootByEditorHost(editorHost)
  );
}

/** If it's not in the page mode, it will return `null` directly */
export function getPageRootByElement(element: Element) {
  return element.closest('affine-page-root');
}

/** If it's not in the page mode, it will return `null` directly */
export function getPageRootByEditorHost(editorHost: EditorHost) {
  return editorHost.querySelector('affine-page-root');
}

/** If it's not in the edgeless mode, it will return `null` directly */
export function getEdgelessRootByElement(element: Element) {
  return element.closest('affine-edgeless-root');
}

/** If it's not in the edgeless mode, it will return `null` directly */
export function getEdgelessRootByEditorHost(editorHost: EditorHost) {
  return editorHost.querySelector('affine-edgeless-root');
}

export function isInsidePageEditor(host: EditorHost) {
  return Array.from(host.children).some(
    v => v.tagName.toLowerCase() === 'affine-page-root'
  );
}

export function isInsideEdgelessEditor(host: EditorHost) {
  return Array.from(host.children).some(
    v => v.tagName.toLowerCase() === 'affine-edgeless-root'
  );
}

/**
 * Get editor viewport element.
 * @example
 * ```ts
 * const viewportElement = getViewportElement(this.model.doc);
 * if (!viewportElement) return;
 * this._disposables.addFromEvent(viewportElement, 'scroll', () => {
 *   updatePosition();
 * });
 * ```
 */
export function getViewportElement(editorHost: EditorHost) {
  if (!isInsidePageEditor(editorHost)) return null;
  const doc = editorHost.doc;
  if (!doc.root) {
    console.error('Failed to get root doc');
    return null;
  }
  const rootComponent = editorHost.view.viewFromPath('block', [doc.root.id]);

  if (
    !rootComponent ||
    rootComponent.closest('affine-page-root') !== rootComponent
  ) {
    console.error('Failed to get viewport element!');
    return null;
  }
  return (rootComponent as PageRootBlockComponent).viewportElement;
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
  if (!model) return null;
  return getBlockComponentByPath(editorHost, model.id);
}

export function getBlockComponentByPath(
  editorHost: EditorHost,
  blockId: string
) {
  return editorHost.view.getBlock(blockId);
}

/**
 * Get block component by its model and wait for the doc element to finish updating.
 * Note that this function is used for compatibility only, and may be removed in the future.
 *
 * Use `std.view.getBlock` instead.
 * @deprecated
 */
export async function asyncGetBlockComponent(
  editorHost: EditorHost,
  id: string
): Promise<BlockComponent | null> {
  const rootBlockId = editorHost.doc.root?.id;
  if (!rootBlockId) return null;
  const rootComponent = editorHost.view.getBlock(rootBlockId);
  if (!rootComponent) return null;
  await rootComponent.updateComplete;

  return editorHost.view.getBlock(id);
}

/**
 * @deprecated In most cases, you not need RichText, you can use {@link getInlineEditorByModel} instead.
 */
export function getRichTextByModel(editorHost: EditorHost, id: string) {
  const blockComponent = editorHost.view.getBlock(id);
  const richText = blockComponent?.querySelector<RichText>('rich-text');
  if (!richText) return null;
  return richText;
}

export async function asyncGetRichText(editorHost: EditorHost, id: string) {
  const blockComponent = await asyncGetBlockComponent(editorHost, id);
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
  const richText = getRichTextByModel(editorHost, model.id);
  if (!richText) return null;
  return richText.inlineEditor;
}

export function getModelByElement(element: Element): BlockModel {
  const closestBlock = element.closest<BlockComponent>(ATTR_SELECTOR);
  assertExists(closestBlock, 'Cannot find block element by element');
  return getModelByBlockComponent(closestBlock);
}

export function getDocTitleByEditorHost(
  editorHost: EditorHost
): HTMLElement | null {
  const docViewport = editorHost.closest('.affine-page-viewport');
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
 * Returns `true` if element is default/edgeless page or note.
 */
function isRootOrNoteOrSurface(element: BlockComponent) {
  return matchFlavours(element.model, [
    'affine:page',
    'affine:note',
    'affine:surface',
  ]);
}

function isBlock(element: BlockComponent) {
  return !isRootOrNoteOrSurface(element);
}

function isImage({ tagName }: Element) {
  return tagName === 'AFFINE-IMAGE';
}

function isDatabase({ tagName }: Element) {
  return tagName === 'AFFINE-DATABASE-TABLE' || tagName === 'AFFINE-DATABASE';
}

function isEdgelessChildNote({ classList }: Element) {
  return classList.contains('note-background');
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
export function getClosestBlockComponentByPoint(
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
  element = findBlockComponent(
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
      bounds = getRectByBlockComponent(element);
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
    element = findBlockComponent(
      document.elementsFromPoint(point.x, point.y),
      container
    );

    if (element) {
      bounds = getRectByBlockComponent(element);
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
 * @param selector selector to find the block
 */
export function findClosestBlockComponent(
  container: BlockComponent,
  point: Point,
  selector: string
): BlockComponent | null {
  const children = (
    Array.from(container.querySelectorAll(selector)) as BlockComponent[]
  )
    .filter(child => child.host === container.host)
    .filter(child => child !== container);

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
export function getClosestBlockComponentByElement(
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
export function getRectByBlockComponent(element: Element | BlockComponent) {
  if (isDatabase(element)) return element.getBoundingClientRect();
  return (element.firstElementChild ?? element).getBoundingClientRect();
}

/**
 * Returns block elements excluding their subtrees.
 * Only keep block elements of same level.
 */
export function getBlockComponentsExcludeSubtrees(
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
function findBlockComponent(elements: Element[], parent?: Element) {
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
      return getClosestBlockComponentByElement(element);
    }
  }
  return null;
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
    rect: getRectByBlockComponent(element),
    flag: DropFlags.Normal,
  };

  const isDatabase = matchFlavours(model, ['affine:database']);

  if (isDatabase) {
    const table = getDatabaseBlockTableElement(element);
    if (!table) {
      return result;
    }
    let bounds = table.getBoundingClientRect();
    if (model.isEmpty.value) {
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

/**
 * Return `true` if the element has class name in the class list.
 */
export function hasClassNameInList(element: Element, classList: string[]) {
  return classList.some(className => element.classList.contains(className));
}

export function findNoteBlockModel(model: BlockModel) {
  return findAncestorModel(model, m =>
    matchFlavours(m, ['affine:note'])
  ) as NoteBlockModel | null;
}
