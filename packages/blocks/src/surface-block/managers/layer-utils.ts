import type { Doc } from '@blocksuite/store';

import type {
  EdgelessBlockModel,
  EdgelessModel,
} from '../../root-block/edgeless/type.js';
import { GroupLikeModel } from '../element-model/base.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import type { Layer } from './layer-manager.js';

export function getLayerZIndex(layers: Layer[], layerIndex: number) {
  const layer = layers[layerIndex];
  return layer
    ? layer.type === 'block'
      ? layer.zIndexes[1]
      : layer.zIndexes
    : 1;
}

export function updateLayersIndex(layers: Layer[], startIdx: number) {
  const startLayer = layers[startIdx];
  let curIndex =
    startLayer.type === 'block' ? startLayer.zIndexes[1] : startLayer.zIndexes;

  for (let i = startIdx; i < layers.length; ++i) {
    const curLayer = layers[i];

    if (curLayer.type === 'block') {
      curLayer.zIndexes = [curIndex, curIndex + curLayer.elements.length];
      curIndex += curLayer.elements.length;
    } else {
      curLayer.zIndexes = curIndex;
      curIndex += 1;
    }
  }
}

export function getElementIndex(indexable: EdgelessModel) {
  const groups = indexable.groups;

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
  array: EdgelessModel[],
  element: EdgelessModel
) {
  let idx = 0;
  while (idx < array.length && compare(array[idx], element) < 0) {
    ++idx;
  }

  array.splice(idx, 0, element);
}

export function removeFromOrderedArray(
  array: EdgelessModel[],
  element: EdgelessModel
) {
  const idx = array.indexOf(element);

  if (idx !== -1) {
    array.splice(idx, 1);
  }
}

export function isInRange(
  edges: [EdgelessModel, EdgelessModel],
  target: EdgelessModel
) {
  return compare(target, edges[0]) >= 0 && compare(target, edges[1]) < 0;
}

export function renderableInEdgeless(
  doc: Doc,
  surface: SurfaceBlockModel,
  block: EdgelessBlockModel
) {
  const parent = doc.getParent(block);

  return parent === doc.root || parent === surface;
}

export function compare(a: EdgelessModel, b: EdgelessModel) {
  if (a instanceof GroupLikeModel && a.hasDescendant(b)) {
    return -1;
  } else if (b instanceof GroupLikeModel && b.hasDescendant(a)) {
    return 1;
  } else {
    const aGroups = a.groups;
    const bGroups = b.groups;
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
