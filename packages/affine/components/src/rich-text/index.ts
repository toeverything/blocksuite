import './global.js';

export {
  asyncGetRichText,
  asyncSetInlineRange,
  focusTextModel,
  getInlineEditorByModel,
  getRichTextByModel,
  selectTextModel,
} from './dom.js';
export {
  clearMarksOnDiscontinuousInput,
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
  isFormatSupported,
  textCommands,
  textFormatConfigs,
} from './format/index.js';
export {
  type AffineInlineEditor,
  affineInlineMarkdownMatches,
  type AffineInlineRootElement,
  AffineLink,
  AffineReference,
  type AffineTextAttributes,
  basicAffineInlineSpecs,
  DEFAULT_DOC_NAME,
  getAffineInlineSpecsWithReference,
  InlineManager,
  type InlineMarkdownMatch,
  type InlineMarkdownMatchAction,
  type InlineSpecs,
  REFERENCE_NODE,
  ReferenceNodeConfig,
  type RefNodeSlots,
  toggleLinkPopup,
} from './inline/index.js';
export { textKeymap } from './keymap/index.js';
export { insertLinkedNode } from './linked-node.js';
export { markdownInput } from './markdown/index.js';
export { RichText } from './rich-text.js';
