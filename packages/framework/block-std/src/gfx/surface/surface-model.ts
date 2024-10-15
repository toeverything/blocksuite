import type { Boxed, Y } from '@blocksuite/store';

import { type Constructor, Slot } from '@blocksuite/global/utils';
import { BlockModel, DocCollection, nanoid } from '@blocksuite/store';

import type { GfxModel } from '../gfx-block-model.js';

import { TreeManager } from '../tree.js';
import {
  type GfxContainerElement,
  isGfxContainerElm,
} from './container-element.js';
import { createDecoratorState } from './decorators/common.js';
import { initializeObservers, initializeWatchers } from './decorators/index.js';
import {
  type BaseElementProps,
  GfxGroupLikeElementModel,
  GfxPrimitiveElementModel,
  syncElementFromY,
} from './element-model.js';

export type SurfaceBlockProps = {
  elements: Boxed<Y.Map<Y.Map<unknown>>>;
};

export interface ElementUpdatedData {
  id: string;
  props: Record<string, unknown>;
  oldValues: Record<string, unknown>;
  local: boolean;
}

export type SurfaceMiddleware = (
  surface: SurfaceBlockModel,
  hooks: SurfaceBlockModel['hooks']
) => () => void;

export class SurfaceBlockModel extends BlockModel<SurfaceBlockProps> {
  private _tree = new TreeManager(this);

  protected _decoratorState = createDecoratorState();

  protected _elementCtorMap: Record<
    string,
    Constructor<
      GfxPrimitiveElementModel,
      ConstructorParameters<typeof GfxPrimitiveElementModel>
    >
  > = Object.create(null);

  protected _elementModels = new Map<
    string,
    {
      mount: () => void;
      unmount: () => void;
      model: GfxPrimitiveElementModel;
    }
  >();

  protected _elementTypeMap = new Map<string, GfxPrimitiveElementModel[]>();

  protected _surfaceBlockModel = true;

  elementAdded = new Slot<{ id: string; local: boolean }>();

  elementRemoved = new Slot<{
    id: string;
    type: string;
    model: GfxPrimitiveElementModel;
    local: boolean;
  }>();

  elementUpdated = new Slot<ElementUpdatedData>();

  /**
   * Hooks is used to attach extra logic when calling `addElement`、`updateElement`(or assign property directly) and `removeElement`.
   * It's useful when dealing with relation between different model.
   */
  protected hooks = {
    update: new Slot<Omit<ElementUpdatedData, 'local'>>(),
    remove: new Slot<{
      id: string;
      type: string;
      model: GfxPrimitiveElementModel;
    }>(),
  };

  get elementModels() {
    const models: GfxPrimitiveElementModel[] = [];
    this._elementModels.forEach(model => models.push(model.model));
    return models;
  }

  get registeredElementTypes() {
    return Object.keys(this._elementCtorMap);
  }

  constructor() {
    super();
    this.created.once(() => this._init());
  }

  private _createElementFromProps(
    props: Record<string, unknown>,
    options: {
      onChange: (payload: {
        id: string;
        props: Record<string, unknown>;
        oldValues: Record<string, unknown>;
        local: boolean;
      }) => void;
    }
  ) {
    const { type, id, ...rest } = props;

    if (!id) {
      throw new Error('Cannot find id in props');
    }

    const yMap = new DocCollection.Y.Map();
    const elementModel = this._createElementFromYMap(
      type as string,
      id as string,
      yMap,
      {
        ...options,
        newCreate: true,
      }
    );

    props = this._propsToY(type as string, props);

    yMap.set('type', type);
    yMap.set('id', id);

    Object.keys(rest).forEach(key => {
      if (props[key] !== undefined) {
        // @ts-ignore
        elementModel.model[key] = props[key];
      }
    });

    return elementModel;
  }

  private _createElementFromYMap(
    type: string,
    id: string,
    yMap: Y.Map<unknown>,
    options: {
      onChange: (payload: {
        id: string;
        props: Record<string, unknown>;
        oldValues: Record<string, unknown>;
        local: boolean;
      }) => void;
      skipFieldInit?: boolean;
      newCreate?: boolean;
    }
  ) {
    const stashed = new Map<string | symbol, unknown>();
    const Ctor = this._elementCtorMap[type];

    if (!Ctor) {
      throw new Error(`Invalid element type: ${yMap.get('type')}`);
    }
    const state = this._decoratorState;

    state.creating = true;
    state.skipField = options.skipFieldInit ?? false;

    let mounted = false;
    // @ts-ignore
    Ctor['_decoratorState'] = state;

    const elementModel = new Ctor({
      id,
      yMap,
      model: this,
      stashedStore: stashed,
      onChange: payload => mounted && options.onChange({ id, ...payload }),
    }) as GfxPrimitiveElementModel;

    // @ts-ignore
    delete Ctor['_decoratorState'];
    state.creating = false;
    state.skipField = false;

    const unmount = () => {
      mounted = false;
      elementModel['_disposable'].dispose();
    };

    const mount = () => {
      initializeObservers(Ctor.prototype, elementModel);
      initializeWatchers(Ctor.prototype, elementModel);
      elementModel['_disposable'].add(
        syncElementFromY(elementModel, payload => {
          mounted &&
            options.onChange({
              id,
              ...payload,
            });
        })
      );
      mounted = true;
      elementModel.onCreated();
    };

    return {
      model: elementModel,
      mount,
      unmount,
    };
  }

