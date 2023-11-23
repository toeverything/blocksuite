import { assertType, Slot } from '@blocksuite/global/utils';

import { last, nToLast } from '../../_common/utils/iterable.js';
import { FrameBlockModel } from '../../frame-block/frame-model.js';
import type { PhasorElement } from '../../index.js';
import { Bound, generateKeyBetween } from '../../index.js';
import { type EdgelessElement } from '../../index.js';
import type { ImageBlockModel, NoteBlockModel } from '../../models.js';
import { getElementsBound } from '../../page-block/edgeless/utils/query.js';
import { SurfaceElement } from '../elements/surface-element.js';
import { GridManager } from '../grid.js';
import { compare } from './group-manager.js';

type IndexableBlock = ImageBlockModel | NoteBlockModel;

type Indexable = PhasorElement | IndexableBlock;

type BaseLayer<T> = {
  set: Set<T>;

  elements: Array<T>;

  /**
   * fraction indexing range
   */
  indexes: [string, string];
};

type BlockLayer = BaseLayer<IndexableBlock> & {
  type: 'block';
  /**
   * z-index, used for actual rendering
   */
  zIndexes: [number, number];
};

type CanvasLayer = BaseLayer<PhasorElement> & {
  type: 'canvas';
  /**
   * z-index, used for actual rendering
   */
  zIndexes: number;

  /**
   * size for canvas
   */
  bound: Bound;
};

export class LayerManager {
  static INITAL_INDEX = 'b0';
  static INITAL_BLOCK_INDEX = 'a0';

  slots = {
    canvasLayerChanged: new Slot(),
  };

  phasors!: SurfaceElement[];
  blocks!: IndexableBlock[];
  frames!: FrameBlockModel[];

  layers!: Array<BlockLayer | CanvasLayer>;

  canvasLayers!: {
    set: Set<PhasorElement>;
    /**
     * fraction index
     */
    indexes: [string, string];
    /**
     * z-index, used for actual rendering
     */
    zIndexes: number;
    elements: Array<PhasorElement>;
  }[];

  blocksGrid = new GridManager<IndexableBlock>();

  constructor(elements?: EdgelessElement[]) {
    if (elements) {
      this.init(elements);
    }
  }

  init(elements: EdgelessElement[]) {
    this.phasors = [];
    this.blocks = [];
    this.frames = [];

    elements.forEach(element => {
      if (element instanceof SurfaceElement) {
        this.phasors.push(element);
      } else if (element instanceof FrameBlockModel) {
        this.frames.push(element);
      } else {
        this.blocksGrid.add(element);
        this.blocks.push(element);
      }
    });

    this.phasors.sort();
    this.frames.sort();
    this.blocks.sort();

    this._initLayers();
    this._buildCanvasLayers();
  }

