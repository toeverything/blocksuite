import type { EdgelessElement } from '../../_common/utils/types.js';
import type { FrameBlockModel } from '../../models.js';
import type { CanvasElement } from '../index.js';
import { compare, getGroups } from './group-manager.js';
import type { Indexable, IndexableBlock, Layer } from './layer-manager.js';

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

export function getElementIndex(indexable: Indexable | FrameBlockModel) {
  const groups = getGroups(indexable);

  if (groups.length > 1) {
    return (
      groups
        .map(group => group.group.index)
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
  array: EdgelessElement[],
  element: EdgelessElement
) {
  let idx = 0;
  while (idx < array.length && compare(array[idx], element) < 0) {
    ++idx;
  }

  array.splice(idx, 0, element);
}

export function removeFromOrderedArray(
  array: EdgelessElement[],
  element: EdgelessElement
) {
  const idx = array.indexOf(element);

  if (idx !== -1) {
    array.splice(idx, 1);
  }
}

export function isInRange(
  edges: [IndexableBlock | CanvasElement, IndexableBlock | CanvasElement],
  target: IndexableBlock | CanvasElement
) {
  return compare(target, edges[0]) >= 0 && compare(target, edges[1]) < 0;
}
