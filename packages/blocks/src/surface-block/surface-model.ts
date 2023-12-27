import { Slot } from '@blocksuite/global/utils';
import type { MigrationRunner, Y } from '@blocksuite/store';
import {
  BaseBlockModel,
  Boxed,
  defineBlockSchema,
  Text,
  Workspace,
} from '@blocksuite/store';

import type { ElementModel } from './element-model/base.js';
import { createElementModel } from './element-model/index.js';
import { generateElementId } from './index.js';
import { SurfaceBlockTransformer } from './surface-transformer.js';

export type SurfaceBlockProps = {
  elements: Boxed<Y.Map<Y.Map<unknown>>>;
};

const migration = {
  toV4: data => {
    const { elements } = data;
    if (elements instanceof Boxed) {
      const value = elements.getValue();
      if (!value) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const [key, element] of (value as Record<string, any>).entries()) {
        const type = element.get('type') as string;
        if (type === 'shape' || type === 'text') {
          const isBold = element.get('isBold');
          const isItalic = element.get('isItalic');
          element.delete('isBold');
          element.delete('isItalic');
          if (isBold) {
            element.set('bold', true);
          }
          if (isItalic) {
            element.set('italic', true);
          }
        }
        if (type === 'connector') {
          const source = element.get('source');
          const target = element.get('target');
          const sourceId = source['id'];
          const targetId = target['id'];
          if (!source['position'] && (!sourceId || !value.get(sourceId))) {
            value.delete(key);
            return;
          }
          if (!target['position'] && (!targetId || !value.get(targetId))) {
            value.delete(key);
            return;
          }
        }
      }
    } else {
      for (const key of Object.keys(elements)) {
        const element = elements[key] as Record<string, unknown>;
        const type = element['type'] as string;
        if (type === 'shape' || type === 'text') {
          const isBold = element['isBold'];
          const isItalic = element['isItalic'];
          delete element['isBold'];
          delete element['isItalic'];
          if (isBold) {
            element['bold'] = true;
          }
          if (isItalic) {
            element['italic'] = true;
          }
        }
        if (type === 'connector') {
          const source = element['source'] as Record<string, unknown>;
          const target = element['target'] as Record<string, unknown>;
          const sourceId = source['id'];
          const targetId = target['id'];
          // @ts-expect-error
          if (!source['position'] && (!sourceId || !elements[sourceId])) {
            delete elements[key];
            return;
          }
          // @ts-expect-error
          if (!target['position'] && (!targetId || !elements[targetId])) {
            delete elements[key];
            return;
          }
        }
      }
    }
  },
  toV5: data => {
    const { elements } = data;
    if (!((elements as object | Boxed) instanceof Boxed)) {
      const yMap = new Workspace.Y.Map() as Y.Map<Y.Map<unknown>>;

      Object.entries(elements).forEach(([key, value]) => {
        const map = new Workspace.Y.Map();
        Object.entries(value).forEach(([_key, _value]) => {
          map.set(
            _key,
            _value instanceof Workspace.Y.Text
              ? _value.clone()
              : _value instanceof Text
                ? _value.yText.clone()
                : _value
          );
        });
        yMap.set(key, map);
      });
      const wrapper = new Boxed(yMap);
      data.elements = wrapper;
    }
  },
} satisfies Record<string, MigrationRunner<typeof SurfaceBlockSchema>>;

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  props: (internalPrimitives): SurfaceBlockProps => ({
    elements: internalPrimitives.Boxed(new Workspace.Y.Map()),
  }),
  metadata: {
    version: 5,
    role: 'hub',
    parent: ['affine:page'],
    children: [
      'affine:frame',
      'affine:image',
      'affine:embed-*',
      'affine:bookmark',
    ],
  },
  onUpgrade: (data, previousVersion, version) => {
    if (previousVersion < 4 && version >= 4) {
      migration.toV4(data);
    }
    if (previousVersion < 5 && version >= 5) {
      migration.toV5(data);
    }
  },
  transformer: () => new SurfaceBlockTransformer(),
});