  private _initLayers() {
    let blockIdx = 0;
    let phasorIdx = 0;
    const layers: LayerManager['layers'] = [];
    let curLayer: LayerManager['layers'][number] | undefined;
    let currentCSSZindex = 1;

    const pushCurLayer = () => {
      if (curLayer) {
        curLayer.indexes = [
          curLayer.elements[0].index,
          last(curLayer.elements)!.index,
        ];
        curLayer.zIndexes =
          curLayer.type === 'block'
            ? [currentCSSZindex, currentCSSZindex + curLayer.elements.length]
            : currentCSSZindex;
        layers.push(curLayer as LayerManager['layers'][number]);

        currentCSSZindex +=
          curLayer.type === 'block' ? curLayer.elements.length + 1 : 1;
      }
    };
    const addLayer = (type: 'canvas' | 'block') => {
      pushCurLayer();
      curLayer =
        type === 'canvas'
          ? ({
              type,
              indexes: [LayerManager.INITAL_INDEX, LayerManager.INITAL_INDEX],
              zIndexes: 0,
              set: new Set(),
              elements: [],
              bound: new Bound(),
            } as CanvasLayer)
          : ({
              type,
              indexes: [LayerManager.INITAL_INDEX, LayerManager.INITAL_INDEX],
              zIndexes: [0, 0],
              set: new Set(),
              elements: [],
            } as BlockLayer);
    };

    while (blockIdx < this.blocks.length || phasorIdx < this.phasors.length) {
      const curBlock = this.blocks[blockIdx];
      const curPhasor = this.phasors[phasorIdx];

      if (!curBlock && !curPhasor) {
        break;
      }

      if (!curBlock) {
        if (curLayer?.type !== 'canvas') {
          addLayer('canvas');
        }
        assertType<CanvasLayer>(curLayer);

        const remains = this.phasors.slice(phasorIdx);

        curLayer!.elements = curLayer.elements.concat(remains);
        remains.forEach(phasor => (curLayer as CanvasLayer).set.add(phasor));

        break;
      }

      if (!curPhasor) {
        if (curLayer?.type !== 'block') {
          addLayer('block');
        }

        assertType<BlockLayer>(curLayer);

        const remains = this.blocks.slice(blockIdx);

        curLayer.elements = curLayer.elements.concat(remains);
        remains.forEach(block => (curLayer as BlockLayer).set.add(block));

        break;
      }

      const order = compare(curBlock, curPhasor);

      switch (order) {
        case -1:
          if (curLayer?.type !== 'block') {
            addLayer('block');
          }

          assertType<BlockLayer>(curLayer);

          curLayer!.set.add(curBlock);
          curLayer!.elements.push(curBlock);

          ++blockIdx;

          break;
        case 1:
          if (curLayer?.type !== 'canvas') {
            addLayer('canvas');
          }

          assertType<CanvasLayer>(curLayer);

          curLayer!.set.add(curPhasor);
          curLayer!.elements.push(curPhasor);

          ++phasorIdx;

          break;
        case 0:
          if (!curLayer) {
            addLayer('block');
          }

          if (curLayer!.type === 'block') {
            curLayer!.set.add(curBlock);
            curLayer!.elements.push(curBlock);

            ++blockIdx;
          } else {
            curLayer!.set.add(curPhasor);
            curLayer!.elements.push(curPhasor);

            ++phasorIdx;
          }
          break;
      }
    }

    if (curLayer && curLayer.elements.length) {
      pushCurLayer();
    }

    this.layers = layers;
  }

  private _insertToOrderedArray(
    array: EdgelessElement[],
    element: EdgelessElement
  ) {
    let idx = 0;
    while (idx < array.length && compare(array[idx], element) < 0) {
      ++idx;
    }

    array.splice(idx, 0, element);
  }

  private _removeFromOrderedArray(
    array: EdgelessElement[],
    element: EdgelessElement
  ) {
    const idx = array.indexOf(element);

    if (idx !== -1) {
      array.splice(idx, 1);
    }
  }

