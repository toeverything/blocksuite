import type { EdgyNodeKind } from '@labre/affine-model';

/**
 * Visual constants for the four EDGY base-element nodes. Each node is a NATIVE
 * shape (ShapeElementModel-derived) so its stroke / fill / inner text are
 * editable via the shape toolbar; these are just the pre-formatted defaults at
 * creation.
 */
export const NODE_FILL = '#ffffff';
export const NODE_STROKE = '#262626';
export const NODE_STROKE_WIDTH = 2;

/** Outcome corner radius (absolute px — a lightly rounded rectangle). */
export const OUTCOME_RADIUS = 6;

/** Right-pointing chevron, as normalized polygon vertices (Activity). */
export const ACTIVITY_VERTICES: number[][] = [
  [0, 0],
  [0.8, 0],
  [1, 0.5],
  [0.8, 1],
  [0, 1],
];

/** Default node sizes (model units) per kind. */
export const NODE_SIZE: Record<EdgyNodeKind, { w: number; h: number }> = {
  people: { w: 64, h: 64 },
  outcome: { w: 130, h: 80 },
  object: { w: 130, h: 80 },
  activity: { w: 140, h: 80 },
};

/** Inner-text + label font (matches the diagram labels). */
export const INNER_FONT_SIZE = 20;
export const LABEL_FONT_SIZE = 18;
export const LABEL_GAP = 8;

/** Default inner text / label per kind. */
export const NODE_LABEL: Record<EdgyNodeKind, string> = {
  people: 'People',
  outcome: 'Outcome',
  object: 'Object',
  activity: 'Activity',
};

/**
 * Person glyph for `kind: 'people'`, taken from the official `Icon-People.svg`
 * (viewBox 0 0 32 32). Two filled outline rings (head + shoulders) — filling
 * them yields the line-art person. Drawn in the node stroke color, scaled to
 * the node and centred.
 */
export const PERSON_GLYPH_VIEWBOX = 32;
export const PERSON_GLYPH_PATHS = [
  'm16,19c-3.308,0-6-2.692-6-6v-4c0-3.308,2.692-6,6-6s6,2.692,6,6v4c0,3.308-2.692,6-6,6Zm0-14c-2.206,0-4,1.794-4,4v4c0,2.206,1.794,4,4,4s4-1.794,4-4v-4c0-2.206-1.794-4-4-4Z',
  'm29,30H3v-3.5c0-3.308,2.692-6,6-6h14c3.308,0,6,2.692,6,6v3.5Zm-24-2h22v-1.5c0-2.206-1.794-4-4-4h-14c-2.206,0-4,1.794-4,4v1.5Z',
];