  private _initElementModels() {
    const elementsYMap = this.elements.getValue()!;
    const addToType = (type: string, model: GfxPrimitiveElementModel) => {
      const sameTypeElements = this._elementTypeMap.get(type) || [];

      if (sameTypeElements.indexOf(model) === -1) {
        sameTypeElements.push(model);
      }

      this._elementTypeMap.set(type, sameTypeElements);
    };
    const removeFromType = (type: string, model: GfxPrimitiveElementModel) => {
      const sameTypeElements = this._elementTypeMap.get(type) || [];
      const index = sameTypeElements.indexOf(model);

      if (index !== -1) {
        sameTypeElements.splice(index, 1);
      }
    };
    const onElementsMapChange = (
      event: Y.YMapEvent<Y.Map<unknown>>,
      transaction: Y.Transaction
    ) => {
      const { changes, keysChanged } = event;
      const addedElements: {
        mount: () => void;
        model: GfxPrimitiveElementModel;
      }[] = [];
      const deletedElements: {
        unmount: () => void;
        model: GfxPrimitiveElementModel;
      }[] = [];

      keysChanged.forEach(id => {
        const change = changes.keys.get(id);
        const element = this.elements.getValue()!.get(id);

        switch (change?.action) {
          case 'add':
            if (element) {
              const hasModel = this._elementModels.has(id);
              const model = hasModel
                ? this._elementModels.get(id)!
                : this._createElementFromYMap(
                    element.get('type') as string,
                    element.get('id') as string,
                    element,
                    {
                      onChange: payload => this.elementUpdated.emit(payload),
                      skipFieldInit: true,
                    }
                  );

              !hasModel && this._elementModels.set(id, model);
              addToType(model.model.type, model.model);
              addedElements.push(model);
            }
            break;
          case 'delete':
            if (this._elementModels.has(id)) {
              const { model, unmount } = this._elementModels.get(id)!;
              removeFromType(model.type, model);
              this._elementModels.delete(id);
              deletedElements.push({ model, unmount });
            }
            break;
        }
      });

      addedElements.forEach(({ mount, model }) => {
        mount();
        this.elementAdded.emit({ id: model.id, local: transaction.local });
      });
      deletedElements.forEach(({ unmount, model }) => {
        unmount();
        this.elementRemoved.emit({
          id: model.id,
          type: model.type,
          model,
          local: transaction.local,
        });
      });
    };

    elementsYMap.forEach((val, key) => {
      const model = this._createElementFromYMap(
        val.get('type') as string,
        val.get('id') as string,
        val,
        {
          onChange: payload => this.elementUpdated.emit(payload),
          skipFieldInit: true,
        }
      );

      this._elementModels.set(key, model);
    });

    this._elementModels.forEach(({ mount, model }) => {
      addToType(model.type, model);
      mount();
    });
    elementsYMap.observe(onElementsMapChange);

    this.deleted.on(() => {
      elementsYMap.unobserve(onElementsMapChange);
    });
  }

  private _initTreeWatcher() {
    const disposable = this._tree.watch();
    this.deleted.on(() => disposable.dispose());
  }

  private _propsToY(type: string, props: Record<string, unknown>) {
    const ctor = this._elementCtorMap[type];

    if (!ctor) {
      throw new Error(`Invalid element type: ${type}`);
    }

    // @ts-ignore
    return (ctor.propsToY ?? GfxPrimitiveElementModel.propsToY)(props);
  }

  private _watchGroupRelationChange() {
    const isGroup = (
      element: GfxPrimitiveElementModel
    ): element is GfxGroupLikeElementModel =>
      element instanceof GfxGroupLikeElementModel;

    const disposable = this.elementUpdated.on(({ id, oldValues }) => {
      const element = this.getElementById(id)!;

      if (isGroup(element) && oldValues['childIds']) {
        if (element.childIds.length === 0) {
          this.removeElement(id);
        }
      }
    });
    this.deleted.on(() => {
      disposable.dispose();
    });
  }

