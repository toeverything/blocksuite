import './affine-text.js';
import './link-node/index.js';
import './reference-node/reference-node.js';
import './latex-node/latex-node.js';

export { DEFAULT_DOC_NAME, REFERENCE_NODE } from './consts.js';
export { AffineLink, toggleLinkPopup } from './link-node/index.js';
export * from './reference-node/reference-config.js';

export { AffineReference } from './reference-node/reference-node.js';
export type { RefNodeSlots } from './reference-node/types.js';
