import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/toolbar/shape/shape-menu.js';

import type { SurfaceSelection } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import { isPeekable, peek } from '../../../_common/components/peekable.js';
import {
  BringForwardIcon,
  BringToFrontIcon,
  CenterPeekIcon,
  CopyAsPngIcon,
  FontLinkedDocIcon,
  FrameIcon,
  GroupIcon,
  MoreCopyIcon,
  MoreDeleteIcon,
  MoreDuplicateIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  OpenIcon,
  RefreshIcon,
  SendBackwardIcon,
  SendToBackIcon,
} from '../../../_common/icons/index.js';
import type { ReorderingType } from '../../../_common/utils/index.js';
import {
  createLinkedDocFromEdgelessElements,
  createLinkedDocFromNote,
  notifyDocCreated,
  promptDocTitle,
} from '../../../_common/utils/render-linked-doc.js';
import type {
  AttachmentBlockComponent,
  BookmarkBlockComponent,
  EmbedFigmaBlockComponent,
  EmbedGithubBlockComponent,
  EmbedLinkedDocBlockComponent,
  EmbedLoomBlockComponent,
  EmbedSyncedDocBlockComponent,
  EmbedYoutubeBlockComponent,
  ImageBlockComponent,
} from '../../../index.js';
import { Bound } from '../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { removeContainedFrames } from '../../edgeless/frame-manager.js';
import { edgelessElementsBound } from '../../edgeless/utils/bound-utils.js';
import {
  duplicate,
  splitElements,
} from '../../edgeless/utils/clipboard-utils.js';
import { getCloneElements } from '../../edgeless/utils/clone-utils.js';
import { moveConnectors } from '../../edgeless/utils/connector.js';
import { deleteElements } from '../../edgeless/utils/crud.js';
import {
  isAttachmentBlock,
  isBookmarkBlock,
  isEmbeddedLinkBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
} from '../../edgeless/utils/query.js';

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

type Action = {
  icon: TemplateResult<1>;
  name: string;
  type:
    | 'delete'
    | 'copy-as-png'
    | 'create-frame'
    | 'create-group'
    | 'turn-into-linked-doc'
    | 'create-linked-doc'
    | 'copy'
    | 'duplicate'
    | 'reload'
    | 'open'
    | 'center-peek'
    | ReorderingType;
  disabled?: boolean;
};

// Group Actions
type FatActions = (Action | typeof nothing)[][];

const OPEN_ACTION: Action = {
  icon: OpenIcon,
  name: 'Open this doc',
  type: 'open',
};
const CENTER_PEEK_ACTION: Action = {
  icon: CenterPeekIcon,
  name: 'Open in center peek',
  type: 'center-peek',
};

const REORDER_ACTIONS: Action[] = [
  { icon: BringToFrontIcon, name: 'Bring to Front', type: 'front' },
  { icon: BringForwardIcon, name: 'Bring Forward', type: 'forward' },
  { icon: SendBackwardIcon, name: 'Send Backward', type: 'backward' },
  { icon: SendToBackIcon, name: 'Send to Back', type: 'back' },
] as const;

const COPY_ACTIONS: Action[] = [
  { icon: MoreCopyIcon, name: 'Copy', type: 'copy' },
  { icon: CopyAsPngIcon, name: 'Copy as PNG', type: 'copy-as-png' },
  { icon: MoreDuplicateIcon, name: 'Duplicate', type: 'duplicate' },
] as const;

const DELETE_ACTION: Action = {
  icon: MoreDeleteIcon,
  name: 'Delete',
  type: 'delete',
};

const FRAME_ACTION: Action = {
  icon: FrameIcon,
  name: 'Frame section',
  type: 'create-frame',
};

const GROUP_ACTION: Action = {
  icon: GroupIcon,
  name: 'Group section',
  type: 'create-group',
};

