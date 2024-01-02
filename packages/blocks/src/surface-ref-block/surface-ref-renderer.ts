import type { BlockStdScope } from '@blocksuite/block-std';
import { assertExists, DisposableGroup, Slot } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import { type Y } from '@blocksuite/store';

import {
  type CssVariableName,
  isCssVariable,
} from '../_common/theme/css-variables.js';
import { getThemePropertyValue } from '../_common/theme/utils.js';
import type { EdgelessElement, TopLevelBlockModel } from '../_common/types.js';
import type { NoteBlockModel } from '../note-block/index.js';
import { ConnectorPathGenerator } from '../page-block/edgeless/connector-manager.js';
import type { SurfaceElement } from '../surface-block/elements/surface-element.js';
import {
  type CanvasElementType,
  ConnectorElement,
  ElementCtors,
  Renderer,
} from '../surface-block/index.js';
import {
  getGroupParent,
  setGroupParent,
} from '../surface-block/managers/group-manager.js';
import { LayerManager } from '../surface-block/managers/layer-manager.js';
import type { SurfaceBlockModel } from '../surface-block/surface-model.js';
import { getSurfaceBlock } from './utils.js';

type RefElement = Exclude<EdgelessElement, NoteBlockModel>;

export class SurfaceRefRenderer {
  private readonly _surfaceRenderer: Renderer;
  private readonly _connectorManager: ConnectorPathGenerator;
  private readonly _elements: Map<string, SurfaceElement>;

  private _surfaceModel: SurfaceBlockModel | null = null;
  protected _disposables = new DisposableGroup();

  slots = {
    surfaceRendererInit: new Slot(),
    surfaceRendererRefresh: new Slot(),
    surfaceModelChanged: new Slot<SurfaceBlockModel>(),
    mounted: new Slot(),
    unmounted: new Slot(),
  };

  get surfaceRenderer() {
    return this._surfaceRenderer;
  }

  get elements() {
    return this._elements;
  }

  get connectorManager() {
    return this._connectorManager;
  }

  constructor(
    public readonly id: string,
    public readonly page: Page,
    public readonly std: BlockStdScope
  ) {
    const layerManager = new LayerManager();

    const renderer = new Renderer({ layerManager });
    this._surfaceRenderer = renderer;

    this._connectorManager = new ConnectorPathGenerator({
      pickById: id => this.getModel(id),
      refresh: () => renderer.refresh(),
    });

    this._elements = new Map<string, SurfaceElement>();
  }

