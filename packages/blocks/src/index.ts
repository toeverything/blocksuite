/// <reference types="@blocksuite/global" />
// manual import to avoid being tree-shaken
import './root-block/index.js';
import './paragraph-block/index.js';
import './list-block/index.js';
import './note-block/index.js';
import './frame-block/index.js';
import './divider-block/index.js';
import './code-block/affine-code-line.js';
import './image-block/index.js';
import './database-block/index.js';
import './surface-ref-block/index.js';

import { mindMap } from './_common/mind-map/index.js';
import { matchFlavours, Point } from './_common/utils/index.js';
import { splitElements } from './root-block/edgeless/utils/clipboard-utils.js';
import { isCanvasElement } from './root-block/edgeless/utils/query.js';
import { deserializeXYWH } from './surface-block/index.js';

export * from './_common/adapters/index.js';
export * from './_common/components/ai-item/index.js';
export * from './_common/components/doc-mode-service.js';
export type {
  DocModeService,
  NotificationService,
  PeekViewService,
} from './_common/components/index.js';
export {
  createLitPortal,
  HoverController,
  PeekableController,
  RichText,
  scrollbarStyle,
  toast,
  Tooltip,
} from './_common/components/index.js';
export { type NavigatorMode } from './_common/edgeless/frame/consts.js';
export {
  createEmbedBlockSchema,
  defineEmbedModel,
  EmbedBlockElement,
} from './_common/embed-block-helper/index.js';
export {
  ArrowDownSmallIcon,
  CloseIcon,
  DocIcon,
  DualLinkIcon16,
  LinkedDocIcon,
  PlusIcon,
  TagsIcon,
} from './_common/icons/index.js';
export * from './_common/icons/index.js';
export * from './_common/inline/inline-manager.js';
export {
  type AffineInlineEditor,
  type AffineTextAttributes,
  getAffineInlineSpecsWithReference,
} from './_common/inline/presets/affine-inline-specs.js';
export { ReferenceNodeConfig } from './_common/inline/presets/nodes/reference-node/reference-config.js';
export { AffineReference } from './_common/inline/presets/nodes/reference-node/reference-node.js';
export { type TreeNode, type TreeNodeWithId } from './_common/mind-map/draw.js';
export * from './_common/test-utils/test-utils.js';
export {
  ColorVariables,
  FontFamilyVariables,
  SizeVariables,
  StyleVariables,
} from './_common/theme/css-variables.js';
export {
  extractCssVariables,
  ThemeObserver,
} from './_common/theme/theme-observer.js';
export * from './_common/transformers/index.js';
export {
  type AbstractEditor,
  type DocMode,
  NoteDisplayMode,
} from './_common/types.js';
export {
  createButtonPopper,
  matchFlavours,
  on,
  once,
  openFileOrFiles,
} from './_common/utils/index.js';
export { createDefaultDoc } from './_common/utils/init.js';
export {
  getThemeMode,
  isInsideEdgelessEditor,
  isInsidePageEditor,
} from './_common/utils/query.js';
export * from './attachment-block/index.js';
export * from './bookmark-block/index.js';
export * from './code-block/index.js';
export * from './data-view-block/index.js';
export {
  popTagSelect,
  type SelectTag,
} from './database-block/data-view/utils/tags/multi-tag-select.js';
export * from './database-block/index.js';
export * from './divider-block/index.js';
export * from './edgeless-text/index.js';
export * from './embed-figma-block/index.js';
export * from './embed-github-block/index.js';
export * from './embed-html-block/index.js';
export * from './embed-linked-doc-block/index.js';
export * from './embed-loom-block/index.js';
export * from './embed-synced-doc-block/index.js';
export * from './embed-youtube-block/index.js';
export * from './frame-block/index.js';
export * from './image-block/index.js';
export * from './list-block/index.js';
export * from './note-block/index.js';
export * from './paragraph-block/index.js';
export { EdgelessTemplatePanel } from './root-block/edgeless/components/toolbar/template/template-panel.js';
export type {
  Template,
  TemplateCategory,
  TemplateManager,
} from './root-block/edgeless/components/toolbar/template/template-type.js';
export { CopilotSelectionController } from './root-block/edgeless/controllers/tools/copilot-tool.js';
export * from './root-block/index.js';
export * from './schemas.js';
export * from './specs/index.js';
export {
  AffineCanvasTextFonts,
  Bound,
  BrushElementModel,
  CanvasElementType,
  CommunityCanvasTextFonts,
  ConnectorElementModel,
  ConnectorMode,
  fitContent,
  generateKeyBetween,
  getElementsBound,
  GroupElementModel,
  LayoutType,
  markdownToMindmap,
  MindmapElementModel,
  MindmapRootBlock,
  MindmapService,
  MindmapStyle,
  MindmapSurfaceBlock,
  type PointStyle,
  type SerializedXYWH,
  ShapeElementModel,
  ShapeStyle,
  StrokeStyle,
  SurfaceBlockModel,
  TextElementModel,
} from './surface-block/index.js';
export { MiniMindmapPreview } from './surface-block/mini-mindmap/mindmap-preview.js';
export { SurfaceBlockComponent } from './surface-block/surface-block.js';
export { SurfaceBlockSchema } from './surface-block/surface-model.js';
export * from './surface-block/surface-service.js';
export * from './surface-ref-block/index.js';
export const BlocksUtils = {
  splitElements,
  matchFlavours,
  mindMap,
  deserializeXYWH,
  isCanvasElement,
  Point,
};

const env: Record<string, unknown> =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : // @ts-ignore
        typeof global !== 'undefined'
        ? // @ts-ignore
          global
        : {};
const importIdentifier = '__ $BLOCKSUITE_BLOCKS$ __';

if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/blocks was already imported. This breaks constructor checks and will lead to issues!'
  );
}

if (typeof window === 'undefined') {
  throw new Error(
    'Seems like you are importing @blocksuite/blocks in SSR mode. Which is not supported for now.'
  );
}

env[importIdentifier] = true;