const RELOAD_ACTION: Action = {
  icon: RefreshIcon,
  name: 'Reload',
  type: 'reload',
};

const TURN_INTO_LINKED_DOC_ACTION: Action = {
  icon: FontLinkedDocIcon,
  name: 'Turn into linked doc',
  type: 'turn-into-linked-doc',
};

const CREATE_LINKED_DOC_ACTION: Action = {
  icon: FontLinkedDocIcon,
  name: 'Create linked doc',
  type: 'create-linked-doc',
};

function Actions(
  fatActions: FatActions,
  onClick: (action: Action) => Promise<void> | void
) {
  return join(
    fatActions
      .filter(g => g.length)
      .map(g => g.filter(a => a !== nothing) as Action[])
      .filter(g => g.length)
      .map(actions =>
        repeat(
          actions,
          action => action.type,
          action => html`
            <div
              aria-label=${action.name}
              class="action-item ${action.type}"
              @click=${() => onClick(action)}
              ?data-disabled=${action.disabled}
            >
              ${action.icon}${action.name}
            </div>
          `
        )
      ),
    () => html`
      <edgeless-menu-divider
        data-orientation="horizontal"
        style="--height: 8px"
      ></edgeless-menu-divider>
    `
  );
}

@customElement('edgeless-more-button')
export class EdgelessMoreButton extends WithDisposable(LitElement) {
  static override styles = css`
    .more-actions-container {
      display: flex;
      flex-direction: column;
      min-width: 176px;
    }

    .action-item {
      display: flex;
      align-items: center;
      white-space: nowrap;
      box-sizing: border-box;
      padding: 4px 8px;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      gap: 8px;
    }

    .action-item:hover {
      background-color: var(--affine-hover-color);
    }
    .action-item:hover.delete {
      background-color: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }

    .action-item[data-disabled] {
      cursor: not-allowed;
      color: var(--affine-text-disable-color);
    }
  `;

  @property({ attribute: false })
  accessor elements: BlockSuite.EdgelessModelType[] = [];

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor vertical = false;

  get doc() {
    return this.edgeless.doc;
  }

  get selection() {
    return this.edgeless.service.selection;
  }

  get slots() {
    return this.edgeless.slots;
  }

  get surface() {
    return this.edgeless.surface;
  }

  get view() {
    return this.edgeless.host.view;
  }

  private get _blockElement() {
    const blockSelection = this.edgeless.service.selection.surfaceSelections;
    if (
      blockSelection.length !== 1 ||
      blockSelection[0].elements.length !== 1
    ) {
      return;
    }

    const blockElement = this.view.getBlock(blockSelection[0].blockId) as
      | BookmarkBlockComponent
      | EmbedGithubBlockComponent
      | EmbedYoutubeBlockComponent
      | EmbedFigmaBlockComponent
      | EmbedLinkedDocBlockComponent
      | EmbedSyncedDocBlockComponent
      | EmbedLoomBlockComponent
      | null;
    assertExists(blockElement);

    return blockElement;
  }

  get _Actions(): FatActions {
    return [
      [FRAME_ACTION, GROUP_ACTION],
      REORDER_ACTIONS,
      this.getOpenActions(),
      [...COPY_ACTIONS, this.getRefreshAction()],
      [this.getLinkedDocAction()],
      [DELETE_ACTION],
    ];
  }

  get _FrameActions(): FatActions {
    return [
      [FRAME_ACTION],
      COPY_ACTIONS,
      [this.getLinkedDocAction()],
      [DELETE_ACTION],
    ];
  }

  private getOpenActions(): Action[] {
    const isSingleSelect = this.selection.selectedElements.length === 1;
    const { firstElement } = this.selection;
    const result: Action[] = [];

    if (
      isSingleSelect &&
      (isEmbedLinkedDocBlock(firstElement) ||
        isEmbedSyncedDocBlock(firstElement))
    ) {
      const disabled = firstElement.pageId === this.doc.id;
      result.push({
        ...OPEN_ACTION,
        disabled,
      });
    }

    if (
      isSingleSelect &&
      this._blockElement &&
      isPeekable(this._blockElement)
    ) {
      result.push(CENTER_PEEK_ACTION);
    }

    return result;
  }

