export {
  InlineManager,
  type InlineMarkdownMatch,
  type InlineMarkdownMatchAction,
  type InlineSpecs,
} from './inline-manager.js';
export {
  type AffineInlineEditor,
  type AffineInlineRootElement,
  type AffineTextAttributes,
  affineInlineSpecsWithoutReference,
  getAffineInlineSpecsWithReference,
} from './presets/affine-inline-specs.js';
export { affineInlineMarkdownMatches } from './presets/markdown.js';
export {
  AffineLink,
  AffineReference,
  DEFAULT_DOC_NAME,
  REFERENCE_NODE,
  type RefNodeSlots,
  ReferenceNodeConfig,
  toggleLinkPopup,
} from './presets/nodes/index.js';
