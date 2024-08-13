import type { RichText } from '@blocksuite/affine-components/rich-text';
import type {
  BlockComponent,
  EditorHost,
  ViewStore,
} from '@blocksuite/block-std';
import type { Point } from '@blocksuite/global/utils';
import type { InlineEditor } from '@blocksuite/inline';
import type { BlockModel } from '@blocksuite/store';

import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { RootBlockComponent } from '../../index.js';
import type { PageRootBlockComponent } from '../../root-block/page/page-root-block.js';

import { BLOCK_ID_ATTR } from '../consts.js';

const ATTR_SELECTOR = `[${BLOCK_ID_ATTR}]`;

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

export function getRootByEditorHost(
  editorHost: EditorHost
): RootBlockComponent | null {
  return (
    getPageRootByEditorHost(editorHost) ??
    getEdgelessRootByEditorHost(editorHost)
  );
}

/** If it's not in the page mode, it will return `null` directly */
export function getPageRootByEditorHost(editorHost: EditorHost) {
  return editorHost.querySelector('affine-page-root');
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
  return editorHost.view.getBlock(model.id);
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

function isDatabase({ tagName }: Element) {
  return tagName === 'AFFINE-DATABASE-TABLE' || tagName === 'AFFINE-DATABASE';
}

function isEdgelessChildNote({ classList }: Element) {
  return classList.contains('note-background');
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