  protected _extendElement(
    ctorMap: Record<
      string,
      Constructor<
        GfxPrimitiveElementModel,
        ConstructorParameters<typeof GfxPrimitiveElementModel>
      >
    >
  ) {
    Object.assign(this._elementCtorMap, ctorMap);
  }

  protected _init() {
    this._initElementModels();
    this._initTreeWatcher();
    this._watchGroupRelationChange();
    this.applyMiddlewares();
  }

  addElement<T extends object = Record<string, unknown>>(
    props: Partial<T> & { type: string }
  ) {
    if (this.doc.readonly) {
      throw new Error('Cannot add element in readonly mode');
    }

    const id = nanoid();

    // @ts-ignore
    props.id = id;

    const elementModel = this._createElementFromProps(props, {
      onChange: payload => this.elementUpdated.emit(payload),
    });

    this._elementModels.set(id, elementModel);

    this.doc.transact(() => {
      this.elements.getValue()!.set(id, elementModel.model.yMap);
    });

    return id;
  }

  protected applyMiddlewares() {}

  override dispose(): void {
    super.dispose();

    this.elementAdded.dispose();
    this.elementRemoved.dispose();
    this.elementUpdated.dispose();

    this._elementModels.forEach(({ unmount }) => unmount());
    this._elementModels.clear();

    this.hooks.update.dispose();
    this.hooks.remove.dispose();
  }

  getContainer(elementId: string) {
    return this._tree.getContainer(elementId);
  }

  getElementById(id: string): GfxPrimitiveElementModel | null {
    return this._elementModels.get(id)?.model ?? null;
  }

  getElementsByType(type: string): GfxPrimitiveElementModel[] {
    return this._elementTypeMap.get(type) || [];
  }

  getGroup<
    T extends
      GfxGroupLikeElementModel<BaseElementProps> = GfxGroupLikeElementModel<BaseElementProps>,
  >(id: string): T | null {
    const container = this.getContainer(id);
    return container instanceof GfxGroupLikeElementModel
      ? (container as T)
      : null;
  }

  getGroups(id: string): GfxGroupLikeElementModel<BaseElementProps>[] {
    const groups: GfxGroupLikeElementModel<BaseElementProps>[] = [];
    let group = this.getGroup(id);

    while (group) {
      groups.push(group);
      group = this.getGroup(group.id);
    }

    return groups;
  }

  hasElementById(id: string): boolean {
    return this._elementModels.has(id);
  }

  isContainer(element: GfxModel): element is GfxModel & GfxContainerElement;
  isContainer(id: string): boolean;
  isContainer(element: string | GfxModel): boolean {
    if (typeof element === 'string') {
      const el = this.getElementById(element);
      if (el) return isGfxContainerElm(el);

      const blockModel = this.doc.getBlock(element)?.model;
      if (blockModel) return isGfxContainerElm(blockModel);

      return false;
    } else {
      return isGfxContainerElm(element);
    }
  }

  isInMindmap(id: string) {
    const group = this.getGroup(id);

    return group?.type === 'mindmap';
  }

  removeElement(id: string) {
    if (this.doc.readonly) {
      throw new Error('Cannot remove element in readonly mode');
    }

    if (!this.hasElementById(id)) {
      return;
    }

    this.doc.transact(() => {
      const element = this.getElementById(id)!;

      if (element instanceof GfxGroupLikeElementModel) {
        element.childIds.forEach(childId => {
          if (this.hasElementById(childId)) {
            this.removeElement(childId);
          } else if (this.doc.hasBlock(childId)) {
            this.doc.deleteBlock(this.doc.getBlock(childId)!.model);
          }
        });
      }

      this.elements.getValue()!.delete(id);

      this.hooks.remove.emit({
        id,
        model: element as GfxPrimitiveElementModel,
        type: element.type,
      });
    });
  }

  updateElement<T extends object = Record<string, unknown>>(
    id: string,
    props: Partial<T>
  ) {
    if (this.doc.readonly) {
      throw new Error('Cannot update element in readonly mode');
    }

    const elementModel = this.getElementById(id);

    if (!elementModel) {
      throw new Error(`Element ${id} is not found`);
    }

    this.doc.transact(() => {
      props = this._propsToY(
        elementModel.type,
        props as Record<string, unknown>
      ) as T;
      Object.entries(props).forEach(([key, value]) => {
        // @ts-ignore
        elementModel[key] = value;
      });
    });
  }
}
