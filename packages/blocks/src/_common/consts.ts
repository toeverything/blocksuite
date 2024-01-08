import type { LinkCardStyle } from './types.js';

export const BLOCK_ID_ATTR = 'data-block-id';

export const NOTE_WIDTH = 800;
export const BLOCK_CHILDREN_CONTAINER_PADDING_LEFT = 26;
export const EDGELESS_BLOCK_CHILD_PADDING = 24;
export const EDGELESS_BLOCK_CHILD_BORDER_WIDTH = 2;

// The height of the header, which is used to calculate the scroll offset
// In AFFiNE, to avoid the option element to be covered by the header, we need to reserve the space for the header
export const PAGE_HEADER_HEIGHT = 53;

export const LINK_CARD_WIDTH: Record<LinkCardStyle, number> = {
  horizontal: 752,
  list: 752,
  vertical: 364,
  cube: 170,
  video: 686,
};

export const LINK_CARD_HEIGHT: Record<LinkCardStyle, number> = {
  horizontal: 116,
  list: 46,
  vertical: 390,
  cube: 114,
  video: 463,
};
