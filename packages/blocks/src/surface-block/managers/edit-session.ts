import type { BlockService } from '@blocksuite/block-std';

import {
  BrushSchema,
  ColorSchema,
  ConnectorSchema,
  EdgelessTextSchema,
  NoteSchema,
  ShapeSchema,
  TextSchema,
} from '@blocksuite/affine-shared/utils';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import { isPlainObject, merge } from 'merge';
import { z } from 'zod';

const LastPropsSchema = z.object({
  connector: ConnectorSchema,
  brush: BrushSchema,
  shape: ShapeSchema,
  text: TextSchema,
  'affine:edgeless-text': EdgelessTextSchema,
  'affine:note': NoteSchema,
});

export type LastProps = z.infer<typeof LastPropsSchema>;
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

  private _lastProps: LastProps = LastPropsSchema.parse(
    Object.entries(LastPropsSchema.shape).reduce((value, [key, schema]) => {
      return {
        ...value,
        [key]: schema.parse(undefined),
      };
    }, {})
  );

  slots = {
    lastPropsUpdated: new Slot<{
      type: LastPropsKey;
      props: Record<string, unknown>;
    }>(),
    storageUpdated: new Slot<{
      key: StoragePropsKey;
      value: StorageProps[StoragePropsKey];
    }>(),
  };

  constructor(private _service: BlockService) {
    const props = sessionStorage.getItem(SESSION_PROP_KEY);
    if (props) {
      const result = LastPropsSchema.safeParse(JSON.parse(props));
      if (result.success) {
        this._lastProps = result.data;
      }
    }
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

  applyLastProps(
    type: BlockSuite.EdgelessModelKeys,
    props: Record<string, unknown>
  ) {
    if (!isLastPropType(type)) return;

    const lastProps = this._lastProps[type];
    deepAssign(props, lastProps);
  }

  dispose() {
    this._disposables.dispose();
    this.slots.lastPropsUpdated.dispose();
  }

  getLastProps<T extends LastPropsKey>(type: T) {
    return this._lastProps[type] as LastProps[T];
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

  recordLastProps(
    type: BlockSuite.EdgelessModelKeys,
    recordProps: Partial<LastProps[LastPropsKey]>
  ) {
    if (!isLastPropType(type)) return;

    const props = this._lastProps[type];
    const overrideProps = extractProps(
      recordProps,
      LastPropsSchema.shape[type]._def.innerType
    );
    if (Object.keys(overrideProps).length === 0) return;

    merge(props, overrideProps);
    this.slots.lastPropsUpdated.emit({ type, props: overrideProps });
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

function isLastPropType(
  type: BlockSuite.EdgelessModelKeys
): type is keyof LastProps {
  return Object.keys(LastPropsSchema.shape).includes(type);
}

function deepAssign(
  target: Record<string, unknown>,
  source: Record<string, unknown>
) {
  Object.keys(source).forEach(key => {
    if (source[key] === undefined) return;
    if (!(key in target)) target[key] = undefined;
    if (target[key] !== undefined) return;

    if (isPlainObject(source[key])) {
      target[key] = target[key] ?? {};
      deepAssign(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else {
      target[key] = source[key];
    }
  });

  return target;
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
