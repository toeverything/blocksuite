import { field } from '@blocksuite/std/gfx';

import { ShapeElementModel } from '../shape/index.js';

export type WardleyNodeKind = 'component' | 'anchor';

/**
 * A Wardley map node. Extends {@link ShapeElementModel} (a native ellipse) so it
 * inherits ALL shape behaviour — editable stroke width / colors, native resize,
 * center connector anchor, the shape context toolbar — for free. `kind`
 * discriminates the plain `component` from the `anchor` (which the renderer
 * decorates with an inscribed person glyph). The text label is a SEPARATE
 * native text element grouped with the node, not stored here.
 */
export class WardleyNodeElementModel extends ShapeElementModel {
  override get type() {
    return 'wardleyNode';
  }

  /**
   * Connector anchors are restricted to the center for Wardley nodes (read by
   * the connector manager / tool). Links therefore always attach to the node
   * center and clip at the circle perimeter — the clean Wardley behaviour.
   */
  get centerAnchorOnly() {
    return true;
  }

  @field('component' as WardleyNodeKind)
  accessor kind: WardleyNodeKind = 'component';
}
