import type { AttachmentBlockComponent } from '@blocksuite/affine-block-attachment';
import type { BookmarkBlockComponent } from '@blocksuite/affine-block-bookmark';
import {
  type EmbedFigmaBlockComponent,
  type EmbedGithubBlockComponent,
  type EmbedLoomBlockComponent,
  type EmbedYoutubeBlockComponent,
  notifyDocCreated,
  promptDocTitle,
} from '@blocksuite/affine-block-embed';
import type { ImageBlockComponent } from '@blocksuite/affine-block-image';
import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import { isPeekable, peek } from '@blocksuite/affine-components/peek';
import type { MenuItemGroup } from '@blocksuite/affine-components/toolbar';
import {
  OpenDocExtensionIdentifier,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { Bound, getCommonBoundWithRotation } from '@blocksuite/global/gfx';
import {
  ArrowDownBigBottomIcon,
  ArrowDownBigIcon,
  ArrowUpBigIcon,
  ArrowUpBigTopIcon,
  CenterPeekIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  ExpandFullIcon,
  FrameIcon,
  GroupIcon,
  LinkedPageIcon,
  OpenInNewIcon,
  ResetIcon,
  SplitViewIcon,
} from '@blocksuite/icons/lit';

import { duplicate } from '../../../edgeless/utils/clipboard-utils.js';
import { getSortedCloneElements } from '../../../edgeless/utils/clone-utils.js';
import { moveConnectors } from '../../../edgeless/utils/connector.js';
import { deleteElements } from '../../../edgeless/utils/crud.js';
import type { ElementToolbarMoreMenuContext } from './context.js';
import {
  createLinkedDocFromEdgelessElements,
  createLinkedDocFromNote,
} from './render-linked-doc.js';

type EmbedLinkBlockComponent =
  | EmbedGithubBlockComponent
  | EmbedFigmaBlockComponent
  | EmbedLoomBlockComponent
  | EmbedYoutubeBlockComponent;

type RefreshableBlockComponent =
  | EmbedLinkBlockComponent
  | ImageBlockComponent
  | AttachmentBlockComponent
  | BookmarkBlockComponent;

// Section Group: frame & group
export const sectionGroup: MenuItemGroup<ElementToolbarMoreMenuContext> = {
  type: 'section',
  items: [
    {
      icon: FrameIcon({ width: '20', height: '20' }),
      label: 'Frame section',
      type: 'create-frame',
      action: ({ service, edgeless, std }) => {
        const frame = service.frame.createFrameOnSelected();
        if (!frame) return;

        std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
          control: 'context-menu',
          page: 'whiteboard editor',
          module: 'toolbar',
          segment: 'toolbar',
          type: 'frame',
        });

        edgeless.surface.fitToViewport(Bound.deserialize(frame.xywh));
      },
    },
    {
      icon: GroupIcon({ width: '20', height: '20' }),
      label: 'Group section',
      type: 'create-group',
      action: ({ service }) => {
        service.createGroupFromSelected();
      },
      when: ctx => !ctx.hasFrame(),
    },
  ],
};

// Reorder Group
export const reorderGroup: MenuItemGroup<ElementToolbarMoreMenuContext> = {
  type: 'reorder',
  items: [
    {
      icon: ArrowUpBigTopIcon({ width: '20', height: '20' }),
      label: 'Bring to Front',
      type: 'front',
      action: ({ service, selectedElements }) => {
        selectedElements.forEach(el => {
          service.reorderElement(el, 'front');
        });
      },
    },
    {
      icon: ArrowUpBigIcon({ width: '20', height: '20' }),
      label: 'Bring Forward',
      type: 'forward',
      action: ({ service, selectedElements }) => {
        selectedElements.forEach(el => {
          service.reorderElement(el, 'forward');
        });
      },
    },
    {
      icon: ArrowDownBigIcon({ width: '20', height: '20' }),
      label: 'Send Backward',
      type: 'backward',
      action: ({ service, selectedElements }) => {
        selectedElements.forEach(el => {
          service.reorderElement(el, 'backward');
        });
      },
    },
    {
      icon: ArrowDownBigBottomIcon({ width: '20', height: '20' }),
      label: 'Send to Back',
      type: 'back',
      action: ({ service, selectedElements }) => {
        selectedElements.forEach(el => {
          service.reorderElement(el, 'back');
        });
      },
    },
  ],
};

