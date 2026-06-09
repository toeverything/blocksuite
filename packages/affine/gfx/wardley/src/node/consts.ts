/**
 * Visual constants for Wardley nodes (component + anchor) and the connector /
 * inertia presets created from the Wardley menu.
 *
 * The node is a NATIVE ellipse (ShapeElementModel-derived) so its stroke
 * width / colors are editable via the shape toolbar; these are just the
 * pre-formatted defaults at creation. The person glyph (anchor) is expressed as
 * ratios of the circle radius R so it stays proportional at any size.
 */

/** Default node diameter (= the map label font size, 18). White fill, thin border. */
export const NODE_SIZE = 18;
export const NODE_FILL = '#ffffff';
export const NODE_STROKE = '#1f2328';
/** Thin border, matching the link / silhouette line weight. */
export const NODE_STROKE_WIDTH = 1;

/**
 * Person glyph (`kind: 'anchor'`) ratios of R, mirroring the validated icon
 * ANCH-B (circle r6 → head r1.8 at cy-2.6 ; shoulders cubic touching the
 * border at ±(4.6, 3.9) with controls at ±(3.8, 0.1)).
 */
export const ANCHOR = {
  headR: 0.3,
  headCY: -0.433,
  shoulderEndX: 0.767,
  shoulderEndY: 0.65,
  shoulderCtrlX: 0.633,
  shoulderCtrlY: 0.017,
};

/** Native text label, same family as the axis labels, size 18. */
export const LABEL_FONT_SIZE = 18;
export const LABEL_GAP = 8;
export const LABEL_DEFAULT = { component: 'Composant', anchor: 'Ancre' };

/**
 * Pipeline defaults. The body is a wide, thin native rect (≈ 1.4× the node
 * diameter tall) with a white slightly-transparent fill and a node-weight
 * border. The handle is a node-sized square straddling the top edge — the only
 * connection point (center anchor). Both reuse the WardleyNode (rect) so they
 * stay native and editable; the body is made non-connectable in the model.
 */
export const PIPELINE_HEIGHT = Math.round(NODE_SIZE * 1.4); // 25
export const PIPELINE_WIDTH = 120;
/** White ~60% opacity — fill only; the 1px border stays opaque. */
export const PIPELINE_FILL = '#ffffff99';
/** Handle square = node diameter. */
export const HANDLE_SIZE = NODE_SIZE;
export const PIPELINE_LABEL = 'Pipeline';

/**
 * Connector line width. Connectors are constrained to the LineWidth enum
 * {2,4,6,8,10,12}, so the thinnest available (2) is used — as close as possible
 * to the 1px node border.
 */
export const LINK_STROKE_WIDTH = 2;

/** Wardley red ("future"/evolution) — matches the validated arrow icon. */
export const WARDLEY_RED = '#d6455d';
/** Dependency link grey. */
export const LINK_GREY = '#666666';
/** Inertia bar color + size. */
export const INERTIA_COLOR = '#1f2328';
export const INERTIA_SIZE = { w: 8, h: 44 };
