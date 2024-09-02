import {
  ConnectorMode,
  DEFAULT_CONNECTOR_COLOR,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_NOTE_BACKGROUND_COLOR,
  DEFAULT_NOTE_SHADOW,
  DEFAULT_REAR_END_POINT_STYLE,
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  DEFAULT_SHAPE_TEXT_COLOR,
  DEFAULT_TEXT_COLOR,
  FillColorsSchema,
  FontFamily,
  FontStyle,
  FontWeight,
  LineColor,
  LineColorsSchema,
  LineWidth,
  NoteBackgroundColorsSchema,
  NoteDisplayMode,
  NoteShadowsSchema,
  PointStyle,
  ShapeStyle,
  ShapeTextFontSize,
  ShapeType,
  StrokeColorsSchema,
  StrokeStyle,
  TextAlign,
  TextVerticalAlign,
} from '@blocksuite/affine-model';
import { z } from 'zod';

const ConnectorEndpointSchema = z.nativeEnum(PointStyle);
const StrokeStyleSchema = z.nativeEnum(StrokeStyle);
const LineWidthSchema = z.nativeEnum(LineWidth);
const ShapeStyleSchema = z.nativeEnum(ShapeStyle);
const ShapeTextFontSizeSchema = z.nativeEnum(ShapeTextFontSize);
const FontFamilySchema = z.nativeEnum(FontFamily);
const FontWeightSchema = z.nativeEnum(FontWeight);
const FontStyleSchema = z.nativeEnum(FontStyle);
const TextAlignSchema = z.nativeEnum(TextAlign);
const TextVerticalAlignSchema = z.nativeEnum(TextVerticalAlign);
const ShapeTypeSchema = z.nativeEnum(ShapeType);
const NoteDisplayModeSchema = z.nativeEnum(NoteDisplayMode);
const ConnectorModeSchema = z.nativeEnum(ConnectorMode);

export const ColorSchema = z.union([
  z.object({
    normal: z.string(),
  }),
  z.object({
    light: z.string(),
    dark: z.string(),
  }),
]);
const LineColorSchema = z.union([LineColorsSchema, ColorSchema]);
const ShapeFillColorSchema = z.union([FillColorsSchema, ColorSchema]);
const ShapeStrokeColorSchema = z.union([StrokeColorsSchema, ColorSchema]);
const TextColorSchema = z.union([LineColorsSchema, ColorSchema]);
const NoteBackgroundColorSchema = z.union([
  NoteBackgroundColorsSchema,
  ColorSchema,
]);

export const ConnectorSchema = z
  .object({
    frontEndpointStyle: ConnectorEndpointSchema,
    rearEndpointStyle: ConnectorEndpointSchema,
    stroke: LineColorSchema,
    strokeStyle: StrokeStyleSchema,
    strokeWidth: LineWidthSchema,
    rough: z.boolean(),
    mode: ConnectorModeSchema,
  })
  .default({
    frontEndpointStyle: DEFAULT_FRONT_END_POINT_STYLE,
    rearEndpointStyle: DEFAULT_REAR_END_POINT_STYLE,
    stroke: DEFAULT_CONNECTOR_COLOR,
    strokeStyle: StrokeStyle.Solid,
    strokeWidth: LineWidth.Two,
    rough: false,
    mode: ConnectorMode.Curve,
  });

export const BrushSchema = z
  .object({
    color: LineColorSchema,
    lineWidth: LineWidthSchema,
  })
  .default({
    color: {
      dark: LineColor.White,
      light: LineColor.Black,
    },
    lineWidth: LineWidth.Four,
  });

export const ShapeSchema = z
  .object({
    color: TextColorSchema,
    shapeType: ShapeTypeSchema,
    fillColor: ShapeFillColorSchema,
    strokeColor: ShapeStrokeColorSchema,
    strokeStyle: StrokeStyleSchema,
    strokeWidth: z.number(),
    shapeStyle: ShapeStyleSchema,
    filled: z.boolean(),
    radius: z.number(),
    fontSize: ShapeTextFontSizeSchema.optional(),
    fontFamily: FontFamilySchema.optional(),
    fontWeight: FontWeightSchema.optional(),
    fontStyle: FontStyleSchema.optional(),
    textAlign: TextAlignSchema.optional(),
    textHorizontalAlign: TextAlignSchema.optional(),
    textVerticalAlign: TextVerticalAlignSchema.optional(),
    roughness: z.number().optional(),
  })
  .default({
    color: DEFAULT_SHAPE_TEXT_COLOR,
    shapeType: ShapeType.Rect,
    fillColor: DEFAULT_SHAPE_FILL_COLOR,
    strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
    strokeStyle: StrokeStyle.Solid,
    strokeWidth: LineWidth.Two,
    shapeStyle: ShapeStyle.General,
    filled: true,
    radius: 0,
  });

export const TextSchema = z
  .object({
    color: TextColorSchema,
    fontFamily: FontFamilySchema,
    textAlign: TextAlignSchema,
    fontWeight: FontWeightSchema,
    fontStyle: FontStyleSchema,
    fontSize: z.number(),
  })
  .default({
    color: DEFAULT_TEXT_COLOR,
    fontFamily: FontFamily.Inter,
    textAlign: TextAlign.Left,
    fontWeight: FontWeight.Regular,
    fontStyle: FontStyle.Normal,
    fontSize: 24,
  });

export const EdgelessTextSchema = z
  .object({
    color: TextColorSchema,
    fontFamily: FontFamilySchema,
    textAlign: TextAlignSchema,
    fontWeight: FontWeightSchema,
    fontStyle: FontStyleSchema,
  })
  .default({
    color: DEFAULT_TEXT_COLOR,
    fontFamily: FontFamily.Inter,
    textAlign: TextAlign.Left,
    fontWeight: FontWeight.Regular,
    fontStyle: FontStyle.Normal,
  });

export const NoteSchema = z
  .object({
    background: NoteBackgroundColorSchema,
    displayMode: NoteDisplayModeSchema,
    edgeless: z.object({
      style: z.object({
        borderRadius: z.number(),
        borderSize: z.number(),
        borderStyle: StrokeStyleSchema,
        shadowType: NoteShadowsSchema,
      }),
    }),
  })
  .default({
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
  });
