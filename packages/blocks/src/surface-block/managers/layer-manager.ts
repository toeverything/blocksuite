import { assertType, DisposableGroup, Slot } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import type { BlockModel } from '@blocksuite/store';
import { generateKeyBetween } from 'fractional-indexing';

import { last, nToLast } from '../../_common/utils/iterable.js';
import { matchFlavours } from '../../_common/utils/model.js';
import type { FrameBlockModel } from '../../frame-block/frame-model.js';
import { EdgelessBlockModel } from '../../root-block/edgeless/edgeless-block-model.js';
import { Bound } from '../../surface-block/utils/bound.js';
import {
  SurfaceElementModel,
  SurfaceGroupLikeModel,
} from '../element-model/base.js';
import type { GroupElementModel } from '../element-model/group.js';
import { GridManager } from '../grid.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import {
  compare,
  getElementIndex,
  getLayerEndZIndex,
  insertToOrderedArray,
  isInRange,
  removeFromOrderedArray,
  renderableInEdgeless,
  ungroupIndex,
  updateLayersZIndex,
} from './layer-utils.js';

export type ReorderingDirection = 'front' | 'forward' | 'backward' | 'back';

type BaseLayer<T> = {
  set: Set<T>;

  elements: Array<T>;

  /**
   * fractional indexing range
   */
  indexes: [string, string];
};

export type BlockLayer = BaseLayer<EdgelessBlockModel> & {
  type: 'block';

  /**
   * The z-index of the first block in this layer.
   *
   * A block layer may contains multiple blocks,
   * the block should be rendered with this `zIndex` + "its index in the layer" as the z-index property.
   */
  zIndex: number;
};

