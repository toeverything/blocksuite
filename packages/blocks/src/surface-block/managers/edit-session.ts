import type { BlockService } from '@blocksuite/block-std';

import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import { isPlainObject, recursive } from 'merge';
import { z } from 'zod';

import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  DEFAULT_NOTE_SHADOW,
  NoteBackgroundColorsSchema,
  NoteShadowsSchema,
} from '../../_common/edgeless/note/consts.js';
import { LineWidth, NoteDisplayMode } from '../../_common/types.js';
import {
  DEFAULT_CONNECTOR_COLOR,
  GET_DEFAULT_LINE_COLOR,
  GET_DEFAULT_TEXT_COLOR,
  LineColorsSchema,
} from '../../root-block/edgeless/components/panel/color-panel.js';
import {
  FontFamily,
  FontStyle,
  FontWeight,
  ShapeStyle,
  StrokeStyle,
  TextAlign,
  TextVerticalAlign,
} from '../consts.js';
import {
  ConnectorMode,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_REAR_END_POINT_STYLE,
} from '../element-model/connector.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  DEFAULT_SHAPE_TEXT_COLOR,
  FillColorsSchema,
  SHAPE_TEXT_FONT_SIZE,
  ShapeType,
  StrokeColorsSchema,
} from '../elements/shape/consts.js';

const ConnectorEndpointSchema = z.enum([
  'None',
  'Arrow',
  'Triangle',
  'Circle',
  'Diamond',
]);
const StrokeStyleSchema = z.nativeEnum(StrokeStyle);
const LineWidthSchema = z.nativeEnum(LineWidth);
const ShapeStyleSchema = z.nativeEnum(ShapeStyle);
const ShapeTextFontSizeSchema = z.nativeEnum(SHAPE_TEXT_FONT_SIZE);
const FontFamilySchema = z.nativeEnum(FontFamily);
const FontWeightSchema = z.nativeEnum(FontWeight);
const FontStyleSchema = z.nativeEnum(FontStyle);
const TextAlignSchema = z.nativeEnum(TextAlign);
const TextVerticalAlignSchema = z.nativeEnum(TextVerticalAlign);
const ShapeTypeSchema = z.nativeEnum(ShapeType);
const NoteDisplayModeSchema = z.nativeEnum(NoteDisplayMode);

const LastPropsSchema = z.object({
  'affine:edgeless-text': z.object({
    color: z.string(),
    fontFamily: FontFamilySchema,
    fontStyle: FontStyleSchema,
    fontWeight: FontWeightSchema,
    textAlign: TextAlignSchema,
  }),
  'affine:note': z.object({
    background: NoteBackgroundColorsSchema,
    displayMode: NoteDisplayModeSchema.optional(),
    edgeless: z.object({
      style: z.object({
        borderRadius: z.number(),
        borderSize: z.number(),
        borderStyle: StrokeStyleSchema,
        shadowType: NoteShadowsSchema,
      }),
    }),
  }),
  brush: z.object({
    color: LineColorsSchema,
    lineWidth: LineWidthSchema,
  }),
  connector: z.object({
    frontEndpointStyle: ConnectorEndpointSchema,
    mode: z.number().optional(),
    rearEndpointStyle: ConnectorEndpointSchema,
    rough: z.boolean(),
    stroke: LineColorsSchema,
    strokeStyle: StrokeStyleSchema,
    strokeWidth: LineWidthSchema,
  }),
  shape: z.object({
    color: z.string().optional(),
    fillColor: FillColorsSchema,
    filled: z.boolean(),
    fontFamily: FontFamilySchema.optional(),
    fontSize: ShapeTextFontSizeSchema.optional(),
    fontStyle: FontStyleSchema.optional(),
    fontWeight: FontWeightSchema.optional(),
    radius: z.number(),
    roughness: z.number().optional(),
    shapeStyle: ShapeStyleSchema,
    shapeType: ShapeTypeSchema,
    strokeColor: StrokeColorsSchema,
    strokeStyle: StrokeStyleSchema.optional(),
    strokeWidth: z.number().optional(),
    textAlign: TextAlignSchema.optional(),
    textHorizontalAlign: TextAlignSchema.optional(),
    textVerticalAlign: TextVerticalAlignSchema.optional(),
  }),
  text: z.object({
    color: z.string(),
    fontFamily: FontFamilySchema,
    fontSize: z.number(),
    fontStyle: FontStyleSchema,
    fontWeight: FontWeightSchema,
    textAlign: TextAlignSchema,
  }),
});

