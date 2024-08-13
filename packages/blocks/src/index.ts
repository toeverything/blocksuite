/// <reference types="@blocksuite/global" />
import '@blocksuite/affine-components/toolbar';
import '@blocksuite/affine-components/rich-text';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { deserializeXYWH } from '@blocksuite/global/utils';
import { Point } from '@blocksuite/global/utils';

import { mindMap } from './_common/mind-map/index.js';
import { matchFlavours } from './_common/utils/index.js';
import './code-block/highlight/affine-code-unit.js';
import './database-block/index.js';
import './divider-block/index.js';
import './frame-block/index.js';
import './image-block/index.js';
import './list-block/index.js';
import './note-block/index.js';
import './paragraph-block/index.js';
import { splitElements } from './root-block/edgeless/utils/clipboard-utils.js';
import { isCanvasElement } from './root-block/edgeless/utils/query.js';
// manual import to avoid being tree-shaken
import './root-block/index.js';
import './surface-ref-block/index.js';

export * from './_common/adapters/index.js';
export * from './_common/components/ai-item/index.js';
export * from './_common/components/doc-mode-service.js';
export type {
  DocModeService,
  NotificationService,
} from './_common/components/index.js';
export { scrollbarStyle } from './_common/components/index.js';
export { type NavigatorMode } from './_common/edgeless/frame/consts.js';
export { EmbedBlockComponent } from './_common/embed-block-helper/index.js';
export { type TreeNode, type TreeNodeWithId } from './_common/mind-map/draw.js';
export * from './_common/test-utils/test-utils.js';
export * from './_common/transformers/index.js';
export { type AbstractEditor, type DocMode } from './_common/types.js';
export {
  createButtonPopper,
  matchFlavours,
  on,
  once,
  openFileOrFiles,
} from './_common/utils/index.js';
export { createDefaultDoc } from './_common/utils/init.js';
export {
  isInsideEdgelessEditor,
  isInsidePageEditor,
} from './_common/utils/query.js';
export * from './attachment-block/index.js';
export * from './bookmark-block/index.js';
export * from './code-block/index.js';
export * from './data-view-block/index.js';
export {
  type SelectTag,
  popTagSelect,
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
  BrushElementModel,
  CanvasElementType,
  CommunityCanvasTextFonts,
  ConnectorElementModel,
  ConnectorMode,
  GroupElementModel,
  LayoutType,
  MindmapElementModel,
  MindmapRootBlock,
  MindmapService,
  MindmapStyle,
  MindmapSurfaceBlock,
  type PointStyle,
  ShapeElementModel,
  ShapeStyle,
  SurfaceBlockModel,
  TextElementModel,
  fitContent,
  generateKeyBetween,
  markdownToMindmap,
} from './surface-block/index.js';
export { MiniMindmapPreview } from './surface-block/mini-mindmap/mindmap-preview.js';
export { SurfaceBlockComponent } from './surface-block/surface-block.js';
export { SurfaceBlockSchema } from './surface-block/surface-model.js';
export * from './surface-block/surface-service.js';
export * from './surface-ref-block/index.js';
export {
  HoverController,
  whenHover,
} from '@blocksuite/affine-components/hover';
export {
  ArrowDownSmallIcon,
  CloseIcon,
  DocIcon,
  DualLinkIcon16,
  LinkedDocIcon,
  PlusIcon,
  TagsIcon,
} from '@blocksuite/affine-components/icons';
export * from '@blocksuite/affine-components/icons';
export {
  type PeekViewService,
  Peekable,
  PeekableController,
  isPeekable,
  peek,
} from '@blocksuite/affine-components/peek';
export {
  createLitPortal,
  createSimplePortal,
} from '@blocksuite/affine-components/portal';
export {
  type AffineInlineEditor,
  AffineReference,
  type AffineTextAttributes,
  InlineManager,
  type InlineMarkdownMatch,
  type InlineSpecs,
  ReferenceNodeConfig,
  RichText,
  getAffineInlineSpecsWithReference,
} from '@blocksuite/affine-components/rich-text';
export { toast } from '@blocksuite/affine-components/toast';
export {
  type Action,
  type FatActions,
  Tooltip,
  renderActions,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
export * from '@blocksuite/affine-model';
export {
  ColorVariables,
  FontFamilyVariables,
  SizeVariables,
  StyleVariables,
  ThemeObserver,
} from '@blocksuite/affine-shared/theme';
export const BlocksUtils = {
  splitElements,
  matchFlavours,
  mindMap,
  deserializeXYWH,
  isCanvasElement,
  Point,
};
export { findNoteBlockModel } from '@blocksuite/affine-shared/utils';

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
  throw new BlockSuiteError(
    ErrorCode.NoneSupportedSSRError,
    'Seems like you are importing @blocksuite/blocks in SSR mode. Which is not supported for now.'
  );
}

env[importIdentifier] = true;
