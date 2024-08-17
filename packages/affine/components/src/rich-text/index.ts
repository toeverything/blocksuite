import './inline/presets/nodes/index.js';
import './rich-text.js';
import './format/index.js';

export {
  asyncGetRichText,
  asyncSetInlineRange,
  focusTextModel,
  getInlineEditorByModel,
  getRichTextByModel,
  selectTextModel,
} from './dom.js';
export {
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
  isFormatSupported,
  textCommands,
  textFormatConfigs,
} from './format/index.js';
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
  basicAffineInlineSpecs,
  getAffineInlineSpecsWithReference,
  toggleLinkPopup,
} from './inline/index.js';
export { insertLinkedNode } from './linked-node.js';
export { markdownInput } from './markdown/index.js';
export { RichText } from './rich-text.js';
