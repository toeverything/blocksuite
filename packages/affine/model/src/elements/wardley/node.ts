import { field } from '@labre/std/gfx';

import { ShapeElementModel } from '../shape/index.js';

export type WardleyNodeKind =
  | 'component'
  | 'anchor'
  | 'pipeline'
  | 'handle'
  | 'market'
  | 'ecosystem'
  | 'method';

/**
 * A Wardley map node. Extends {@link ShapeElementModel} (a native ellipse) so it
 * inherits ALL shape behaviour — editable stroke width / colors, native resize,
 * center connector anchor, the shape context toolbar — for free. `kind`
 * discriminates the plain `component`, the `anchor` (which the renderer
 * decorates with an inscribed person glyph), the two pieces of a pipeline (the
 * `pipeline` body + its square `handle`), the `market` outer circle, and the
 * `ecosystem` grey backing disk. Composite nodes (pipeline / market / ecosystem)
 * are built by grouping several of these + native connectors + a text label. The
 * text label is a SEPARATE native text element grouped with the node, not stored
 * here.
 */
export class WardleyNodeElementModel extends ShapeElementModel {
  override get type() {
    return 'wardleyNode';
  }

  /**
   * Connector anchors are restricted to the center for Wardley nodes (read by
   * the connector manager / tool). Links therefore always attach to the node
   * center and clip at the perimeter — the clean Wardley behaviour.
   */
  get centerAnchorOnly() {
    return true;
  }

  /**
   * The pipeline body offers NO connector anchors (a pipeline is connected only
   * through its handle). All other kinds — including the ecosystem (a single
   * glyph circle) and the market outer circle — keep the native connectable
   * behaviour with center-only anchoring via {@link centerAnchorOnly}.
   */
  override get connectable() {
    return this.kind !== 'pipeline';
  }

  @field('component' as WardleyNodeKind)
  accessor kind: WardleyNodeKind = 'component';
}
