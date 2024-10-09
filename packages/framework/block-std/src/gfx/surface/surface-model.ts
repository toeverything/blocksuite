import type { Boxed, Y } from '@blocksuite/store';

import { type Constructor, Slot } from '@blocksuite/global/utils';
import { BlockModel, DocCollection, nanoid } from '@blocksuite/store';

import { createDecoratorState } from './decorators/common.js';
import { initializeObservers, initializeWatchers } from './decorators/index.js';
import { syncElementFromY } from './element-model.js';
import {
  type BaseElementProps,
  GfxGroupLikeElementModel,
  GfxPrimitiveElementModel,
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

  protected _elementToGroup = new Map<string, string>();

  protected _elementTypeMap = new Map<string, GfxPrimitiveElementModel[]>();

  protected _groupToElements = new Map<string, string[]>();

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
              this._elementToGroup.delete(id);
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

  private _propsToY(type: string, props: Record<string, unknown>) {
    const ctor = this._elementCtorMap[type];

    if (!ctor) {
      throw new Error(`Invalid element type: ${type}`);
    }

    // @ts-ignore
    return (ctor.propsToY ?? GfxPrimitiveElementModel.propsToY)(props);
  }

  private _watchGroupRelationChange() {
    const addToGroup = (elementId: string, groupId: string) => {
      this._elementToGroup.set(elementId, groupId);
      this._groupToElements.set(
        groupId,
        (this._groupToElements.get(groupId) || []).concat(elementId)
      );
    };
    const removeFromGroup = (elementId: string, groupId: string) => {
      if (this._elementToGroup.has(elementId)) {
        const group = this._elementToGroup.get(elementId)!;
        if (group === groupId) {
          this._elementToGroup.delete(elementId);
        }
      }

      if (this._groupToElements.has(groupId)) {
        const elements = this._groupToElements.get(groupId)!;
        const index = elements.indexOf(elementId);

        if (index !== -1) {
          elements.splice(index, 1);
          elements.length === 0 && this._groupToElements.delete(groupId);
        }
      }
    };
    const isGroup = (
      element: GfxPrimitiveElementModel
    ): element is GfxGroupLikeElementModel =>
      element instanceof GfxGroupLikeElementModel;

    this.elementModels.forEach(model => {
      if (isGroup(model)) {
        model.childIds.forEach(childId => {
          addToGroup(childId, model.id);
        });
      }
    });

    this.elementUpdated.on(({ id, oldValues }) => {
      const element = this.getElementById(id)!;

      if (isGroup(element) && oldValues['childIds']) {
        (oldValues['childIds'] as string[]).forEach(childId => {
          removeFromGroup(childId, id);
        });

        element.childIds.forEach(childId => {
          addToGroup(childId, id);
        });

        if (element.childIds.length === 0) {
          this.removeElement(id);
        }
      }
    });

    this.elementAdded.on(({ id }) => {
      const element = this.getElementById(id)!;

      if (isGroup(element)) {
        element.childIds.forEach(childId => {
          addToGroup(childId, id);
        });
      }
    });

    this.elementRemoved.on(({ id, model }) => {
      if (isGroup(model)) {
        const children = [...(this._groupToElements.get(id) || [])];

        children.forEach(childId => removeFromGroup(childId, id));
      }
    });

    const disposeGroup = this.doc.slots.blockUpdated.on(({ type, id }) => {
      switch (type) {
        case 'delete': {
          const group = this.getGroup(id);

          if (group) {
            // eslint-disable-next-line unicorn/prefer-dom-node-remove
            group.removeChild(id);
          }
        }
      }
    });
    this.deleted.on(() => {
      disposeGroup.dispose();
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
    return this._elementToGroup.has(id)
      ? (this.getElementById(this._elementToGroup.get(id)!) as T)
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
      const group = this.getGroup(id);

      if (element instanceof GfxGroupLikeElementModel) {
        element.childIds.forEach(childId => {
          if (this.hasElementById(childId)) {
            this.removeElement(childId);
          } else if (this.doc.hasBlock(childId)) {
            this.doc.deleteBlock(this.doc.getBlock(childId)!.model);
          }
        });
      }

      if (group) {
        // eslint-disable-next-line unicorn/prefer-dom-node-remove
        group.removeChild(id);
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