  mount() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }

    this._initSurfaceModel();
    this._initSurfaceRenderer();
    this.slots.mounted.emit();
  }

  unmount() {
    this._disposables.dispose();
    this.slots.unmounted.emit();
  }

  getModel(id: string): RefElement | null {
    return (
      (this.page.getBlockById(id) as Exclude<
        TopLevelBlockModel,
        NoteBlockModel
      >) ??
      this._elements.get(id) ??
      null
    );
  }

  private _initSurfaceRenderer() {
    this._surfaceRenderer.layerManager.init([
      ...this._elements.values(),
      ...((this._surfaceModel?.children || []) as EdgelessElement[]),
      ...(this.page.getBlockByFlavour('affine:note') as EdgelessElement[]),
    ]);
    this.slots.surfaceRendererInit.emit();
  }

  private _initSurfaceModel() {
    const init = () => {
      const model = getSurfaceBlock(this.page);
      this._surfaceModel = model;
      this.slots.surfaceModelChanged.emit(model);

      if (!this._surfaceModel) return;

      const elementsMap = this._surfaceModel.elements.getValue() as Y.Map<
        Y.Map<unknown>
      >;
      const onElementsChange = (event: Y.YMapEvent<Y.Map<unknown>>) => {
        this._onElementsChange(event, elementsMap);
      };
      elementsMap.observe(onElementsChange);
      this._disposables.add(() => elementsMap.unobserve(onElementsChange));

      this._syncFromExistingContainer(elementsMap);
    };

    init();

    if (!this._surfaceModel) {
      this._disposables.add(
        this.page.slots.blockUpdated.on(({ type }) => {
          if (
            type === 'add' &&
            !this._surfaceModel &&
            getSurfaceBlock(this.page)
          ) {
            init();
          }
        })
      );
    }
  }

  private _onElementsChange = (
    event: Y.YMapEvent<Y.Map<unknown>>,
    elementsMap: Y.Map<Y.Map<unknown>>
  ) => {
    // skip empty event
    if (event.changes.keys.size === 0) return;
    const connectors: {
      change: (typeof event)['changes']['keys'] extends Map<string, infer V>
        ? V
        : never;
      id: string;
    }[] = [];
    event.keysChanged.forEach(id => {
      const change = event.changes.keys.get(id);
      if (!change) {
        console.error('invalid event', event);
        return;
      }

      if (
        change.action === 'add' &&
        elementsMap.get(id)?.get('type') === 'connector'
      ) {
        connectors.push({ change, id });
        return;
      } else {
        this._onYEvent(change, id, elementsMap);
      }
    });
    connectors.forEach(({ change, id }) =>
      this._onYEvent(change, id, elementsMap)
    );
  };

  private _onYEvent = (
    type: Y.YMapEvent<Y.Map<unknown>>['changes']['keys'] extends Map<
      string,
      infer V
    >
      ? V
      : never,
    id: string,
    elementsMap: Y.Map<Y.Map<unknown>>
  ) => {
    if (type.action === 'add') {
      const yElement = elementsMap.get(id) as Y.Map<unknown>;
      const type = yElement.get('type') as CanvasElementType;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement, {
        onElementUpdated() {},
        pickById: id => this.getModel(id),
        getGroupParent: getGroupParent,
        setGroupParent: setGroupParent,
        removeElement: () => {},
      });
      element.computedValue = this._getCSSPropertyValue;
      element.mount(this._surfaceRenderer);
      this._elements.set(element.id, element);
      this._onElementUpdatedOrAdded(element.id);
    } else if (type.action === 'update') {
      console.error('update event on yElements is not supported', event);
    } else if (type.action === 'delete') {
      const element = this._elements.get(id);

      if (element) {
        element.unmount();
        this._elements.delete(id);
      }
    }

    this._surfaceRenderer.refresh();
    this.slots.surfaceRendererRefresh.emit();
  };

  private _getCSSPropertyValue = (value: string) => {
    const root = this.std.host;
    if (isCssVariable(value)) {
      const cssValue = getThemePropertyValue(root, value as CssVariableName);
      if (cssValue === undefined) {
        console.error(
          new Error(
            `All variables should have a value. Please check for any dirty data or variable renaming.Variable: ${value}`
          )
        );
      }
      return cssValue ?? value;
    }

    return value;
  };

  private _syncFromExistingContainer(elementsMap: Y.Map<Y.Map<unknown>>) {
    elementsMap.doc?.transact(() => {
      const yConnectors: Y.Map<unknown>[] = [];
      const yGroups: Y.Map<unknown>[] = [];
      elementsMap.forEach(yElement => {
        const type = yElement.get('type') as CanvasElementType;
        if (type === 'connector') {
          yConnectors.push(yElement);
          return;
        }
        if (type === 'group') {
          yGroups.push(yElement);
          return;
        }
        this._createElementFromYMap(yElement);
      });
      yConnectors.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
      yGroups.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
    });
  }

  private _createElementFromYMap(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as CanvasElementType;
    const ElementCtor = ElementCtors[type];
    assertExists(ElementCtor);
    const element = new ElementCtor(yElement, {
      onElementUpdated: ({ id }) => {
        const element = this.getModel(id);

        if (
          element instanceof ConnectorElement &&
          !this._connectorManager.hasRelatedElement(element)
        ) {
          this._connectorManager.updatePath(element);
        }
      },
      removeElement: () => {},
      pickById: id => this.getModel(id),
      getGroupParent: getGroupParent,
      setGroupParent: setGroupParent,
    });
    element.computedValue = this._getCSSPropertyValue;
    element.mount(this._surfaceRenderer);
    this._elements.set(element.id, element);
    this._onElementUpdatedOrAdded(element.id);
  }

  private _onElementUpdatedOrAdded(id: string) {
    const element = this.getModel(id);

    if (
      element instanceof ConnectorElement &&
      this._connectorManager.hasRelatedElement(element)
    ) {
      this._connectorManager.updatePath(element);
    }
  }
}
