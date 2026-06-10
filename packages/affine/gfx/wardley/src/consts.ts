/**
 * Visual constants for the Wardley map background.
 *
 * Mirrors the relevant subset of
 * `../wardley-map-renderer/src/blocks/wardley-map/wardley-map-consts.ts`
 * and the validated mockup `../wardley-mockups/C-edgeless.html`.
 *
 * IMPORTANT: every size below is in **model units and FIXED** — fonts, margins,
 * offsets and stroke widths do NOT scale with the element size. Only the plot
 * interior (axis/divider positions, band rects) scales with the element's
 * width/height. This keeps the labels readable at a constant size (18) no
 * matter how large the background is enlarged.
 */

/** Reference / fallback element width (16:9 — the height is derived). */
export const REF_WIDTH = 1600;

/** Fixed inner margins (sized to hold the fixed-size labels). */
export const MARGIN = { left: 40, right: 30, top: 30, bottom: 38 };

/** Fixed font sizes (the prominent labels are 18). */
export const FONTS = { phase: 18, axis: 18, direction: 13, visibility: 16 };

/** Fixed label offsets relative to the plot edges. */
export const OFFSETS = {
  phaseBaseline: 22, // phase labels & "Evolution" baseline below the X axis
  phasePad: 6, // gap from each zone start
  yHug: 9, // rotated Y labels gap (matches the X labels' visual gap)
  directionTop: 20, // Uncharted/Industrialized baseline below the top
  directionPadLeft: 14,
  directionPadRight: 6,
  evolutionPadRight: 16,
  visibleTop: 56, // "Visible" y below the top
  invisibleBottom: 44, // "Invisible" y above the bottom
};

/** Fixed stroke widths + decorations. */
export const LINE = { axis: 2, divider: 1.2, card: 1.5 };
export const ARROW = 11;
export const CARD_RADIUS = 10;

/** Evolution phase boundary ratios (interior dividers). */
export const EVOLUTION_BOUNDARIES = [0.175, 0.4, 0.7] as const;

/** Ordered phases: [label, startRatio]. */
export const EVOLUTION_PHASES: ReadonlyArray<readonly [string, number]> = [
  ['Genesis', 0],
  ['Custom-Built', 0.175],
  ['Product (+Rental)', 0.4],
  ['Commodity (+Utility)', 0.7],
];

export const AXIS_LABELS = {
  xAxis: 'Evolution',
  yAxis: 'Value Chain',
  evolutionStart: 'Uncharted',
  evolutionEnd: 'Industrialized',
  visibilityHigh: 'Visible',
  visibilityLow: 'Invisible',
};

/** Colors (light theme, faithful to the reference renderer / mockup C). */
export const COLORS = {
  card: '#ffffff',
  cardBorder: '#e3e2e4',
  axis: '#3b3d42',
  divider: '#9aa0a6',
  label: '#6b7280',
  band: ['#f7faff', '#eef4fb', '#e6eef8', '#dde8f4'] as const,
};

export const FONT_FAMILY = 'Inter, sans-serif';
