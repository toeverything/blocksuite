import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@blocksuite/affine-block-surface';
import { shape as shapeRenderer } from '@blocksuite/affine-gfx-shape';
import { DefaultTheme, type EdgyNodeElementModel } from '@blocksuite/affine-model';

import { PERSON_GLYPH_PATHS, PERSON_GLYPH_VIEWBOX } from './consts';

/**
 * Renderer for an EDGY base-element node. The shape body (rounded rect / rect /
 * chevron polygon / ellipse) is drawn by REUSING the native shape renderer — so
 * stroke width, colors, inner text and theme behave exactly like a native shape.
 * Only `people` is decorated: an inscribed person glyph (the official
 * `Icon-People` paths) drawn on top in the node's (editable) stroke color.
 */
export const edgyNode: ElementRenderer<EdgyNodeElementModel> = (
  model,
  ctx,
  matrix,
  renderer,
  rc,
  bound
) => {
  const [, , w, h] = model.deserializedXYWH;
  const cx = w / 2;
  const cy = h / 2;

  // Capture the element-local transform BEFORE the shape renderer mutates the
  // matrix, so the glyph can be drawn in the same space afterwards.
  const glyphMatrix = DOMMatrix.fromMatrix(matrix)
    .translateSelf(cx, cy)
    .rotateSelf(model.rotate)
    .translateSelf(-cx, -cy);

  // Native shape (fill / stroke / inner text / theme handled natively).
  shapeRenderer(model, ctx, matrix, renderer, rc, bound);

  if (model.kind !== 'people') return;

  const color = renderer.getColorValue(
    model.strokeColor,
    DefaultTheme.shapeStrokeColor,
    true
  );

  // ── Person glyph (Icon-People), scaled to the node and centred ──────
  const target = Math.min(w, h) * 0.8;
  const s = target / PERSON_GLYPH_VIEWBOX;

  ctx.setTransform(glyphMatrix);
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-PERSON_GLYPH_VIEWBOX / 2, -PERSON_GLYPH_VIEWBOX / 2);
  ctx.fillStyle = color;
  for (const d of PERSON_GLYPH_PATHS) {
    ctx.fill(new Path2D(d));
  }
};

export const EdgyNodeRendererExtension = ElementRendererExtension(
  'edgyNode',
  edgyNode
);
