import type { GfxModel } from '../gfx/model/model.js';

import {
  type GfxContainerElement,
  isGfxContainerElm,
} from '../gfx/model/surface/container-element.js';

/**
 * Get the top elements from the list of elements, which are in some tree structures.
 *
 * For example: a list `[C1, E1, C2, E2, E2, E3, E4, C4, E6]`,
 * and they are in the elements tree like:
 * ```
 *     C1         C4      E6
 *    /  \        |
 *  E1   C2       E5
 *       / \
 *      E2  C3*
 *         / \
 *        E3 E4
 * ```
 * where the star symbol `*` denote it is not in the list.
 *
 * The result should be `[F1, F2, E6, E3, E4]`.
 */
export function getTopElements(elements: GfxModel[]): GfxModel[] {
  const results = new Set(elements);

  elements = [...new Set(elements)];

  elements.forEach(e1 => {
    elements.forEach(e2 => {
      if (isGfxContainerElm(e1) && e1.hasDescendant(e2)) {
        results.delete(e2);
      }
    });
  });

  return [...results];
}

function traverse(
  element: GfxModel,
  preCallback?: (element: GfxModel) => void | boolean,
  postCallBack?: (element: GfxModel) => void
) {
  // avoid infinite loop caused by circular reference
  const visited = new Set<GfxModel>();

  const innerTraverse = (element: GfxModel) => {
    if (visited.has(element)) return;
    visited.add(element);

    if (preCallback) {
      const interrupt = preCallback(element);
      if (interrupt) return;
    }

    if (isGfxContainerElm(element)) {
      element.childElements.forEach(child => {
        innerTraverse(child);
      });
    }

    postCallBack && postCallBack(element);
  };

  innerTraverse(element);
}

export function getAncestorContainersImpl(element: GfxModel) {
  const containers: (GfxContainerElement & GfxModel)[] = [];

  let container = element.container;
  while (container) {
    containers.push(container);
    container = container.container;
  }

  return containers;
}

export function descendantElementsImpl(
  container: GfxContainerElement
): GfxModel[] {
  const results: GfxModel[] = [];
  container.childElements.forEach(child => {
    traverse(child, element => {
      results.push(element);
    });
  });
  return results;
}

export function hasDescendantElementImpl(
  container: GfxContainerElement,
  element: GfxModel
): boolean {
  let _container = element.container;
  while (_container) {
    if (_container === container) return true;
    _container = _container.container;
  }
  return false;
}

/**
 * This checker is used to prevent circular reference, when adding a child element to a container.
 */
export function canSafeAddToContainer(
  container: GfxContainerElement & GfxModel,
  element: GfxModel
) {
  if (
    element === container ||
    (isGfxContainerElm(element) && element.hasDescendant(container))
  ) {
    return false;
  }
  return true;
}
