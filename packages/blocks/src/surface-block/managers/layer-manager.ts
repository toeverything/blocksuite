import { assertType, Slot } from '@blocksuite/global/utils';
import { generateKeyBetween } from 'fractional-indexing';

import { last, nToLast } from '../../_common/utils/iterable.js';
import { type EdgelessElement } from '../../_common/utils/types.js';
import type { FrameBlockModel } from '../../frame-block/frame-model.js';
import type { ImageBlockModel, NoteBlockModel } from '../../models.js';
import type { PhasorElement } from '../../surface-block/elements/index.js';
import { GroupElement } from '../../surface-block/elements/index.js';
import { Bound } from '../../surface-block/utils/bound.js';
import { GROUP_ROOT } from '../elements/group/consts.js';
import { SurfaceElement } from '../elements/surface-element.js';
import { GridManager } from '../grid.js';
import { compare, getGroupParent, getGroups } from './group-manager.js';
import { getLayerZIndex, isInRange, updateLayersIndex } from './layer-utils.js';

export type IndexableBlock = ImageBlockModel | NoteBlockModel;

type Indexable = PhasorElement | IndexableBlock;

type BaseLayer<T> = {
  set: Set<T>;

  elements: Array<T>;

  /**
   * fractional indexing range
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
};

export type Layer = BlockLayer | CanvasLayer;

export class LayerManager {
  static INITAL_INDEX = 'a0';

  slots = {
    layerUpdated: new Slot(),
  };

  phasors!: SurfaceElement[];
  blocks!: IndexableBlock[];
  frames!: FrameBlockModel[];

  layers!: Layer[];

  canvasLayers!: {
    set: Set<PhasorElement>;
    /**
     * fractional index
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
      } else if (element.flavour === 'affine:frame') {
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

  private _getElementIndex(indexable: Indexable | FrameBlockModel) {
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

  private _ungroupIndex(index: string) {
    return index.split('-')[0];
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
          this._getElementIndex(curLayer.elements[0]),
          this._getElementIndex(last(curLayer.elements)!),
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
        layer.indexes = [
          this._getElementIndex(layer.elements[0]),
          this._getElementIndex(last(layer.elements)!),
        ];
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
        indexes: [
          this._getElementIndex(targets[0]),
          this._getElementIndex(last(targets)!),
        ] as [string, string],
        zIndexes:
          type === 'block'
            ? [curZIndex + 1, curZIndex + targets.length]
            : curZIndex + 1,
        elements: targets,
      };

      return newLayer as unknown as CanvasLayer | BlockLayer;
    };

    if (compare(target, last(last(this.layers)!.elements)!) > 0) {
      const layer = last(this.layers);

      if (layer?.type === type) {
        addToLayer(layer, target, 'tail');
        updateLayersIndex(layers, cur);
      } else {
        this.layers.push(
          createLayer(type, [target], getLayerZIndex(layers, layers.length - 1))
        );
      }
    } else {
      while (cur > -1) {
        const layer = layers[cur];
        const layerElements = layer.elements;

        if (isInRange([layerElements[0], last(layerElements)!], target)) {
          const insertIdx = layerElements.findIndex((_, idx) => {
            const pre = layerElements[idx - 1];
            return (
              compare(target, layerElements[idx]) < 0 &&
              (!pre || compare(target, pre) >= 0)
            );
          });

          if (layer.type === type) {
            addToLayer(layer, target, insertIdx);
            updateLayersIndex(layers, cur);
          } else {
            const splicedElements = layer.elements.splice(insertIdx);
            layer.set = new Set(layer.elements as PhasorElement[]);

            layers.splice(
              cur + 1,
              0,
              createLayer(layer.type, splicedElements, 1)
            );
            layers.splice(cur + 1, 0, createLayer(type, [target], 1));
            updateLayersIndex(layers, cur);
          }
          break;
        } else {
          const nextLayer = layers[cur - 1];

          if (!nextLayer || compare(target, last(nextLayer.elements)!) >= 0) {
            if (layer.type === type) {
              addToLayer(layer, target, 0);
              updateLayersIndex(layers, cur);
            } else {
              if (nextLayer) {
                addToLayer(nextLayer, target, 'tail');
                updateLayersIndex(layers, cur - 1);
              } else {
                layers.unshift(createLayer(type, [target], 1));
                updateLayersIndex(layers, 0);
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
        if (idx !== -1) {
          layer.elements.splice(layer.elements.indexOf(target), 1);

          if (layer.elements.length) {
            layer.indexes = [
              this._getElementIndex(layer.elements[0]),
              this._getElementIndex(last(layer.elements)!),
            ];
          }
        }

        return true;
      }

      return false;
    });

    if (index === -1) return;

    const isDeletedAtEdge = index === 0 || index === layers.length - 1;

    if (layers[index].set.size === 0) {
      if (isDeletedAtEdge) {
        layers.splice(index, 1);

        if (layers[index]) {
          updateLayersIndex(layers, index);
        }
      } else {
        const lastLayer = layers[index - 1] as CanvasLayer;
        const nextLayer = layers[index + 1] as CanvasLayer;

        lastLayer.elements = lastLayer.elements.concat(nextLayer.elements);
        lastLayer.set = new Set(lastLayer.elements);

        layers.splice(index, 2);
        updateLayersIndex(layers, index - 1);
      }
      return;
    }

    updateLayersIndex(layers, index);
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

    this.canvasLayers = canvasLayers;
  }

  /**
   * @returns a boolean value to indicate whether the layers have been updated
   */
  private _updateLayer(element: Indexable | FrameBlockModel) {
    let updateType: 'block' | 'canvas' | undefined = undefined;

    if (element instanceof SurfaceElement) {
      updateType = 'canvas';
      this._removeFromOrderedArray(this.phasors, element);
      this._insertToOrderedArray(this.phasors, element);

      if (element instanceof GroupElement) {
        element.childElements.forEach(child => this._updateLayer(child));
      }
    } else if (element.flavour === 'affine:frame') {
      this._removeFromOrderedArray(this.frames, element);
      this._insertToOrderedArray(this.frames, element);
    } else {
      updateType = 'block';
      this._removeFromOrderedArray(this.blocks, element);
      this._insertToOrderedArray(this.blocks, element);
      this.blocksGrid.add(element);
    }

    if (updateType) {
      this._removeFromLayer(element as Indexable, updateType);
      this._insertIntoLayer(element as Indexable, updateType);

      return true;
    }

    return false;
  }

  add(element: Indexable | FrameBlockModel) {
    let insertType: 'block' | 'canvas' | undefined = undefined;

    if (element instanceof SurfaceElement) {
      insertType = 'canvas';
      this._insertToOrderedArray(this.phasors, element);

      if (element instanceof GroupElement) {
        element.childElements.forEach(child => this._updateLayer(child));
      }
    } else if (element.flavour === 'affine:frame') {
      this._insertToOrderedArray(this.frames, element);
    } else {
      insertType = 'block';
      this._insertToOrderedArray(this.blocks, element);
      this.blocksGrid.add(element);
    }

    if (insertType) {
      this._insertIntoLayer(element as Indexable, insertType);
      this._buildCanvasLayers();
      this.slots.layerUpdated.emit();
    }
  }

  delete(element: Indexable | FrameBlockModel) {
    let deleteType: 'canvas' | 'block' | undefined = undefined;

    if (element instanceof SurfaceElement) {
      deleteType = 'canvas';
      this._removeFromOrderedArray(this.phasors, element);
    } else if (element.flavour === 'affine:frame') {
      this._removeFromOrderedArray(this.frames, element);
    } else {
      deleteType = 'block';
      this._removeFromOrderedArray(this.blocks, element);
      this.blocksGrid.remove(element);
    }

    if (deleteType) {
      this._removeFromLayer(element as Indexable, deleteType);
      this._buildCanvasLayers();
      this.slots.layerUpdated.emit();
    }
  }

  update(element: Indexable | FrameBlockModel) {
    if (this._updateLayer(element)) {
      this._buildCanvasLayers();
      this.slots.layerUpdated.emit();
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
        ? generateKeyBetween(
            this._ungroupIndex(this._getElementIndex(lastFrame)),
            null
          )
        : LayerManager.INITAL_INDEX;
    } else {
      if (block === 'canvas') {
        const lastIndex = last(this.layers)?.indexes[1];

        return lastIndex
          ? generateKeyBetween(this._ungroupIndex(lastIndex), null)
          : LayerManager.INITAL_INDEX;
      }

      const lastLayer = last(this.layers);
      const lastLayerIndex = lastLayer
        ? this._ungroupIndex(lastLayer.indexes[1])
        : undefined;

      if (!lastLayer) return LayerManager.INITAL_INDEX;

      assertType<string>(lastLayerIndex);

      if (lastLayer.type === 'canvas') {
        const secondLastLayer = nToLast(this.layers, 2);
        const secondLastLayerIndex = secondLastLayer
          ? this._ungroupIndex(secondLastLayer.indexes[1])
          : null;

        if (secondLastLayerIndex && secondLastLayerIndex >= lastLayerIndex) {
          return generateKeyBetween(secondLastLayerIndex, null);
        }

        return generateKeyBetween(secondLastLayerIndex, lastLayerIndex);
      }

      return generateKeyBetween(lastLayerIndex, null);
    }
  }

  getReorderedIndex(
    element: Indexable | FrameBlockModel,
    direction: 'front' | 'forward' | 'back' | 'backward'
  ): string {
    const group = getGroupParent(element);
    const isFrameBlock =
      (element as FrameBlockModel).flavour === 'affine:frame';

    let elements: (Indexable | FrameBlockModel)[];

    if (group !== GROUP_ROOT) {
      elements = group.childElements.filter(
        element =>
          ((element as FrameBlockModel)?.flavour === 'affine:frame') ===
          isFrameBlock
      );

      elements.sort(compare);
    } else if (isFrameBlock) {
      elements = this.frames;
    } else {
      elements = this.layers.reduce(
        (pre: Indexable[], current) =>
          pre.concat(
            current.elements.filter(
              element => getGroupParent(element) == GROUP_ROOT
            )
          ),
        []
      );
    }

    const currentIdx = elements.indexOf(element);

    switch (direction) {
      case 'forward':
      case 'front':
        if (currentIdx === -1 || currentIdx === elements.length - 1)
          return element.index;

        {
          const next =
            direction === 'forward'
              ? elements[currentIdx + 1]
              : elements[elements.length - 1];
          const next2 =
            direction === 'forward' ? elements[currentIdx + 2] : null;

          return generateKeyBetween(
            next.index,
            next2?.index
              ? next.index < next2.index
                ? next2.index
                : null
              : null
          );
        }
      case 'backward':
      case 'back':
        if (currentIdx === -1 || currentIdx === 0) return element.index;

        {
          const pre =
            direction === 'backward' ? elements[currentIdx - 1] : elements[0];
          const pre2 =
            direction === 'backward' ? elements[currentIdx - 2] : null;

          return generateKeyBetween(pre2?.index ?? null, pre.index);
        }
    }

    return element.index;
  }
}
