import type { BlockService } from '@blocksuite/block-std';

import { getShapeName, type ShapeProps } from '@blocksuite/affine-model';
import { ColorSchema, NodePropsSchema } from '@blocksuite/affine-shared/utils';
import {
  type DeepPartial,
  DisposableGroup,
  Slot,
} from '@blocksuite/global/utils';
import { computed, type Signal, signal } from '@lit-labs/preact-signals';
import clonedeep from 'lodash.clonedeep';
import isPlainObject from 'lodash.isplainobject';
import merge from 'lodash.merge';
import { z } from 'zod';

const LastPropsSchema = NodePropsSchema;
export type LastProps = z.infer<typeof NodePropsSchema>;
export type LastPropsKey = keyof LastProps;

const SESSION_PROP_KEY = 'blocksuite:prop:record';

const SessionPropsSchema = z.object({
  viewport: z.union([
    z.object({
      centerX: z.number(),
      centerY: z.number(),
      zoom: z.number(),
    }),
    z.object({
      xywh: z.string(),
      padding: z
        .tuple([z.number(), z.number(), z.number(), z.number()])
        .optional(),
    }),
  ]),
  templateCache: z.string(),
  remoteColor: z.string(),
  showBidirectional: z.boolean(),
});

const LocalPropsSchema = z.object({
  presentBlackBackground: z.boolean(),
  presentFillScreen: z.boolean(),
  presentHideToolbar: z.boolean(),

  autoHideEmbedHTMLFullScreenToolbar: z.boolean(),
});

type SessionProps = z.infer<typeof SessionPropsSchema>;
type LocalProps = z.infer<typeof LocalPropsSchema>;
type StorageProps = SessionProps & LocalProps;
type StoragePropsKey = keyof StorageProps;

function isLocalProp(key: string): key is keyof LocalProps {
  return key in LocalPropsSchema.shape;
}

function isSessionProp(key: string): key is keyof SessionProps {
  return key in SessionPropsSchema.shape;
}

export type SerializedViewport = z.infer<
  typeof SessionPropsSchema.shape.viewport
>;

export class EditPropsStore {
  private _disposables = new DisposableGroup();

  private innerProps$: Signal<DeepPartial<LastProps>> = signal({});

  lastProps$: Signal<LastProps>;

  slots = {
    storageUpdated: new Slot<{
      key: StoragePropsKey;
      value: StorageProps[StoragePropsKey];
    }>(),
  };

  constructor(private _service: BlockService) {
    const initProps: LastProps = LastPropsSchema.parse(
      Object.entries(LastPropsSchema.shape).reduce((value, [key, schema]) => {
        return {
          ...value,
          [key]: schema.parse(undefined),
        };
      }, {})
    );

    const props = sessionStorage.getItem(SESSION_PROP_KEY);
    if (props) {
      const result = LastPropsSchema.safeParse(JSON.parse(props));
      if (result.success) {
        merge(clonedeep(initProps), result.data);
      }
    }

    this.lastProps$ = computed(() => {
      const editorSetting$ =
        this._service.std.getConfig('affine:page')?.editorSetting;
      return merge(
        clonedeep(initProps),
        editorSetting$?.value,
        this.innerProps$.value
      );
    });
  }

  private _getStorage<T extends StoragePropsKey>(key: T) {
    return isSessionProp(key) ? sessionStorage : localStorage;
  }

  private _getStorageKey<T extends StoragePropsKey>(key: T) {
    const id = this._service.doc.id;
    switch (key) {
      case 'viewport':
        return 'blocksuite:' + id + ':edgelessViewport';
      case 'presentBlackBackground':
        return 'blocksuite:presentation:blackBackground';
      case 'presentFillScreen':
        return 'blocksuite:presentation:fillScreen';
      case 'presentHideToolbar':
        return 'blocksuite:presentation:hideToolbar';
      case 'templateCache':
        return 'blocksuite:' + id + ':templateTool';
      case 'remoteColor':
        return 'blocksuite:remote-color';
      case 'showBidirectional':
        return 'blocksuite:' + id + ':showBidirectional';
      case 'autoHideEmbedHTMLFullScreenToolbar':
        return 'blocksuite:embedHTML:autoHideFullScreenToolbar';
      default:
        return key;
    }
  }

  applyLastProps(key: LastPropsKey, props: Record<string, unknown>) {
    const lastProps = this.lastProps$.value[key];
    return merge(clonedeep(lastProps), props);
  }

  dispose() {
    this._disposables.dispose();
  }

  getStorage<T extends StoragePropsKey>(key: T) {
    try {
      const storage = this._getStorage(key);
      const value = storage.getItem(this._getStorageKey(key));
      if (!value) return null;
      if (isLocalProp(key)) {
        return LocalPropsSchema.shape[key].parse(
          JSON.parse(value)
        ) as StorageProps[T];
      } else if (isSessionProp(key)) {
        return SessionPropsSchema.shape[key].parse(
          JSON.parse(value)
        ) as StorageProps[T];
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  recordLastProps(key: LastPropsKey, props: Partial<LastProps[LastPropsKey]>) {
    const overrideProps = extractProps(
      props,
      LastPropsSchema.shape[key]._def.innerType
    );
    if (Object.keys(overrideProps).length === 0) return;

    const innerProps = this.innerProps$.value;
    this.innerProps$.value = merge(clonedeep(innerProps), {
      [key]: overrideProps,
    });
  }

  setStorage<T extends StoragePropsKey>(key: T, value: StorageProps[T]) {
    const oldValue = this.getStorage(key);
    this._getStorage(key).setItem(
      this._getStorageKey(key),
      JSON.stringify(value)
    );
    if (oldValue === value) return;
    this.slots.storageUpdated.emit({ key, value });
  }
}

export function getLastPropsKey(
  modelType: BlockSuite.EdgelessModelKeys,
  modelProps: Partial<LastProps[LastPropsKey]>
): LastPropsKey | null {
  if (modelType === 'shape') {
    const { shapeType, radius } = modelProps as ShapeProps;
    const shapeName = getShapeName(shapeType, radius);
    return `${modelType}:${shapeName}`;
  }

  if (isLastPropsKey(modelType)) {
    return modelType;
  }

  return null;
}

function extractProps(
  props: Record<string, unknown>,
  ref: z.ZodObject<z.ZodRawShape>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  Object.entries(props).forEach(([key, value]) => {
    if (!(key in ref.shape)) return;
    if (isPlainObject(value)) {
      if (isColorType(key, value)) {
        const color = processColorValue(value as z.infer<typeof ColorSchema>);
        if (Object.keys(color).length === 0) return;
        result[key] = color;
        return;
      }

      result[key] = extractProps(
        props[key] as Record<string, unknown>,
        ref.shape[key] as z.ZodObject<z.ZodRawShape>
      );
    } else {
      result[key] = value;
    }
  });

  return result;
}

function isLastPropsKey(key: string): key is LastPropsKey {
  return Object.keys(LastPropsSchema.shape).includes(key);
}

function isColorType(key: string, value: unknown) {
  return (
    ['background', 'color', 'stroke', 'fill', 'Color'].some(
      stuff => key.startsWith(stuff) || key.endsWith(stuff)
    ) && ColorSchema.safeParse(value).success
  );
}

// Don't want the user to create a transparent element, so the alpha value is removed.
function processColorValue(value: z.infer<typeof ColorSchema>) {
  const obj: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    obj[k] = v.startsWith('#') ? v.substring(0, 7) : v;
  }
  return obj;
}
