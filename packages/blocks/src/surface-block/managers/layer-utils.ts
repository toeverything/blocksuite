import type { PhasorElement } from '../index.js';
import { compare } from './group-manager.js';
import type { IndexableBlock, Layer } from './layer-manager.js';

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

export function isInRange(
  edges: [IndexableBlock | PhasorElement, IndexableBlock | PhasorElement],
  target: IndexableBlock | PhasorElement
) {
  return compare(target, edges[0]) >= 0 && compare(target, edges[1]) < 0;
}
