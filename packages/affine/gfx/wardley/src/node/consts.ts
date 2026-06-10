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
export const LABEL_DEFAULT = { component: 'Component', anchor: 'Anchor' };

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

/**
 * Market node (composite): a large thin-bordered circle containing 3 small
 * thick-bordered component nodes wired into a triangle by native connectors.
 */
export const MARKET_SIZE = 30;
export const MARKET_DOT_SIZE = 8;
/** Radius of the circle on which the 3 inner node centers sit. */
export const MARKET_DOT_RING = 8;
/** Inner nodes have a thicker border than the outer circle. */
export const MARKET_DOT_STROKE_WIDTH = 2;
/** Triangle connectors: thin + dark, no arrows. */
export const MARKET_LINK_WIDTH = 1;
export const MARKET_LINK_COLOR = NODE_STROKE;
export const MARKET_LABEL = 'Market';

/**
 * Ecosystem node: a single connectable circle drawn as a GLYPH — a double border
 * at the rim (outer circle + a 2nd inscribed circle with a thin blank band
 * between them) and diagonal hatching confined to the inner donut (from the 2nd
 * border down to a hollow central circle; the hatch never reaches the outer
 * border). Ratios are of R so the glyph scales with the circle.
 */
export const ECOSYSTEM_SIZE = 40;
export const ECOSYSTEM = {
  secondBorderRatio: 0.88, // 2nd (inscribed) border
  centerRatio: 0.43, // central hollow circle
  hatchOuterRatio: 0.86, // hatch stays just inside the 2nd border
  hatchSpacingRatio: 0.15, // gap between hatch lines
};
export const ECOSYSTEM_LABEL = 'Ecosystem';

/**
 * Method node: a component inscribed in a slightly larger outer circle whose
 * FILL color encodes the chosen method (editable via the toolbar). Glyph = the
 * outer circle (colored fill + border, the base ellipse) + a white component
 * circle drawn at its center. Default fill is a neutral grey.
 */
export const METHOD_SIZE = 35;
export const METHOD_FILL = '#d9d9d9';
export const METHOD = {
  centerRatio: 0.5, // inner white component radius / R
};
export const METHOD_LABEL = 'Component';
