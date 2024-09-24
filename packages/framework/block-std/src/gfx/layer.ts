import type { Doc } from '@blocksuite/store';

import {
  assertType,
  Bound,
  DisposableGroup,
  last,
  Slot,
} from '@blocksuite/global/utils';
import { generateKeyBetween } from 'fractional-indexing';

import {
  compare,
  getElementIndex,
  getLayerEndZIndex,
  insertToOrderedArray,
  isInRange,
  removeFromOrderedArray,
  SortOrder,
  ungroupIndex,
  updateLayersZIndex,
} from '../utils/layer.js';
import { GfxBlockElementModel, type GfxModel } from './gfx-block-model.js';
import {
  type GfxContainerElement,
  GfxPrimitiveElementModel,
  isGfxContainerElm,
} from './surface/element-model.js';
import { SurfaceBlockModel } from './surface/surface-model.js';

export type ReorderingDirection = 'front' | 'forward' | 'backward' | 'back';

type BaseLayer<T> = {
  set: Set<T>;

  elements: Array<T>;

  /**
   * fractional indexing range
   */
  indexes: [string, string];
};

export type BlockLayer = BaseLayer<GfxBlockElementModel> & {
  type: 'block';

  /**
   * The z-index of the first block in this layer.
   *
   * A block layer may contains multiple blocks,
   * the block should be rendered with this `zIndex` + "its index in the layer" as the z-index property.
   */
  zIndex: number;
};

export type CanvasLayer = BaseLayer<GfxPrimitiveElementModel> & {
  type: 'canvas';

  /**
   * The z-index of canvas layer.
   *
   * A canvas layer renders all the elements in a single canvas,
   *  this property is used to render the canvas with correct z-index.
   */
  zIndex: number;
};

export type Layer = BlockLayer | CanvasLayer;

export class LayerManager {
  static INITIAL_INDEX = 'a0';

  private _disposable = new DisposableGroup();

  blocks: GfxBlockElementModel[] = [];

  canvasElements: GfxPrimitiveElementModel[] = [];

  canvasLayers: {
    set: Set<GfxPrimitiveElementModel>;
    /**
     * fractional index
     */
    indexes: [string, string];
    /**
     * z-index, used for actual rendering
     */
    zIndex: number;
    elements: Array<GfxPrimitiveElementModel>;
  }[] = [];

  layers: Layer[] = [];

  slots = {
    layerUpdated: new Slot<{
      type: 'delete' | 'add' | 'update';
      initiatingElement: GfxModel;
    }>(),
  };