// Open Group
// TODO: construct this group dynamically
export const openGroup: MenuItemGroup<ElementToolbarMoreMenuContext> = {
  type: 'open',
  items: [
    {
      icon: ExpandFullIcon({ width: '20', height: '20' }),
      label: 'Open this doc',
      type: 'open',
      generate: ctx => {
        const linkedDocBlock = ctx.getLinkedDocBlock();

        if (!linkedDocBlock) return;

        const disabled = linkedDocBlock.props.pageId === ctx.doc.id;

        return {
          action: () => {
            const blockComponent = ctx.firstBlockComponent;

            if (!blockComponent) return;
            if (!('open' in blockComponent)) return;
            if (typeof blockComponent.open !== 'function') return;

            blockComponent.open();
          },

          disabled,
        };
      },
      when: ctx => {
        const openDocService = ctx.std.get(OpenDocExtensionIdentifier);
        return openDocService.isAllowed('open-in-active-view');
      },
    },
    {
      icon: SplitViewIcon({ width: '20', height: '20' }),
      label: 'Open in split view',
      type: 'open-in-split-view',
      generate: ctx => {
        const linkedDocBlock = ctx.getLinkedDocBlock();

        if (!linkedDocBlock) return;

        return {
          action: () => {
            const blockComponent = ctx.firstBlockComponent;

            if (!blockComponent) return;
            if (!('open' in blockComponent)) return;
            if (typeof blockComponent.open !== 'function') return;

            blockComponent.open({ openMode: 'open-in-new-view' });
          },
        };
      },
      when: ctx => {
        const openDocService = ctx.std.get(OpenDocExtensionIdentifier);
        return openDocService.isAllowed('open-in-new-view');
      },
    },
    {
      icon: OpenInNewIcon({ width: '20', height: '20' }),
      label: 'Open in new tab',
      type: 'open-in-new-tab',
      generate: ctx => {
        const linkedDocBlock = ctx.getLinkedDocBlock();

        if (!linkedDocBlock) return;

        return {
          action: () => {
            const blockComponent = ctx.firstBlockComponent;

            if (!blockComponent) return;
            if (!('open' in blockComponent)) return;
            if (typeof blockComponent.open !== 'function') return;

            blockComponent.open({ openMode: 'open-in-new-tab' });
          },
        };
      },
      when: ctx => {
        const openDocService = ctx.std.get(OpenDocExtensionIdentifier);
        return openDocService.isAllowed('open-in-new-tab');
      },
    },
    {
      icon: CenterPeekIcon({ width: '20', height: '20' }),
      label: 'Open in center peek',
      type: 'center-peek',
      generate: ctx => {
        const valid =
          ctx.isSingle() &&
          !!ctx.firstBlockComponent &&
          isPeekable(ctx.firstBlockComponent);

        if (!valid) return;

        return {
          action: () => {
            if (!ctx.firstBlockComponent) return;

            peek(ctx.firstBlockComponent);
          },
        };
      },
      when: ctx => {
        const openDocService = ctx.std.get(OpenDocExtensionIdentifier);
        return openDocService.isAllowed('open-in-center-peek');
      },
    },
  ],
};

// Clipboard Group
export const clipboardGroup: MenuItemGroup<ElementToolbarMoreMenuContext> = {
  type: 'clipboard',
  items: [
    {
      icon: CopyIcon({ width: '20', height: '20' }),
      label: 'Copy',
      type: 'copy',
      action: ({ edgeless }) => edgeless.clipboardController.copy(),
    },
    {
      icon: DuplicateIcon({ width: '20', height: '20' }),
      label: 'Duplicate',
      type: 'duplicate',
      action: ({ edgeless, selectedElements }) =>
        duplicate(edgeless, selectedElements),
    },
    {
      icon: ResetIcon({ width: '20', height: '20' }),
      label: 'Reload',
      type: 'reload',
      generate: ctx => {
        if (ctx.hasFrame()) {
          return;
        }

        const blocks = ctx.selection.surfaceSelections
          .map(s => ctx.getBlockComponent(s.blockId))
          .filter(block => !!block)
          .filter(block => ctx.refreshable(block.model));

        if (
          !blocks.length ||
          blocks.length !== ctx.selection.surfaceSelections.length
        ) {
          return;
        }

        return {
          action: () =>
            blocks.forEach(block =>
              (block as RefreshableBlockComponent).refreshData()
            ),
        };
      },
    },
  ],
};

