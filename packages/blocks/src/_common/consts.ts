import type { EmbedCardStyle } from './types.js';

export const BLOCK_ID_ATTR = 'data-block-id';

export const NOTE_WIDTH = 800;
export const BLOCK_CHILDREN_CONTAINER_PADDING_LEFT = 26;
export const EDGELESS_BLOCK_CHILD_PADDING = 24;
export const EDGELESS_BLOCK_CHILD_BORDER_WIDTH = 2;

// The height of the header, which is used to calculate the scroll offset
// In AFFiNE, to avoid the option element to be covered by the header, we need to reserve the space for the header
export const PAGE_HEADER_HEIGHT = 53;

export const EMBED_CARD_WIDTH: Record<EmbedCardStyle, number> = {
  horizontal: 752,
  horizontalThin: 752,
  list: 752,
  vertical: 364,
  cube: 170,
  cubeThick: 170,
  video: 752,
  figma: 752,
  html: 752,
  syncedDoc: 752,
};

export const EMBED_CARD_HEIGHT: Record<EmbedCardStyle, number> = {
  horizontal: 116,
  horizontalThin: 80,
  list: 46,
  vertical: 390,
  cube: 114,
  cubeThick: 132,
  video: 544,
  figma: 544,
  html: 544,
  syncedDoc: 455,
};

export const EMBED_BLOCK_FLAVOUR_LIST = [
  'affine:embed-github',
  'affine:embed-youtube',
  'affine:embed-figma',
  'affine:embed-linked-doc',
  'affine:embed-synced-doc',
  'affine:embed-html',
  'affine:embed-loom',
] as const;

export const DEFAULT_IMAGE_PROXY_ENDPOINT =
  'https://affine-worker.toeverything.workers.dev/api/worker/image-proxy';

// https://github.com/toeverything/affine-workers/tree/main/packages/link-preview
export const DEFAULT_LINK_PREVIEW_ENDPOINT =
  'https://affine-worker.toeverything.workers.dev/api/worker/link-preview';

// This constant is used to ignore tags when exporting using html2canvas
export const CANVAS_EXPROT_IGNORE_TAGS = [
  'AFFINE-BLOCK-HUB',
  'EDGELESS-TOOLBAR',
  'AFFINE-DRAG-HANDLE-WIDGET',
  'AFFINE-FORMAT-BAR-WIDGET',
  'AFFINE-BLOCK-SELECTION',
];
