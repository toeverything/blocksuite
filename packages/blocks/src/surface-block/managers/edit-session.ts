import { Slot } from '@blocksuite/global/utils';
import { isPlainObject, recursive } from 'merge';
import { z } from 'zod';

import {
  DEFAULT_NOTE_COLOR,
  NOTE_SHADOWS,
  NoteColorsSchema,
  NoteShadowsSchema,
} from '../../_common/edgeless/note/consts.js';
import { LineWidth } from '../../_common/types.js';
import {
  GET_DEFAULT_LINE_COLOR,
  GET_DEFAULT_TEXT_COLOR,
  LineColorsSchema,
} from '../../page-block/edgeless/components/panel/color-panel.js';
import {
  CanvasTextFontFamily,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
  ShapeStyle,
  StrokeStyle,
} from '../consts.js';
import type { EdgelessElementType } from '../edgeless-types.js';
import {
  ConnectorEndpointStyle,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_REAR_END_POINT_STYLE,
} from '../elements/connector/types.js';
import { TextAlign, TextVerticalAlign } from '../elements/consts.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  FillColorsSchema,
  SHAPE_TEXT_FONT_SIZE,
  ShapeType,
  StrokeColorsSchema,
} from '../elements/shape/consts.js';
import type { SurfaceService } from '../surface-service.js';

const ConnectorEndpointSchema = z.nativeEnum(ConnectorEndpointStyle);
const StorkeStyleSchema = z.nativeEnum(StrokeStyle);
const LineWidthSchema = z.nativeEnum(LineWidth);
const ShapeStyleSchema = z.nativeEnum(ShapeStyle);
const ShapeTextFontSizeSchema = z.nativeEnum(SHAPE_TEXT_FONT_SIZE);
const CanvasTextFontFamilySchema = z.nativeEnum(CanvasTextFontFamily);
const CanvasTextFontWeightSchema = z.nativeEnum(CanvasTextFontWeight);
const CanvasTextFontStyleSchema = z.nativeEnum(CanvasTextFontStyle);
const TextAlignSchema = z.nativeEnum(TextAlign);
const TextVerticalAlignSchema = z.nativeEnum(TextVerticalAlign);
const ShapeTypeSchema = z.nativeEnum(ShapeType);

const LastPropsSchema = z.object({
  connector: z.object({
    frontEndpointStyle: ConnectorEndpointSchema,
    rearEndpointStyle: ConnectorEndpointSchema,
    strokeStyle: StorkeStyleSchema,
    stroke: LineColorsSchema,
    strokeWidth: LineWidthSchema,
    rough: z.boolean(),
    mode: z.number().optional(),
  }),
  brush: z.object({
    color: LineColorsSchema,
    lineWidth: LineWidthSchema,
  }),
  shape: z.object({
    shapeType: ShapeTypeSchema,
    fillColor: FillColorsSchema,
    strokeColor: StrokeColorsSchema,
    shapeStyle: ShapeStyleSchema,
    filled: z.boolean(),
    strokeWidth: z.number().optional(),
    strokeStyle: StorkeStyleSchema.optional(),
    color: z.string().optional(),
    fontSize: ShapeTextFontSizeSchema.optional(),
    fontFamily: CanvasTextFontFamilySchema.optional(),
    fontWeight: CanvasTextFontWeightSchema.optional(),
    fontStyle: CanvasTextFontStyleSchema.optional(),
    textAlign: TextAlignSchema.optional(),
    textHorizontalAlign: TextAlignSchema.optional(),
    textVerticalAlign: TextVerticalAlignSchema.optional(),
  }),
  text: z.object({
    color: z.string(),
    fontFamily: CanvasTextFontFamilySchema,
    textAlign: TextAlignSchema,
    fontWeight: CanvasTextFontWeightSchema,
    fontStyle: CanvasTextFontStyleSchema,
    fontSize: z.number(),
    hasMaxWidth: z.boolean(),
  }),
  'affine:note': z.object({
    background: NoteColorsSchema,
    hidden: z.boolean(),
    edgeless: z.object({
      style: z.object({
        borderRadius: z.number(),
        borderSize: z.number(),
        borderStyle: StorkeStyleSchema,
        shadowType: NoteShadowsSchema,
      }),
    }),
  }),
});

export type LastProps = z.infer<typeof LastPropsSchema>;

const SESSION_PROP_KEY = 'blocksuite:prop:record';