// Conversions Group
export const conversionsGroup: MenuItemGroup<ElementToolbarMoreMenuContext> = {
  type: 'conversions',
  items: [
    {
      icon: LinkedPageIcon({ width: '20', height: '20' }),
      label: 'Turn into linked doc',
      type: 'turn-into-linked-doc',
      action: async ctx => {
        const { doc, service, surface, std } = ctx;
        const element = ctx.getNoteBlock();
        if (!element) return;

        const title = await promptDocTitle(std);
        if (title === null) return;

        const linkedDoc = createLinkedDocFromNote(doc, element, title);
        const crud = std.get(EdgelessCRUDIdentifier);
        // insert linked doc card
        const cardId = crud.addBlock(
          'affine:embed-synced-doc',
          {
            xywh: element.xywh,
            style: 'syncedDoc',
            pageId: linkedDoc.id,
            index: element.index,
          },
          surface.model.id
        );
        std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
          control: 'context-menu',
          page: 'whiteboard editor',
          module: 'toolbar',
          segment: 'toolbar',
          type: 'embed-synced-doc',
        });
        std.getOptional(TelemetryProvider)?.track('DocCreated', {
          control: 'turn into linked doc',
          page: 'whiteboard editor',
          module: 'format toolbar',
          type: 'embed-linked-doc',
        });
        std.getOptional(TelemetryProvider)?.track('LinkedDocCreated', {
          control: 'turn into linked doc',
          page: 'whiteboard editor',
          module: 'format toolbar',
          type: 'embed-linked-doc',
          other: 'new doc',
        });
        moveConnectors(element.id, cardId, service);
        // delete selected note
        doc.transact(() => {
          doc.deleteBlock(element);
        });
        service.selection.set({
          elements: [cardId],
          editing: false,
        });
      },
      when: ctx => !!ctx.getNoteBlock(),
    },
    {
      icon: LinkedPageIcon({ width: '20', height: '20' }),
      label: 'Create linked doc',
      type: 'create-linked-doc',
      action: async ({ doc, selection, surface, edgeless, host, std }) => {
        const title = await promptDocTitle(std);
        if (title === null) return;

        const elements = getSortedCloneElements(selection.selectedElements);
        const linkedDoc = createLinkedDocFromEdgelessElements(
          host,
          elements,
          title
        );
        const crud = std.get(EdgelessCRUDIdentifier);
        // delete selected elements
        doc.transact(() => {
          deleteElements(edgeless, elements);
        });
        // insert linked doc card
        const width = 364;
        const height = 390;
        const bound = getCommonBoundWithRotation(elements);
        const cardId = crud.addBlock(
          'affine:embed-linked-doc',
          {
            xywh: `[${bound.center[0] - width / 2}, ${bound.center[1] - height / 2}, ${width}, ${height}]`,
            style: 'vertical',
            pageId: linkedDoc.id,
          },
          surface.model.id
        );
        selection.set({
          elements: [cardId],
          editing: false,
        });
        std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
          control: 'context-menu',
          page: 'whiteboard editor',
          module: 'toolbar',
          segment: 'toolbar',
          type: 'embed-linked-doc',
        });
        std.getOptional(TelemetryProvider)?.track('DocCreated', {
          control: 'create linked doc',
          page: 'whiteboard editor',
          module: 'format toolbar',
          type: 'embed-linked-doc',
        });
        std.getOptional(TelemetryProvider)?.track('LinkedDocCreated', {
          control: 'create linked doc',
          page: 'whiteboard editor',
          module: 'format toolbar',
          type: 'embed-linked-doc',
          other: 'new doc',
        });

        notifyDocCreated(std, doc);
      },
      when: ctx => !(ctx.getLinkedDocBlock() || ctx.getNoteBlock()),
    },
  ],
};

// Delete Group
export const deleteGroup: MenuItemGroup<ElementToolbarMoreMenuContext> = {
  type: 'delete',
  items: [
    {
      icon: DeleteIcon({ width: '20', height: '20' }),
      label: 'Delete',
      type: 'delete',
      action: ({ doc, selection, selectedElements, edgeless }) => {
        doc.captureSync();
        deleteElements(edgeless, selectedElements);

        selection.set({
          elements: [],
          editing: false,
        });
      },
    },
  ],
};

export const BUILT_IN_GROUPS = [
  sectionGroup,
  reorderGroup,
  openGroup,
  clipboardGroup,
  conversionsGroup,
  deleteGroup,
];