  private getRefreshAction() {
    const refreshable = this.selection.selectedElements.every(ele =>
      this._refreshable(ele as BlockModel)
    );
    return refreshable ? RELOAD_ACTION : nothing;
  }

  private getLinkedDocAction() {
    const isSingleSelect = this.selection.selectedElements.length === 1;
    const { firstElement } = this.selection;
    if (
      isSingleSelect &&
      (isEmbedLinkedDocBlock(firstElement) ||
        isEmbedSyncedDocBlock(firstElement))
    ) {
      return nothing;
    }

    if (isSingleSelect && isNoteBlock(firstElement)) {
      return TURN_INTO_LINKED_DOC_ACTION;
    }

    return CREATE_LINKED_DOC_ACTION;
  }

  private _turnIntoLinkedDoc = (title?: string) => {
    const isSingleSelect = this.selection.selectedElements.length === 1;
    const { firstElement: element } = this.selection;

    if (isSingleSelect && isNoteBlock(element)) {
      const linkedDoc = createLinkedDocFromNote(
        this.edgeless.host.doc,
        element,
        title
      );
      // insert linked doc card
      const cardId = this.edgeless.service.addBlock(
        'affine:embed-synced-doc',
        {
          xywh: element.xywh,
          style: 'syncedDoc',
          pageId: linkedDoc.id,
          index: element.index,
        },
        this.surface.model.id
      );
      this.edgeless.service.telemetryService?.track('CanvasElementAdded', {
        control: 'context-menu',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: 'embed-synced-doc',
      });
      this.edgeless.service.telemetryService?.track('DocCreated', {
        control: 'turn into linked doc',
        page: 'whiteboard editor',
        module: 'format toolbar',
        type: 'embed-linked-doc',
      });
      this.edgeless.service.telemetryService?.track('LinkedDocCreated', {
        control: 'turn into linked doc',
        page: 'whiteboard editor',
        module: 'format toolbar',
        type: 'embed-linked-doc',
        other: 'new doc',
      });
      moveConnectors(element.id, cardId, this.edgeless.service);
      // delete selected note
      this.doc.transact(() => {
        this.surface.doc.deleteBlock(element);
      });
      this.edgeless.service.selection.set({
        elements: [cardId],
        editing: false,
      });
    } else {
      this._createLinkedDoc(title);
    }
  };

  private _createLinkedDoc = (title?: string) => {
    const selection = this.edgeless.service.selection;
    const elements = getCloneElements(
      selection.selectedElements,
      this.edgeless.surface.edgeless.service.frame
    );
    const linkedDoc = createLinkedDocFromEdgelessElements(
      this.edgeless.host,
      elements,
      title
    );
    // insert linked doc card
    const width = 364;
    const height = 390;
    const bound = edgelessElementsBound(elements);
    const cardId = this.edgeless.service.addBlock(
      'affine:embed-linked-doc',
      {
        xywh: `[${bound.center[0] - width / 2}, ${bound.center[1] - height / 2}, ${width}, ${height}]`,
        style: 'vertical',
        pageId: linkedDoc.id,
      },
      this.surface.model.id
    );
    this.edgeless.service.telemetryService?.track('CanvasElementAdded', {
      control: 'context-menu',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: 'embed-linked-doc',
    });
    this.edgeless.service.telemetryService?.track('DocCreated', {
      control: 'create linked doc',
      page: 'whiteboard editor',
      module: 'format toolbar',
      type: 'embed-linked-doc',
    });
    this.edgeless.service.telemetryService?.track('LinkedDocCreated', {
      control: 'create linked doc',
      page: 'whiteboard editor',
      module: 'format toolbar',
      type: 'embed-linked-doc',
      other: 'new doc',
    });
    // delete selected elements
    this.doc.transact(() => {
      deleteElements(this.surface, elements);
    });
    this.edgeless.service.selection.set({
      elements: [cardId],
      editing: false,
    });
  };