export class SurfaceBlockModel extends BaseBlockModel<SurfaceBlockProps> {
  private _elementModels: Map<
    string,
    { dispose: () => void; model: ElementModel }
  > = new Map();
  private _disposables: Array<() => void> = [];

  elementUpdated = new Slot<{ id: string; props: Record<string, unknown> }>();
  elementAdded = new Slot<{ id: string }>();
  elementRemoved = new Slot<{ id: string; model: ElementModel }>();

  get elementModels() {
    const models: ElementModel[] = [];
    this._elementModels.forEach(model => models.push(model.model));
    return models;
  }

  constructor() {
    super();
    this.created.once(() => this._init());
  }

  private _init() {
    const elementsYMap = this.elements.getValue()!;
    const emitUpdatedSlot = (payload: {
      id: string;
      props: Record<string, unknown>;
    }) => this.elementUpdated.emit(payload);
    const createModel = (yMap: Y.Map<unknown>) =>
      createElementModel(yMap, this, {
        onChange: emitUpdatedSlot,
      });
    const onElementsMapChange = (event: Y.YMapEvent<Y.Map<unknown>>) => {
      const { changes, keysChanged } = event;

      keysChanged.forEach(id => {
        const change = changes.keys.get(id);
        const element = this.elements.getValue()!.get(id);

        switch (change?.action) {
          case 'add':
            if (!this._elementModels.has(id) && element) {
              this._elementModels.set(id, createModel(element));
              this.elementAdded.emit({ id });
            }
            break;
          case 'delete':
            if (this._elementModels.has(id)) {
              const { model, dispose } = this._elementModels.get(id)!;
              dispose();
              this._elementModels.delete(id);
              this.elementRemoved.emit({ id, model });
            }
            break;
        }
      });
    };

    elementsYMap.forEach((val, key) => {
      this._elementModels.set(key, createModel(val));
    });
    elementsYMap.observe(onElementsMapChange);

    this._disposables.push(() => {
      elementsYMap.unobserve(onElementsMapChange);
    });
  }

  override dispose(): void {
    super.dispose();
    this._disposables.forEach(dispose => dispose());
  }

  getElementById(id: string) {
    return this._elementModels.get(id)?.model ?? null;
  }

  addElement(props: Record<string, unknown>) {
    if (this.page.readonly) {
      throw new Error('Cannot add element in readonly mode');
    }

    const id = generateElementId();
    const yMap = new Workspace.Y.Map();

    props.id = id;

    Object.entries(props).forEach(([key, value]) => {
      if (
        (key === 'text' || key === 'title') &&
        !(value instanceof Workspace.Y.Text)
      ) {
        yMap.set(key, new Workspace.Y.Text(value as string));
      } else {
        yMap.set(key, value);
      }
    });

    this.page.transact(() => {
      this.elements.getValue()!.set(id, yMap);
    });
  }

  removeElement(id: string) {
    if (this.page.readonly) {
      throw new Error('Cannot remove element in readonly mode');
    }

    this.page.transact(() => {
      this.elements.getValue()!.delete(id);
    });
  }

  updateElement(props: Record<string, unknown>) {
    if (this.page.readonly) {
      throw new Error('Cannot update element in readonly mode');
    }

    const id = props.id as string;
    const elementModel = this._elementModels.get(id);

    if (!elementModel) {
      throw new Error(`Element ${id} is not found`);
    }

    this.page.transact(() => {
      Object.entries(props).forEach(([key, value]) => {
        if (key === 'text' && !(value instanceof Workspace.Y.Text)) {
          // @ts-ignore
          elementModel[key] = new Workspace.Y.Text(value as string);
        } else {
          // @ts-ignore
          elementModel[key] = value;
        }
      });
    });
  }
}