export type CanvasLayer = BaseLayer<SurfaceElementModel> & {
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
  static INITAL_INDEX = 'a0';

  private _disposables = new DisposableGroup();

  slots = {
    layerUpdated: new Slot<{
      type: 'delete' | 'add' | 'update';
      initiatingElement: BlockSuite.EdgelessModelType;
    }>(),
  };

  canvasElements!: SurfaceElementModel[];

  blocks!: EdgelessBlockModel[];

  frames!: FrameBlockModel[];

  layers!: Layer[];

  canvasLayers!: {
    set: Set<SurfaceElementModel>;
    /**
     * fractional index
     */
    indexes: [string, string];
    /**
     * z-index, used for actual rendering
     */
    zIndex: number;
    elements: Array<SurfaceElementModel>;
  }[];

  blocksGrid = new GridManager<EdgelessBlockModel>();

  framesGrid = new GridManager<FrameBlockModel>();

  canvasGrid = new GridManager<SurfaceElementModel>();

  constructor(elements?: BlockSuite.EdgelessModelType[]) {
    if (elements) {
      this._init(elements);
    }
  }

  private listen(doc: Doc, surface: SurfaceBlockModel) {
    this._disposables.add(
      doc.slots.blockUpdated.on(payload => {
        if (payload.type === 'add') {
          const block = doc.getBlockById(payload.id)!;

          if (
            block instanceof EdgelessBlockModel &&
            renderableInEdgeless(doc, surface, block) &&
            this.blocks.indexOf(block) === -1
          ) {
            this.add(block as EdgelessBlockModel);
          }
        }
        if (payload.type === 'update') {
          const block = doc.getBlockById(payload.id)!;

          if (
            payload.props.key === 'index' ||
            (payload.props.key === 'xywh' &&
              block instanceof EdgelessBlockModel &&
              renderableInEdgeless(doc, surface, block))
          ) {
            this.update(block as EdgelessBlockModel, {
              [payload.props.key]: true,
            });
          }
        }
        if (payload.type === 'delete') {
          const block = doc.getBlockById(payload.id);

          if (block instanceof EdgelessBlockModel) {
            this.delete(block as EdgelessBlockModel);
          }
        }
      })
    );

    this._disposables.add(
      surface.elementAdded.on(payload =>
        this.add(surface.getElementById(payload.id)!)
      )
    );
    this._disposables.add(
      surface.elementUpdated.on(payload => {
        if (
          payload.props['index'] ||
          payload.props['xywh'] ||
          payload.props['externalXYWH'] ||
          payload.props['childIds']
        ) {
          this.update(surface.getElementById(payload.id)!, payload.props);
        }
      })
    );
    this._disposables.add(
      surface.elementRemoved.on(payload => this.delete(payload.model!))
    );
  }

  private _init(elements: BlockSuite.EdgelessModelType[]) {
    this.canvasElements = [];
    this.blocks = [];
    this.frames = [];

    elements.forEach(element => {
      if (element instanceof SurfaceElementModel) {
        this.canvasElements.push(element);
        this.canvasGrid.add(element);
      } else if (matchFlavours(element, ['affine:frame'])) {
        this.framesGrid.add(element);
        this.frames.push(element);
      } else {
        this.blocksGrid.add(element);
        this.blocks.push(element);
      }
    });

    this.canvasElements.sort(compare);
    this.frames.sort(compare);
    this.blocks.sort(compare);

    this._initLayers();
    this._buildCanvasLayers();
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
              indexes: [LayerManager.INITAL_INDEX, LayerManager.INITAL_INDEX],
              zIndex: 0,
              set: new Set(),
              elements: [],
              bound: new Bound(),
            } as CanvasLayer)
          : ({
              type,
              indexes: [LayerManager.INITAL_INDEX, LayerManager.INITAL_INDEX],
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

  private _insertIntoLayer(
    target: BlockSuite.EdgelessModelType,
    type: 'block' | 'canvas'
  ) {
    if (this.layers.length === 0) {
      this._initLayers();
      return;
    }

    const layers = this.layers;
    let cur = layers.length - 1;

    const addToLayer = (
      layer: Layer,
      element: BlockSuite.EdgelessModelType,
      position: number | 'tail'
    ) => {
      assertType<CanvasLayer>(layer);
      assertType<SurfaceElementModel>(element);

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
      targets: BlockSuite.EdgelessModelType[],
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

    if (compare(target, last(last(this.layers)!.elements)!) > 0) {
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
            layer.set = new Set(layer.elements as SurfaceElementModel[]);

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

  private _removeFromLayer(
    target: BlockSuite.EdgelessModelType,
    type: 'block' | 'canvas'
  ) {
    const layers = this.layers;
    const index = layers.findIndex(layer => {
      if (layer.type !== type) return false;

      assertType<CanvasLayer>(layer);
      assertType<SurfaceElementModel>(target);

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
        indexes: [LayerManager.INITAL_INDEX, LayerManager.INITAL_INDEX],
      });
    }

    this.canvasLayers = canvasLayers;
  }

  /**
   * @returns a boolean value to indicate whether the layers have been updated
   */
  private _updateLayer(
    element: BlockSuite.EdgelessModelType,
    props?: Record<string, unknown>
  ) {
    let updateType: 'block' | 'canvas' | undefined = undefined;
    const type = 'flavour' in element ? element.flavour : element.type;

    const indexChanged = !props || 'index' in props;
    const childIdsChanged = props && 'childIds' in props;
    const updateArray = (
      array: BlockSuite.EdgelessModelType[],
      element: BlockSuite.EdgelessModelType
    ) => {
      if (!indexChanged) return;
      removeFromOrderedArray(array, element);
      insertToOrderedArray(array, element);
    };

    if (!type.startsWith('affine:')) {
      updateType = 'canvas';
      updateArray(this.canvasElements, element);
      this.canvasGrid.update(element as SurfaceElementModel);

      if (
        (type === 'group' || element instanceof SurfaceGroupLikeModel) &&
        (indexChanged || childIdsChanged)
      ) {
        (element as GroupElementModel).childElements.forEach(
          child => child && this._updateLayer(child)
        );
      }
    } else if (matchFlavours(element as BlockModel, ['affine:frame'])) {
      updateArray(this.frames, element);
      this.framesGrid.update(element as FrameBlockModel);
    } else {
      updateType = 'block';
      updateArray(this.blocks, element);
      this.blocksGrid.update(element as EdgelessBlockModel);
    }

    if (updateType && (indexChanged || childIdsChanged)) {
      this._removeFromLayer(
        element as BlockSuite.EdgelessModelType,
        updateType
      );
      this._insertIntoLayer(
        element as BlockSuite.EdgelessModelType,
        updateType
      );

      return true;
    }

    return false;
  }

  add(element: BlockSuite.EdgelessModelType) {
    let insertType: 'block' | 'canvas' | undefined = undefined;
    const type = 'flavour' in element ? element.flavour : element.type;

    if (!type.startsWith('affine:')) {
      insertType = 'canvas';
      insertToOrderedArray(this.canvasElements, element);
      this.canvasGrid.add(element as SurfaceElementModel);

      if (type === 'group' || element instanceof SurfaceGroupLikeModel) {
        (element as GroupElementModel).childElements.forEach(
          child => child && this._updateLayer(child)
        );
      }
    } else if (matchFlavours(element as BlockModel, ['affine:frame'])) {
      insertToOrderedArray(this.frames, element);
      this.framesGrid.add(element as FrameBlockModel);
    } else {
      insertType = 'block';
      insertToOrderedArray(this.blocks, element);
      this.blocksGrid.add(element as EdgelessBlockModel);
    }

    if (insertType) {
      this._insertIntoLayer(
        element as BlockSuite.EdgelessModelType,
        insertType
      );
      this._buildCanvasLayers();
      this.slots.layerUpdated.emit({
        type: 'add',
        initiatingElement: element,
      });
    }
  }

  delete(element: BlockSuite.EdgelessModelType) {
    let deleteType: 'canvas' | 'block' | undefined = undefined;

    if (element instanceof SurfaceElementModel) {
      deleteType = 'canvas';
      removeFromOrderedArray(this.canvasElements, element);
      this.canvasGrid.remove(element);
    } else if (matchFlavours(element, ['affine:frame'])) {
      removeFromOrderedArray(this.frames, element);
      this.framesGrid.remove(element as FrameBlockModel);
    } else {
      deleteType = 'block';
      removeFromOrderedArray(this.blocks, element);
      this.blocksGrid.remove(element);
    }

    if (deleteType) {
      this._removeFromLayer(element, deleteType);
      this._buildCanvasLayers();
      this.slots.layerUpdated.emit({
        type: 'delete',
        initiatingElement: element,
      });
    }
  }

  update(
    element: BlockSuite.EdgelessModelType,
    props?: Record<string, unknown>
  ) {
    if (this._updateLayer(element, props)) {
      this._buildCanvasLayers();
      this.slots.layerUpdated.emit({
        type: 'update',
        initiatingElement: element,
      });
    }
  }

  getCanvasLayers() {
    return this.canvasLayers;
  }

  generateIndex(elementType: string): string {
    const batch = elementType === 'affine:frame' ? 'frame' : 'common';
    const type = elementType.startsWith('affine:') ? 'block' : 'canvas';

    if (batch === 'frame') {
      const lastFrame = last(this.frames);

      return lastFrame
        ? generateKeyBetween(ungroupIndex(getElementIndex(lastFrame)), null)
        : LayerManager.INITAL_INDEX;
    } else {
      if (type === 'canvas') {
        const lastIndex = last(this.layers)?.indexes[1];

        return lastIndex
          ? generateKeyBetween(ungroupIndex(lastIndex), null)
          : LayerManager.INITAL_INDEX;
      }

      const lastLayer = last(this.layers);

      if (!lastLayer) return LayerManager.INITAL_INDEX;

      assertType<string>(lastLayer);

      if (lastLayer.type === 'canvas') {
        const secondLastLayer = nToLast(this.layers, 2);
        const secondLastLayerIndex = secondLastLayer
          ? ungroupIndex(secondLastLayer.indexes[1])
          : null;

        return generateKeyBetween(
          secondLastLayerIndex,
          secondLastLayerIndex && secondLastLayerIndex >= lastLayer.indexes[0]
            ? null
            : lastLayer.indexes[0]
        );
      }

      return generateKeyBetween(lastLayer.indexes[1], null);
    }
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
   * @param ignoreRule If true, the generator will not distinguish between `block` and `canvas` elements.
   * @returns
   */
  createIndexGenerator(ignoreRule: boolean = false) {
    const manager = new LayerManager();

    manager.frames = [...this.frames];
    manager.blocks = [...this.blocks];
    manager.canvasElements = [...this.canvasElements];
    // @ts-ignore
    manager.layers = this.layers.map(layer => {
      return {
        ...layer,
        // @ts-ignore
        set: new Set(layer.set),
        elements: [...layer.elements],
      };
    });
    manager._buildCanvasLayers();

    return (elementType: string) => {
      if (ignoreRule && elementType !== 'affine:frame') {
        elementType = 'shape';
      }

      const idx = manager.generateIndex(elementType);
      const bound = new Bound(0, 0, 10, 10);

      if (elementType === 'group') elementType = 'shape';

      const mockedFakeElement = {
        index: idx,
        flavour: elementType,
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        elementBound: bound,
        xywh: '[0, 0, 10, 10]',
        group: () => null,
        groups: () => [],
      };

      manager.add(mockedFakeElement as unknown as BlockSuite.EdgelessModelType);

      return idx;
    };
  }

  getReorderedIndex(
    element: BlockSuite.EdgelessModelType,
    direction: ReorderingDirection
  ): string {
    const group = element.group;
    const isFrameBlock =
      (element as FrameBlockModel).flavour === 'affine:frame';

    let elements: BlockSuite.EdgelessModelType[];

    if (group !== null) {
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
        (pre: BlockSuite.EdgelessModelType[], current) =>
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

          return generateKeyBetween(pre2?.index ?? null, pre.index);
        }
    }
  }

  /**
   * Pass to the `Array.sort` to  sort the elements by their index
   */
  compare(a: BlockSuite.EdgelessModelType, b: BlockSuite.EdgelessModelType) {
    return compare(a, b);
  }

  dispose() {
    this.slots.layerUpdated.dispose();
    this._disposables.dispose();
  }

  static create(doc: Doc, surface: SurfaceBlockModel) {
    const layerManager = new LayerManager(
      (
        doc
          .getBlocks()
          .filter(
            model =>
              model instanceof EdgelessBlockModel &&
              renderableInEdgeless(doc, surface, model)
          ) as BlockSuite.EdgelessModelType[]
      ).concat(surface.elementModels)
    );

    layerManager.listen(doc, surface);

    return layerManager;
  }
}