  private _delete = () => {
    this.doc.captureSync();
    deleteElements(this.surface, this.selection.selectedElements);

    this.selection.set({
      elements: [],
      editing: false,
    });
  };

  private _refreshable(ele: BlockModel) {
    return (
      isImageBlock(ele) ||
      isBookmarkBlock(ele) ||
      isAttachmentBlock(ele) ||
      isEmbeddedLinkBlock(ele)
    );
  }

  private _reload = (selections: SurfaceSelection[]) => {
    selections.forEach(sel => {
      const blockElement = this.view.getBlock(sel.blockId);
      if (!!blockElement && this._refreshable(blockElement.model)) {
        (blockElement as RefreshableBlockComponent).refreshData();
      }
    });
  };

  private _runAction = async ({ type }: Action) => {
    const selection = this.edgeless.service.selection;
    switch (type) {
      case 'copy': {
        this.edgeless.clipboardController.copy();
        break;
      }
      case 'duplicate': {
        await duplicate(this.edgeless, selection.selectedElements);
        break;
      }
      case 'delete': {
        this._delete();
        break;
      }
      case 'copy-as-png': {
        const { notes, frames, shapes, images } = splitElements(
          this.selection.selectedElements
        );
        this.slots.copyAsPng.emit({
          blocks: [...notes, ...removeContainedFrames(frames), ...images],
          shapes,
        });
        break;
      }
      case 'turn-into-linked-doc': {
        const title = await promptDocTitle(this.edgeless.host);
        if (title === null) return;
        this._turnIntoLinkedDoc(title);
        notifyDocCreated(this.edgeless.host, this.edgeless.doc);
        break;
      }
      case 'create-linked-doc': {
        const title = await promptDocTitle(this.edgeless.host);
        if (title === null) return;
        this._createLinkedDoc(title);
        notifyDocCreated(this.edgeless.host, this.edgeless.doc);
        break;
      }
      case 'create-frame': {
        const { service } = this.edgeless;
        const frame = service.frame.createFrameOnSelected();
        if (!frame) break;
        this.edgeless.service.telemetryService?.track('CanvasElementAdded', {
          control: 'context-menu',
          page: 'whiteboard editor',
          module: 'toolbar',
          segment: 'toolbar',
          type: 'frame',
        });
        this.edgeless.surface.fitToViewport(Bound.deserialize(frame.xywh));
        break;
      }
      case 'create-group': {
        this.edgeless.service.createGroupFromSelected();
        break;
      }
      case 'front':
      case 'forward':
      case 'backward':
      case 'back': {
        this.selection.selectedElements.forEach(el => {
          this.edgeless.service.reorderElement(el, type);
        });
        break;
      }
      case 'reload':
        this._reload(this.selection.surfaceSelections);
        break;
      case 'open':
        if (this._blockElement) {
          this._blockElement.open();
        }
        break;
      case 'center-peek':
        if (this._blockElement) {
          peek(this._blockElement);
        }
        break;
    }
  };

  override render() {
    const selection = this.edgeless.service.selection;
    const actions = Actions(
      selection.selectedElements.some(isFrameBlock)
        ? this._FrameActions
        : this._Actions,
      this._runAction
    );

    return html`
      <edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <edgeless-tool-icon-button aria-label="More" .tooltip=${'More'}>
            ${this.vertical ? MoreVerticalIcon : MoreHorizontalIcon}
          </edgeless-tool-icon-button>
        `}
      >
        <div slot class="more-actions-container">${actions}</div>
      </edgeless-menu-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-more-button': EdgelessMoreButton;
  }
}
