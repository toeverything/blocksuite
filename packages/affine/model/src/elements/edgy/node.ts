import { field } from '@labre/std/gfx';

import { ShapeElementModel } from '../shape/index.js';

/**
 * The four EDGY "base elements". Each maps onto a native shape:
 *  - `people`   → an (invisible) ellipse decorated with an inscribed person glyph
 *  - `outcome`  → a rounded rectangle
 *  - `object`   → a plain rectangle
 *  - `activity` → a right-pointing chevron (native polygon with custom vertices)
 */
export type EdgyNodeKind = 'people' | 'outcome' | 'object' | 'activity';

/**
 * An EDGY base-element node. Extends {@link ShapeElementModel} (a native shape)
 * so it inherits ALL shape behaviour — editable stroke width / colors, inner
 * text, native resize, the shape context toolbar — for free. `kind`
 * discriminates the four base shapes; only `people` is decorated with a glyph
 * by the renderer (the other three are plain native shapes).
 */
export class EdgyNodeElementModel extends ShapeElementModel {
  override get type() {
    return 'edgyNode';
  }

  /**
   * Connector anchors are restricted to the center for EDGY nodes (read by the
   * connector manager / tool). Links therefore always attach to the node center
   * and clip at the perimeter.
   */
  get centerAnchorOnly() {
    return true;
  }

  @field('outcome' as EdgyNodeKind)
  accessor kind: EdgyNodeKind = 'outcome';
}