  constructor(
    private _doc: Doc,
    private _surface: SurfaceBlockModel | null,
    options: {
      watch: boolean;
    } = { watch: true }
  ) {
    this._reset();

    if (options?.watch) {
      this.watch({
        doc: _doc,
        surface: _surface,
      });
    }
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
          zIndex: layer.zIndex,
          indexes: layer.indexes,
        };
      }) as LayerManager['canvasLayers'];

    if (!canvasLayers.length || last(this.layers)?.type !== 'canvas') {
      canvasLayers.push({
        set: new Set(),
        elements: [],
        zIndex: 0,
        indexes: [LayerManager.INITIAL_INDEX, LayerManager.INITIAL_INDEX],
      });
    }

    this.canvasLayers = canvasLayers;
  }

  private _getModelType(element: GfxModel): 'block' | 'canvas' {
    return 'flavour' in element ? 'block' : 'canvas';
  }

  private _initLayers() {
    let blockIdx = 0;
    let canvasIdx = 0;
    const layers: LayerManager['layers'] = [];
    let curLayer: LayerManager['layers'][number] | undefined;
    let currentCSSZindex = 1;

    const pushCurLayer = () => {
      if (curLayer) {
        curLayer.indexes = [
          getElementIndex(curLayer.elements[0]),
          getElementIndex(last(curLayer.elements)!),
        ];
        curLayer.zIndex = currentCSSZindex;
        layers.push(curLayer as LayerManager['layers'][number]);

        currentCSSZindex +=
          curLayer.type === 'block' ? curLayer.elements.length : 1;
      }
    };
    const addLayer = (type: 'canvas' | 'block') => {
      pushCurLayer();
      curLayer =
        type === 'canvas'
          ? ({
              type,
              indexes: [LayerManager.INITIAL_INDEX, LayerManager.INITIAL_INDEX],
              zIndex: 0,
              set: new Set(),
              elements: [],
              bound: new Bound(),
            } as CanvasLayer)
          : ({
              type,
              indexes: [LayerManager.INITIAL_INDEX, LayerManager.INITIAL_INDEX],
              zIndex: 0,
              set: new Set(),
              elements: [],
            } as BlockLayer);
    };

    while (
      blockIdx < this.blocks.length ||
      canvasIdx < this.canvasElements.length
    ) {
      const curBlock = this.blocks[blockIdx];
      const curCanvas = this.canvasElements[canvasIdx];

      if (!curBlock && !curCanvas) {
        break;
      }

      if (!curBlock) {
        if (curLayer?.type !== 'canvas') {
          addLayer('canvas');
        }
        assertType<CanvasLayer>(curLayer);

        const remains = this.canvasElements.slice(canvasIdx);

        curLayer!.elements = curLayer.elements.concat(remains);
        remains.forEach(element => (curLayer as CanvasLayer).set.add(element));

        break;
      }

      if (!curCanvas) {
        if (curLayer?.type !== 'block') {
          addLayer('block');
        }

        assertType<BlockLayer>(curLayer);

        const remains = this.blocks.slice(blockIdx);

        curLayer.elements = curLayer.elements.concat(remains);
        remains.forEach(block => (curLayer as BlockLayer).set.add(block));

        break;
      }

      const order = compare(curBlock, curCanvas);

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

          curLayer!.set.add(curCanvas);
          curLayer!.elements.push(curCanvas);

          ++canvasIdx;

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
            curLayer!.set.add(curCanvas);
            curLayer!.elements.push(curCanvas);

            ++canvasIdx;
          }
          break;
      }
    }

    if (curLayer && curLayer.elements.length) {
      pushCurLayer();
    }

    this.layers = layers;
  }

  private _insertIntoLayer(target: GfxModel, type: 'block' | 'canvas') {
    if (this.layers.length === 0) {
      this._initLayers();
      return;
    }

    const layers = this.layers;
    let cur = layers.length - 1;

    const addToLayer = (
      layer: Layer,
      element: GfxModel,
      position: number | 'tail'
    ) => {
      assertType<CanvasLayer>(layer);
      assertType<GfxPrimitiveElementModel>(element);

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
          getElementIndex(layer.elements[0]),
          getElementIndex(last(layer.elements)!),
        ];
      }
    };
    const createLayer = (
      type: 'block' | 'canvas',
      targets: GfxModel[],
      curZIndex: number
    ): Layer => {
      const newLayer = {
        type,
        set: new Set(targets),
        indexes: [
          getElementIndex(targets[0]),
          getElementIndex(last(targets)!),
        ] as [string, string],
        zIndex: curZIndex + 1,
        elements: targets,
      } as BlockLayer;

      return newLayer as Layer;
    };

    if (
      [SortOrder.AFTER, SortOrder.SAME].includes(
        compare(target, last(last(this.layers)!.elements)!)
      )
    ) {
      const layer = last(this.layers);

      if (layer?.type === type) {
        addToLayer(layer, target, 'tail');
        updateLayersZIndex(layers, cur);
      } else {
        this.layers.push(
          createLayer(
            type,
            [target],
            getLayerEndZIndex(layers, layers.length - 1)
          )
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
            updateLayersZIndex(layers, cur);
          } else {
            const splicedElements = layer.elements.splice(insertIdx);
            layer.set = new Set(layer.elements as GfxPrimitiveElementModel[]);

            layers.splice(
              cur + 1,
              0,
              createLayer(layer.type, splicedElements, 1)
            );
            layers.splice(cur + 1, 0, createLayer(type, [target], 1));
            updateLayersZIndex(layers, cur);
          }
          break;
        } else {
          const nextLayer = layers[cur - 1];

          if (!nextLayer || compare(target, last(nextLayer.elements)!) >= 0) {
            if (layer.type === type) {
              addToLayer(layer, target, 0);
              updateLayersZIndex(layers, cur);
            } else {
              if (nextLayer) {
                addToLayer(nextLayer, target, 'tail');
                updateLayersZIndex(layers, cur - 1);
              } else {
                layers.unshift(createLayer(type, [target], 1));
                updateLayersZIndex(layers, 0);
              }
            }

            break;
          }
        }

        --cur;
      }
    }
  }

  private _removeFromLayer(target: GfxModel, type: 'block' | 'canvas') {
    const layers = this.layers;
    const index = layers.findIndex(layer => {
      if (layer.type !== type) return false;

      assertType<CanvasLayer>(layer);
      assertType<GfxPrimitiveElementModel>(target);

      if (layer.set.has(target)) {
        layer.set.delete(target);
        const idx = layer.elements.indexOf(target);
        if (idx !== -1) {
          layer.elements.splice(layer.elements.indexOf(target), 1);

          if (layer.elements.length) {
            layer.indexes = [
              getElementIndex(layer.elements[0]),
              getElementIndex(last(layer.elements)!),
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
          updateLayersZIndex(layers, index);
        }
      } else {
        const lastLayer = layers[index - 1] as CanvasLayer;
        const nextLayer = layers[index + 1] as CanvasLayer;

        lastLayer.elements = lastLayer.elements.concat(nextLayer.elements);
        lastLayer.set = new Set(lastLayer.elements);

        layers.splice(index, 2);
        updateLayersZIndex(layers, index - 1);
      }
      return;
    }

    updateLayersZIndex(layers, index);
  }

  private _reset() {
    const elements = (
      this._doc
        .getBlocks()
        .filter(
          model =>
            model instanceof GfxBlockElementModel &&
            (model.parent instanceof SurfaceBlockModel ||
              model.parent?.role === 'root')
        ) as GfxModel[]
    ).concat(this._surface?.elementModels ?? []);

    this.canvasElements = [];
    this.blocks = [];

    elements.forEach(element => {
      if (element instanceof GfxPrimitiveElementModel) {
        this.canvasElements.push(element);
      } else {
        this.blocks.push(element);
      }
    });

    this.canvasElements.sort(compare);
    this.blocks.sort(compare);

    this._initLayers();
    this._buildCanvasLayers();
  }

  /**
   * @returns a boolean value to indicate whether the layers have been updated
   */
  private _updateLayer(element: GfxModel, props?: Record<string, unknown>) {
    const modelType = this._getModelType(element);

    const indexChanged = !props || 'index' in props;
    const childIdsChanged = props && 'childIds' in props;
    const shouldUpdateGroupChildren =
      isGfxContainerElm(element) && (indexChanged || childIdsChanged);
    const updateArray = (array: GfxModel[], element: GfxModel) => {
      if (!indexChanged) return;
      removeFromOrderedArray(array, element);
      insertToOrderedArray(array, element);
    };

    if (shouldUpdateGroupChildren) {
      this._reset();
      return true;
    }

    if (modelType === 'canvas') {
      updateArray(this.canvasElements, element);
    } else {
      updateArray(this.blocks, element);
    }

    if (indexChanged || childIdsChanged) {
      this._removeFromLayer(element as GfxModel, modelType);
      this._insertIntoLayer(element as GfxModel, modelType);
      return true;
    }

    return false;
  }

  add(element: GfxModel) {
    const modelType = this._getModelType(element);
    const isContainer = isGfxContainerElm(element);

    if (isContainer) {
      element.childElements.forEach(child => {
        const childModelType = this._getModelType(child);
        removeFromOrderedArray(
          childModelType === 'canvas' ? this.canvasElements : this.blocks,
          child
        );
      });
    }

    insertToOrderedArray(
      modelType === 'canvas' ? this.canvasElements : this.blocks,
      element
    );
    this._insertIntoLayer(element as GfxModel, modelType);

    if (isContainer) {
      element.childElements.forEach(child => child && this._updateLayer(child));
    }
    this._buildCanvasLayers();
    this.slots.layerUpdated.emit({
      type: 'add',
      initiatingElement: element,
    });
  }

  /**
   * Pass to the `Array.sort` to  sort the elements by their index
   */
  compare(a: GfxModel, b: GfxModel) {
    return compare(a, b);
  }

  /**
   * In some cases, we need to generate a bunch of indexes in advance before acutally adding the elements to the layer manager.
   * Eg. when importing a template. The `generateIndex` is a function only depends on the current state of the manager.
   * So we cannot use it because it will always return the same index if the element is not added to manager.
   *
   * This function return a index generator that can "remember" the index it generated without actually adding the element to the manager.
   *
   * @note The generator cannot work with `group` element.
   *
   * @returns
   */
  createIndexGenerator() {
    const manager = new LayerManager(this._doc, this._surface, {
      watch: false,
    });

    return () => {
      const idx = manager.generateIndex();
      const bound = new Bound(0, 0, 10, 10);

      const mockedFakeElement = {
        index: idx,
        type: 'shape',
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        elementBound: bound,
        xywh: '[0, 0, 10, 10]',
        get group() {
          return null;
        },
        get groups() {
          return [];
        },
      };

      manager.add(mockedFakeElement as unknown as GfxModel);

      return idx;
    };
  }

  delete(element: GfxModel) {
    let deleteType: 'canvas' | 'block' | undefined = undefined;
    const isGroup = isGfxContainerElm(element);

    if (isGroup) {
      this._reset();
      this.slots.layerUpdated.emit({
        type: 'delete',
        initiatingElement: element as GfxModel,
      });
      return;
    }

    if (element instanceof GfxPrimitiveElementModel) {
      deleteType = 'canvas';
      removeFromOrderedArray(this.canvasElements, element);
    } else {
      deleteType = 'block';
      removeFromOrderedArray(this.blocks, element);
    }

    this._removeFromLayer(element, deleteType);
    this._buildCanvasLayers();
    this.slots.layerUpdated.emit({
      type: 'delete',
      initiatingElement: element,
    });
  }

  dispose() {
    this.slots.layerUpdated.dispose();
  }

  generateIndex(): string {
    const lastIndex = last(this.layers)?.indexes[1];

    return lastIndex
      ? generateKeyBetween(ungroupIndex(lastIndex), null)
      : LayerManager.INITIAL_INDEX;
  }

  getCanvasLayers() {
    return this.canvasLayers;
  }

  getReorderedIndex(element: GfxModel, direction: ReorderingDirection): string {
    const group = (element.group as GfxContainerElement) || null;

    let elements: GfxModel[];

    if (group !== null) {
      elements = group.childElements;

      elements.sort(compare);
    } else {
      elements = this.layers.reduce(
        (pre: GfxModel[], current) =>
          pre.concat(current.elements.filter(element => element.group == null)),
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

          return generateKeyBetween(
            !pre2 || pre2?.index >= pre.index ? null : pre2.index,
            pre.index
          );
        }
    }
  }

  getZIndex(element: GfxModel): number {
    // @ts-ignore
    const layer = this.layers.find(layer => layer.set.has(element));

    if (!layer) return -1;

    // @ts-ignore
    return layer.zIndex + layer.elements.indexOf(element);
  }

  update(element: GfxModel, props?: Record<string, unknown>) {
    if (this._updateLayer(element, props)) {
      this._buildCanvasLayers();
      this.slots.layerUpdated.emit({
        type: 'update',
        initiatingElement: element,
      });
    }
  }

  watch(blocks: { doc?: Doc; surface: SurfaceBlockModel | null }) {
    const { doc, surface } = blocks;

    if (doc) {
      this._disposable.add(
        doc.slots.blockUpdated.on(payload => {
          if (payload.type === 'add') {
            const block = doc.getBlockById(payload.id)!;

            if (
              block instanceof GfxBlockElementModel &&
              (block.parent instanceof SurfaceBlockModel ||
                block.parent?.role === 'root') &&
              this.blocks.indexOf(block) === -1
            ) {
              this.add(block as GfxBlockElementModel);
            }
          }
          if (payload.type === 'update') {
            const block = doc.getBlockById(payload.id)!;

            if (
              (payload.props.key === 'index' ||
                payload.props.key === 'childIds') &&
              block instanceof GfxBlockElementModel &&
              (block.parent instanceof SurfaceBlockModel ||
                block.parent?.role === 'root')
            ) {
              this.update(block as GfxBlockElementModel, {
                [payload.props.key]: true,
              });
            }
          }
          if (payload.type === 'delete') {
            const block = doc.getBlockById(payload.id);

            if (block instanceof GfxBlockElementModel) {
              this.delete(block as GfxBlockElementModel);
            }
          }
        })
      );
    }

    if (surface) {
      if (this._surface !== surface) {
        this._surface = surface;
      }

      this._disposable.add(
        surface.elementAdded.on(payload =>
          this.add(surface.getElementById(payload.id)!)
        )
      );
      this._disposable.add(
        surface.elementUpdated.on(payload => {
          if (payload.props['index'] || payload.props['childIds']) {
            this.update(surface.getElementById(payload.id)!, payload.props);
          }
        })
      );
      this._disposable.add(
        surface.elementRemoved.on(payload => this.delete(payload.model!))
      );

      surface.elementModels.forEach(el => this.add(el));
    }
  }
}
