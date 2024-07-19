import type { Doc } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';
import type { Layer } from './layer-manager.js';

import { SurfaceGroupLikeModel } from '../element-model/base.js';

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

export function getElementIndex(indexable: BlockSuite.EdgelessModelType) {
  const groups = indexable.groups as BlockSuite.SurfaceGroupLikeModelType[];

  if (groups.length > 1) {
    return (
      groups
        .map(group => group.index)
        .reverse()
        .slice(1)
        .join('-') + `-${indexable.index}`
    );
  }

  return indexable.index;
}

export function ungroupIndex(index: string) {
  return index.split('-')[0];
}

export function insertToOrderedArray(
  array: BlockSuite.EdgelessModelType[],
  element: BlockSuite.EdgelessModelType
) {
  let idx = 0;
  while (idx < array.length && compare(array[idx], element) < 0) {
    ++idx;
  }

  array.splice(idx, 0, element);
}

export function removeFromOrderedArray(
  array: BlockSuite.EdgelessModelType[],
  element: BlockSuite.EdgelessModelType
) {
  const idx = array.indexOf(element);

  if (idx !== -1) {
    array.splice(idx, 1);
  }
}

export function isInRange(
  edges: [BlockSuite.EdgelessModelType, BlockSuite.EdgelessModelType],
  target: BlockSuite.EdgelessModelType
) {
  return compare(target, edges[0]) >= 0 && compare(target, edges[1]) < 0;
}

export function renderableInEdgeless(
  doc: Doc,
  surface: SurfaceBlockModel,
  block: BlockSuite.EdgelessBlockModelType
) {
  const parent = doc.getParent(block);

  return parent === doc.root || parent === surface;
}

export function compare(
  a: BlockSuite.EdgelessModelType,
  b: BlockSuite.EdgelessModelType
) {
  if (a instanceof SurfaceGroupLikeModel && a.hasDescendant(b)) {
    return -1;
  } else if (b instanceof SurfaceGroupLikeModel && b.hasDescendant(a)) {
    return 1;
  } else {
    const aGroups = a.groups as BlockSuite.SurfaceGroupLikeModelType[];
    const bGroups = b.groups as BlockSuite.SurfaceGroupLikeModelType[];
    const minGroups = Math.min(aGroups.length, bGroups.length);

    for (let i = 0; i < minGroups; ++i) {
      if (aGroups[i] !== bGroups[i]) {
        const aGroup = aGroups[i] ?? a;
        const bGroup = bGroups[i] ?? b;

        return aGroup.index === bGroup.index
          ? 0
          : aGroup.index < bGroup.index
            ? -1
            : 1;
      }
    }

    if (a.index < b.index) return -1;
    else if (a.index > b.index) return 1;
    return 0;
  }
}