  private _insertIntoLayer(target: Indexable, type: 'block' | 'canvas') {
    if (this.layers.length === 0) {
      this._initLayers();
      return;
    }

    const layers = this.layers;
    let cur = layers.length - 1;

    const getLayerZIndex = (layerIndex: number) => {
      const layer = layers[layerIndex];

      return layer
        ? layer.type === 'block'
          ? layer.zIndexes[1]
          : layer.zIndexes
        : 1;
    };
    const updateLayersIndex = (startIdx: number) => {
      const startLayer = layers[startIdx];
      let curIndex =
        startLayer.type === 'block'
          ? startLayer.zIndexes[1]
          : startLayer.zIndexes;

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
    };
    const addToLayer = (
      layer: CanvasLayer | BlockLayer,
      element: Indexable,
      position: number | 'tail'
    ) => {
      assertType<CanvasLayer>(layer);
      assertType<PhasorElement>(element);

      if (position === 'tail') {
        layer.elements.push(element);
      } else {
        layer.elements.splice(position, 0, element);
      }

      layer.set.add(element);

      if (
        position === 'tail' ||
        position === 0 ||
        position === layer.elements.length - 1
      ) {
        layer.indexes = [layer.elements[0].index, last(layer.elements)!.index];
      }
    };
    const createLayer = (
      type: 'block' | 'canvas',
      targets: Indexable[],
      curZIndex: number
    ): CanvasLayer | BlockLayer => {
      const newLayer = {
        type,
        set: new Set(targets),
        indexes: [targets[0].index, last(targets)!.index] as [string, string],
        zIndexes:
          type === 'block'
            ? [curZIndex + 1, curZIndex + 1 + targets.length]
            : curZIndex + 1,
        elements: targets,
      };

      return newLayer as unknown as CanvasLayer | BlockLayer;
    };
    const isInRange = (
      edges: [IndexableBlock | PhasorElement, IndexableBlock | PhasorElement],
      target: IndexableBlock | PhasorElement
    ) => {
      return compare(target, edges[0]) >= 0 && compare(target, edges[1]) < 0;
    };

    if (compare(target, last(last(this.layers)!.elements)!) > 0) {
      const layer = last(this.layers);

      if (layer?.type === type) {
        addToLayer(layer, target, 'tail');
        updateLayersIndex(cur);
      } else {
        this.layers.push(
          createLayer(type, [target], getLayerZIndex(layers.length - 1))
        );
      }
    } else {
      while (cur > -1) {
        const layer = layers[cur];
        const layerElements = layer.elements;

        if (isInRange([layerElements[0], last(layerElements)!], target)) {
          const insertIdx = layerElements.findIndex((element, idx) => {
            return (
              compare(target, element) >= 0 &&
              (!layerElements[idx + 1] ||
                compare(target, layerElements[idx + 1]) <= 0)
            );
          });

          if (layer.type === type) {
            addToLayer(layer, target, insertIdx);
            updateLayersIndex(cur);
          } else {
            const splicedElements = layer.elements.splice(insertIdx);

            layers.splice(
              cur + 1,
              0,
              createLayer(layer.type, splicedElements, 1)
            );
            layers.splice(cur + 1, 0, createLayer(type, [target], 1));
            updateLayersIndex(cur);
          }
          break;
        } else {
          const nextLayer = layers[cur - 1];

          if (!nextLayer || compare(target, last(nextLayer.elements)!) >= 0) {
            if (layer.type === type) {
              addToLayer(layer, target, 0);
              updateLayersIndex(cur);
            } else {
              if (nextLayer) {
                addToLayer(nextLayer, target, 'tail');
                updateLayersIndex(cur - 1);
              } else {
                layers.unshift(createLayer(type, [target], 1));
                updateLayersIndex(0);
              }
            }

            break;
          }
        }

        --cur;
      }
    }
  }

  private _removeFromLayer(target: Indexable, type: 'block' | 'canvas') {
    const layers = this.layers;
    const index = layers.findIndex(layer => {
      if (layer.type !== type) return false;

      assertType<CanvasLayer>(layer);
      assertType<PhasorElement>(target);

      if (layer.set.has(target)) {
        layer.set.delete(target);
        const idx = layer.elements.indexOf(target);
        if (idx !== -1)
          layer.elements.splice(layer.elements.indexOf(target), 1);
        return true;
      }

      return false;
    });
    const isDeletedAtEdge = index === 0 || index === layers.length - 1;

    const updateLayersIndex = (startIdx: number) => {
      const startLayer = layers[startIdx];
      let curIndex =
        startLayer.type === 'block'
          ? startLayer.zIndexes[1]
          : startLayer.zIndexes;

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
    };

    if (index === -1) return;

    if (layers[index].set.size === 0) {
      if (isDeletedAtEdge) {
        layers.splice(index, 1);

        if (layers[index]) {
          updateLayersIndex(index);
        }
      } else {
        const lastLayer = layers[index - 1] as CanvasLayer;
        const nextLayer = layers[index + 1] as CanvasLayer;

        lastLayer.elements = lastLayer.elements.concat(nextLayer.elements);
        lastLayer.set = new Set(lastLayer.elements);

        layers.splice(index, 2);
        updateLayersIndex(index - 1);
      }
      return;
    }

    updateLayersIndex(index);
  }

