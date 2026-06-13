import { field } from '@labre/std/gfx';

import { ShapeElementModel } from '../shape/index.js';

/**
 * The BPMN flow-object nodes shipped in v1. Each maps onto a native shape:
 *  - `startEvent` / `endEvent` → an ellipse (thin green / thick red ring)
 *  - `task`                    → a rounded rectangle with editable inner text
 *  - `gatewayExclusive`        → a diamond decorated with an X glyph
 */
export type BpmnNodeKind =
  | 'startEvent'
  | 'endEvent'
  | 'task'
  | 'gatewayExclusive';

/**
 * A BPMN flow-object node. Extends {@link ShapeElementModel} (a native shape)
 * so it inherits ALL shape behaviour — editable stroke width / colors, inner
 * text, native resize, the shape context toolbar — for free. `kind`
 * discriminates the four basics; only `gatewayExclusive` is decorated with a
 * glyph (the X) by the renderer (the others are plain native shapes).
 *
 * Mirrors {@link EdgyNodeElementModel}.
 */
export class BpmnNodeElementModel extends ShapeElementModel {
  override get type() {
    return 'bpmnNode';
  }

  /**
   * Connector anchors are restricted to the center for BPMN nodes (read by the
   * connector manager / tool), so sequence flows attach to the node center and
   * clip at the perimeter.
   */
  get centerAnchorOnly() {
    return true;
  }

  @field('task' as BpmnNodeKind)
  accessor kind: BpmnNodeKind = 'task';
}
