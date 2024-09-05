import type { Doc } from '@blocksuite/store';

import { nToLast } from '@blocksuite/global/utils';

import type { GfxBlockElementModel, GfxModel } from '../gfx/gfx-block-model.js';
import type { Layer } from '../gfx/layer.js';
import type { SurfaceBlockModel } from '../gfx/surface/surface-model.js';

import {
  type GfxContainerElement,
  isGfxContainerElm,
} from '../gfx/surface/element-model.js';

export function getLayerEndZIndex(layers: Layer[], layerIndex: number) {
  const layer = layers[layerIndex];
  return layer
    ? layer.type === 'block'
      ? layer.zIndex + layer.elements.length - 1
      : layer.zIndex
    : 1;
}

export function updateLayersZIndex(layers: Layer[], startIdx: number) {
  const startLayer = layers[startIdx];
  let curIndex = startLayer.zIndex;

  for (let i = startIdx; i < layers.length; ++i) {
    const curLayer = layers[i];

    curLayer.zIndex = curIndex;
    curIndex += curLayer.type === 'block' ? curLayer.elements.length : 1;
  }
}

export function getElementIndex(indexable: GfxModel) {
  const groups = indexable.groups as GfxContainerElement[];

  if (groups.length) {
    const groupIndexes = groups
      .map(group => group.index)
      .reverse()
      .join('-');

    return `${groupIndexes}-${indexable.index}`;
  }

  return indexable.index;
}

export function ungroupIndex(index: string) {
  return index.split('-')[0];
}

export function insertToOrderedArray(array: GfxModel[], element: GfxModel) {
  let idx = 0;
  while (
    idx < array.length &&
    [SortOrder.BEFORE, SortOrder.SAME].includes(compare(array[idx], element))
  ) {
    ++idx;
  }

  array.splice(idx, 0, element);
}

export function removeFromOrderedArray(array: GfxModel[], element: GfxModel) {
  const idx = array.indexOf(element);

  if (idx !== -1) {
    array.splice(idx, 1);
  }
}

export enum SortOrder {
  AFTER = 1,
  BEFORE = -1,
  SAME = 0,
}

export function isInRange(edges: [GfxModel, GfxModel], target: GfxModel) {
  return compare(target, edges[0]) >= 0 && compare(target, edges[1]) < 0;
}

export function renderableInEdgeless(
  doc: Doc,
  surface: SurfaceBlockModel,
  block: GfxBlockElementModel
) {
  const parent = doc.getParent(block);

  return parent === doc.root || parent === surface;
}

/**
 * A comparator function for sorting elements in the surface.
 * SortOrder.AFTER means a should be rendered after b and so on.
 * @returns
 */
export function compare(a: GfxModel, b: GfxModel) {
  if (isGfxContainerElm(a) && a.hasDescendant(b)) {
    return SortOrder.BEFORE;
  } else if (isGfxContainerElm(b) && b.hasDescendant(a)) {
    return SortOrder.AFTER;
  } else {
    const aGroups = a.groups as GfxContainerElement[];
    const bGroups = b.groups as GfxContainerElement[];

    let i = 1;
    let aGroup: GfxModel | GfxContainerElement | undefined = nToLast(
      aGroups,
      i
    );
    let bGroup: GfxModel | GfxContainerElement | undefined = nToLast(
      bGroups,
      i
    );

    while (aGroup === bGroup && aGroup) {
      ++i;
      aGroup = nToLast(aGroups, i);
      bGroup = nToLast(bGroups, i);
    }

    aGroup = aGroup ?? a;
    bGroup = bGroup ?? b;

    return aGroup.index === bGroup.index
      ? SortOrder.SAME
      : aGroup.index < bGroup.index
        ? SortOrder.BEFORE
        : SortOrder.AFTER;
  }
}
