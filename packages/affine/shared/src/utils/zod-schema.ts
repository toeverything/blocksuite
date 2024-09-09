import {
  ConnectorMode,
  DEFAULT_CONNECTOR_COLOR,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_NOTE_BACKGROUND_COLOR,
  DEFAULT_NOTE_BORDER_SIZE,
  DEFAULT_NOTE_BORDER_STYLE,
  DEFAULT_NOTE_CORNER,
  DEFAULT_NOTE_SHADOW,
  DEFAULT_REAR_END_POINT_STYLE,
  DEFAULT_ROUGHNESS,
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  DEFAULT_SHAPE_TEXT_COLOR,
  DEFAULT_TEXT_COLOR,
  FillColorsSchema,
  FontFamily,
  FontStyle,
  FontWeight,
  LayoutType,
  LineColor,
  LineColorsSchema,
  LineWidth,
  MindmapStyle,
  NoteBackgroundColorsSchema,
  NoteDisplayMode,
  NoteShadowsSchema,
  PointStyle,
  ShapeStyle,
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
const FontFamilySchema = z.nativeEnum(FontFamily);
const FontWeightSchema = z.nativeEnum(FontWeight);
const FontStyleSchema = z.nativeEnum(FontStyle);
const TextAlignSchema = z.nativeEnum(TextAlign);
const TextVerticalAlignSchema = z.nativeEnum(TextVerticalAlign);
const NoteDisplayModeSchema = z.nativeEnum(NoteDisplayMode);
const ConnectorModeSchema = z.nativeEnum(ConnectorMode);
const LayoutTypeSchema = z.nativeEnum(LayoutType);
const MindmapStyleSchema = z.nativeEnum(MindmapStyle);

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

const DEFAULT_SHAPE = {
  color: DEFAULT_SHAPE_TEXT_COLOR,
  fillColor: DEFAULT_SHAPE_FILL_COLOR,
  strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
  strokeStyle: StrokeStyle.Solid,
  strokeWidth: LineWidth.Two,
  shapeStyle: ShapeStyle.General,
  filled: true,
  radius: 0,
  fontSize: 20,
  fontFamily: FontFamily.Inter,
  fontWeight: FontWeight.Regular,
  fontStyle: FontStyle.Normal,
  textAlign: TextAlign.Center,
  roughness: DEFAULT_ROUGHNESS,
};

const ShapeObject = {
  color: TextColorSchema,
  fillColor: ShapeFillColorSchema,
  strokeColor: ShapeStrokeColorSchema,
  strokeStyle: StrokeStyleSchema,
  strokeWidth: z.number(),
  shapeStyle: ShapeStyleSchema,
  filled: z.boolean(),
  radius: z.number(),
  fontSize: z.number(),
  fontFamily: FontFamilySchema,
  fontWeight: FontWeightSchema,
  fontStyle: FontStyleSchema,
  textAlign: TextAlignSchema,
  textHorizontalAlign: TextAlignSchema.optional(),
  textVerticalAlign: TextVerticalAlignSchema.optional(),
  roughness: z.number(),
};

export const ShapeSchema = z.object(ShapeObject).default(DEFAULT_SHAPE);

export const RoundedShapeSchema = z
  .object(ShapeObject)
  .default({ ...DEFAULT_SHAPE, radius: 0.1 });

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
    displayMode: NoteDisplayMode.EdgelessOnly,
    edgeless: {
      style: {
        borderRadius: DEFAULT_NOTE_CORNER,
        borderSize: DEFAULT_NOTE_BORDER_SIZE,
        borderStyle: DEFAULT_NOTE_BORDER_STYLE,
        shadowType: DEFAULT_NOTE_SHADOW,
      },
    },
  });

export const MindmapSchema = z
  .object({
    layoutType: LayoutTypeSchema,
    style: MindmapStyleSchema,
  })
  .default({
    layoutType: LayoutType.RIGHT,
    style: MindmapStyle.ONE,
  });

export const NodePropsSchema = z.object({
  connector: ConnectorSchema,
  brush: BrushSchema,
  text: TextSchema,
  mindmap: MindmapSchema,
  'affine:edgeless-text': EdgelessTextSchema,
  'affine:note': NoteSchema,
  // shapes
  'shape:diamond': ShapeSchema,
  'shape:ellipse': ShapeSchema,
  'shape:rect': ShapeSchema,
  'shape:triangle': ShapeSchema,
  'shape:roundedRect': RoundedShapeSchema,
});

export type NodeProps = z.infer<typeof NodePropsSchema>;