const SessionPropsSchema = z.object({
  viewport: z.union([
    z.object({
      centerX: z.number(),
      centerY: z.number(),
      zoom: z.number(),
    }),
    z.object({
      referenceId: z.string(),
      xywh: z.string(),
      padding: z
        .tuple([z.number(), z.number(), z.number(), z.number()])
        .optional(),
    }),
  ]),
  presentBlackBackground: z.boolean(),
  presentFillScreen: z.boolean(),
  presentHideToolbar: z.boolean(),
  templateCache: z.string(),
  remoteColor: z.string(),
});

type SessionProps = z.infer<typeof SessionPropsSchema>;

export type SerializedViewport = z.infer<
  typeof SessionPropsSchema.shape.viewport
>;

export class EditSessionStorage {
  private _lastProps: LastProps = {
    connector: {
      frontEndpointStyle: DEFAULT_FRONT_END_POINT_STYLE,
      rearEndpointStyle: DEFAULT_REAR_END_POINT_STYLE,
      stroke: GET_DEFAULT_LINE_COLOR(),
      strokeStyle: StrokeStyle.Solid,
      strokeWidth: LineWidth.LINE_WIDTH_TWO,
      rough: false,
    },
    brush: {
      color: GET_DEFAULT_LINE_COLOR(),
      lineWidth: LineWidth.Thin,
    },
    shape: {
      shapeType: ShapeType.Rect,
      fillColor: DEFAULT_SHAPE_FILL_COLOR,
      strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
      shapeStyle: ShapeStyle.General,
      filled: true,
    },
    text: {
      color: GET_DEFAULT_TEXT_COLOR(),
      fontFamily: CanvasTextFontFamily.Inter,
      textAlign: TextAlign.Left,
      fontWeight: CanvasTextFontWeight.Regular,
      fontStyle: CanvasTextFontStyle.Normal,
      fontSize: 24,
      hasMaxWidth: false,
    },
    'affine:note': {
      background: DEFAULT_NOTE_COLOR,
      hidden: false,
      edgeless: {
        style: {
          borderRadius: 8,
          borderSize: 4,
          borderStyle: StrokeStyle.Solid,
          shadowType: NOTE_SHADOWS[1],
        },
      },
    },
  };

  slots = {
    lastPropsUpdated: new Slot<{
      type: keyof LastProps;
      props: Record<string, unknown>;
    }>(),
  };

  constructor(private _service: SurfaceService) {
    const props = sessionStorage.getItem(SESSION_PROP_KEY);
    if (props) {
      this._lastProps = LastPropsSchema.parse(JSON.parse(props));
    }
  }

  getLastProps<T extends keyof LastProps>(type: T) {
    return this._lastProps[type] as LastProps[T];
  }

  record(
    type: EdgelessElementType,
    recordProps: Partial<LastProps[keyof LastProps]>
  ) {
    if (!isLastPropType(type)) return;

    const props = this._lastProps[type];
    const overrideProps = extractProps(
      recordProps,
      LastPropsSchema.shape[type]
    );
    if (Object.keys(overrideProps).length === 0) return;

    recursive(props, overrideProps);
    this.slots.lastPropsUpdated.emit({ type, props: overrideProps });
    sessionStorage.setItem(SESSION_PROP_KEY, JSON.stringify(this._lastProps));
  }

  apply(type: EdgelessElementType, props: Record<string, unknown>) {
    if (!isLastPropType(type)) return;

    const lastProps = this._lastProps[type];
    deepAssign(props, lastProps);
  }

  private _getKey<T extends keyof SessionProps>(key: T) {
    switch (key) {
      case 'viewport':
        return 'blocksuite:' + this._service.page.id + ':edgelessViewport';
      case 'presentBlackBackground':
        return 'blocksuite:presentation:blackBackground';
      case 'presentFillScreen':
        return 'blocksuite:presentation:fillScreen';
      case 'presentHideToolbar':
        return 'blocksuite:presentation:hideToolbar';
      case 'templateCache':
        return 'blocksuite:' + this._service.page.id + ':templateTool';
      case 'remoteColor':
        return 'blocksuite:remote-color';
      default:
        return '';
    }
  }

  setItem<T extends keyof SessionProps>(key: T, value: SessionProps[T]) {
    sessionStorage.setItem(this._getKey(key), JSON.stringify(value));
  }

  getItem<T extends keyof SessionProps>(key: T) {
    try {
      const value = sessionStorage.getItem(this._getKey(key));
      if (!value) return null;
      return SessionPropsSchema.shape[key].parse(
        JSON.parse(value)
      ) as SessionProps[T];
    } catch {
      return null;
    }
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

function isLastPropType(type: EdgelessElementType): type is keyof LastProps {
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