  private _buildCanvasLayers() {
    const canvasLayers = this.layers
      .filter<CanvasLayer>(
        (layer): layer is CanvasLayer => layer.type === 'canvas'
      )
      .map(layer => {
        return {
          set: layer.set,
          elements: layer.elements,
          zIndexes: layer.zIndexes,
          indexes: layer.indexes,
          bound: getElementsBound(layer.elements),
        };
      }) as LayerManager['canvasLayers'];

    if (!canvasLayers.length || last(this.layers)?.type !== 'canvas') {
      canvasLayers.push({
        set: new Set(),
        elements: [],
        zIndexes: 0,
        indexes: [LayerManager.INITAL_INDEX, LayerManager.INITAL_INDEX],
      });
    }

    const old = this.canvasLayers;
    this.canvasLayers = canvasLayers;

    if (old && old.length !== canvasLayers.length) {
      this.slots.canvasLayerChanged.emit();
    }
  }

  add(element: Indexable | FrameBlockModel) {
    let insertType: 'block' | 'canvas' | undefined = undefined;

    if (element instanceof SurfaceElement) {
      insertType = 'canvas';
      this._insertToOrderedArray(this.phasors, element);
    } else if (element instanceof FrameBlockModel) {
      this._insertToOrderedArray(this.frames, element);
    } else {
      insertType = 'block';
      this._insertToOrderedArray(this.blocks, element);
      this.blocksGrid.add(element);
    }

    if (insertType) {
      this._insertIntoLayer(element as Indexable, insertType);
      this._buildCanvasLayers();
    }
  }

  delete(element: Indexable | FrameBlockModel) {
    let deleteType: 'canvas' | 'block' | undefined = undefined;

    if (element instanceof SurfaceElement) {
      deleteType = 'canvas';
      this._removeFromOrderedArray(this.phasors, element);
    } else if (element instanceof FrameBlockModel) {
      this._removeFromOrderedArray(this.frames, element);
    } else {
      deleteType = 'block';
      this._removeFromOrderedArray(this.blocks, element);
      this.blocksGrid.remove(element);
    }

    if (deleteType) {
      this._removeFromLayer(element as Indexable, deleteType);
      this._buildCanvasLayers();
    }
  }

  update(element: Indexable | FrameBlockModel) {
    let updateType: 'block' | 'canvas' | undefined = undefined;

    if (element instanceof SurfaceElement) {
      updateType = 'canvas';
      this._removeFromOrderedArray(this.phasors, element);
      this._insertToOrderedArray(this.phasors, element);
    } else if (element instanceof FrameBlockModel) {
      this._removeFromOrderedArray(this.frames, element);
      this._insertToOrderedArray(this.frames, element);
    } else {
      updateType = 'block';
      this._removeFromOrderedArray(this.blocks, element);
      this._insertToOrderedArray(this.blocks, element);
      this.blocksGrid.remove(element);
      this.blocksGrid.add(element);
    }

    if (updateType) {
      this._removeFromLayer(element as Indexable, updateType);
      this._insertIntoLayer(element as Indexable, updateType);
      this._buildCanvasLayers();
    }
  }

  getCanvasLayers() {
    return this.canvasLayers;
  }

  generateIndex(batch: 'frame'): string;
  generateIndex(batch: 'common', block?: 'canvas' | 'block'): string;
  generateIndex(
    batch: 'common' | 'frame',
    block: 'canvas' | 'block' = 'canvas'
  ): string {
    if (batch === 'frame') {
      const lastFrame = last(this.frames);

      return lastFrame
        ? generateKeyBetween(lastFrame.index, null)
        : LayerManager.INITAL_BLOCK_INDEX;
    } else {
      if (block === 'canvas') {
        const lastIndex = last(this.layers)?.indexes[1];
        return lastIndex
          ? generateKeyBetween(lastIndex, null)
          : LayerManager.INITAL_INDEX;
      }

      const lastLayer = last(this.layers);

      if (!lastLayer) return LayerManager.INITAL_BLOCK_INDEX;

      if (lastLayer.type === 'canvas') {
        const secondLastLayer = nToLast(this.layers, 2);
        const secondLastLayerIndex = secondLastLayer
          ? secondLastLayer.indexes[1]
          : null;

        if (
          secondLastLayerIndex &&
          secondLastLayerIndex >= lastLayer.indexes[0]
        ) {
          return generateKeyBetween(secondLastLayerIndex, null);
        }

        return generateKeyBetween(secondLastLayerIndex, lastLayer.indexes[0]);
      }

      return generateKeyBetween(last(lastLayer.elements)!.index, null);
    }
  }
}
