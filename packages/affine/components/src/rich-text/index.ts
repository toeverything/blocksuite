import './inline/presets/nodes/index.js';
import './rich-text.js';

export {
  type AffineInlineEditor,
  type AffineInlineRootElement,
  AffineLink,
  AffineReference,
  type AffineTextAttributes,
  DEFAULT_DOC_NAME,
  InlineManager,
  type InlineMarkdownMatch,
  type InlineMarkdownMatchAction,
  type InlineSpecs,
  REFERENCE_NODE,
  type RefNodeSlots,
  ReferenceNodeConfig,
  affineInlineMarkdownMatches,
  affineInlineSpecsWithoutReference,
  getAffineInlineSpecsWithReference,
  toggleLinkPopup,
} from './inline/index.js';
export { RichText } from './rich-text.js';
