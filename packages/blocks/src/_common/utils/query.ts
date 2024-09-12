import type { Point } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import {
  getRectByBlockComponent,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { BLOCK_ID_ATTR, type EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { RootBlockComponent } from '../../index.js';

const ATTR_SELECTOR = `[${BLOCK_ID_ATTR}]`;

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

/**
 * Get block component by model.
 * Note that this function is used for compatibility only, and may be removed in the future.
 *
 * @deprecated
 */
export function getBlockComponentByModel(
  editorHost: EditorHost,
  model: BlockModel | null
) {
  if (!model) return null;
  return editorHost.view.getBlock(model.id);
}

function isEdgelessChildNote({ classList }: Element) {
  return classList.contains('note-background');
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