export type LastProps = z.infer<typeof LastPropsSchema>;
export type LastPropsKey = keyof LastProps;

const SESSION_PROP_KEY = 'blocksuite:prop:record';

const SessionPropsSchema = z.object({
  remoteColor: z.string(),
  showBidirectional: z.boolean(),
  templateCache: z.string(),
  viewport: z.union([
    z.object({
      centerX: z.number(),
      centerY: z.number(),
      zoom: z.number(),
    }),
    z.object({
      padding: z
        .tuple([z.number(), z.number(), z.number(), z.number()])
        .optional(),
      xywh: z.string(),
    }),
  ]),
});

const LocalPropsSchema = z.object({
  autoHideEmbedHTMLFullScreenToolbar: z.boolean(),
  presentBlackBackground: z.boolean(),
  presentFillScreen: z.boolean(),

  presentHideToolbar: z.boolean(),
});

type SessionProps = z.infer<typeof SessionPropsSchema>;
type LocalProps = z.infer<typeof LocalPropsSchema>;
type StorageProps = LocalProps & SessionProps;
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

  private _lastProps: LastProps = {
    'affine:edgeless-text': {
      color: GET_DEFAULT_TEXT_COLOR(),
      fontFamily: FontFamily.Inter,
      fontStyle: FontStyle.Normal,
      fontWeight: FontWeight.Regular,
      textAlign: TextAlign.Left,
    },
    'affine:note': {
      background: DEFAULT_NOTE_BACKGROUND_COLOR,
      displayMode: NoteDisplayMode.DocAndEdgeless,
      edgeless: {
        style: {
          borderRadius: 0,
          borderSize: 4,
          borderStyle: StrokeStyle.None,
          shadowType: DEFAULT_NOTE_SHADOW,
        },
      },
    },
    brush: {
      color: GET_DEFAULT_LINE_COLOR(),
      lineWidth: LineWidth.Four,
    },
    connector: {
      frontEndpointStyle: DEFAULT_FRONT_END_POINT_STYLE,
      mode: ConnectorMode.Curve,
      rearEndpointStyle: DEFAULT_REAR_END_POINT_STYLE,
      rough: false,
      stroke: DEFAULT_CONNECTOR_COLOR,
      strokeStyle: StrokeStyle.Solid,
      strokeWidth: LineWidth.Two,
    },
    shape: {
      color: DEFAULT_SHAPE_TEXT_COLOR,
      fillColor: DEFAULT_SHAPE_FILL_COLOR,
      filled: true,
      radius: 0,
      shapeStyle: ShapeStyle.General,
      shapeType: ShapeType.Rect,
      strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
      strokeStyle: StrokeStyle.Solid,
      strokeWidth: LineWidth.Two,
    },
    text: {
      color: GET_DEFAULT_TEXT_COLOR(),
      fontFamily: FontFamily.Inter,
      fontSize: 24,
      fontStyle: FontStyle.Normal,
      fontWeight: FontWeight.Regular,
      textAlign: TextAlign.Left,
    },
  };

  slots = {
    lastPropsUpdated: new Slot<{
      props: Record<string, unknown>;
      type: LastPropsKey;
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
    type: BlockSuite.EdgelessModelKeyType,
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
    type: BlockSuite.EdgelessModelKeyType,
    recordProps: Partial<LastProps[LastPropsKey]>
  ) {
    if (!isLastPropType(type)) return;

    const props = this._lastProps[type];
    const overrideProps = extractProps(
      recordProps,
      LastPropsSchema.shape[type]
    );
    if (Object.keys(overrideProps).length === 0) return;

    recursive(props, overrideProps);
    this.slots.lastPropsUpdated.emit({ props: overrideProps, type });
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
  type: BlockSuite.EdgelessModelKeyType
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
