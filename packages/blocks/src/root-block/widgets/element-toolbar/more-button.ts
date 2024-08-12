import type { SurfaceSelection } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import {
  BringForwardIcon,
  BringToFrontIcon,
  CenterPeekIcon,
  FrameIcon,
  GroupIcon,
  LinkedDocIcon,
  MoreCopyIcon,
  MoreDeleteIcon,
  MoreDuplicateIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  OpenIcon,
  RefreshIcon,
  SendBackwardIcon,
  SendToBackIcon,
} from '@blocksuite/affine-components/icons';
import { isPeekable, peek } from '@blocksuite/affine-components/peek';
import {
  type Action,
  type FatActions,
  renderActions,
} from '@blocksuite/affine-components/toolbar';
import { WithDisposable } from '@blocksuite/block-std';
import { Bound } from '@blocksuite/global/utils';
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type {
  AttachmentBlockComponent,
  BookmarkBlockComponent,
  EmbedFigmaBlockComponent,
  EmbedGithubBlockComponent,
  EmbedLoomBlockComponent,
  EmbedYoutubeBlockComponent,
  ImageBlockComponent,
} from '../../../index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import {
  createLinkedDocFromEdgelessElements,
  createLinkedDocFromNote,
  notifyDocCreated,
  promptDocTitle,
} from '../../../_common/utils/render-linked-doc.js';
import '../../edgeless/components/toolbar/shape/shape-menu.js';
import { edgelessElementsBound } from '../../edgeless/utils/bound-utils.js';
import { duplicate } from '../../edgeless/utils/clipboard-utils.js';
import { getCloneElements } from '../../edgeless/utils/clone-utils.js';
import { moveConnectors } from '../../edgeless/utils/connector.js';
import { deleteElements } from '../../edgeless/utils/crud.js';
import {
  isAttachmentBlock,
  isBookmarkBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
  isEmbeddedLinkBlock,
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
  icon: LinkedDocIcon,
  name: 'Turn into linked doc',
  type: 'turn-into-linked-doc',
};

const CREATE_LINKED_DOC_ACTION: Action = {
  icon: LinkedDocIcon,
  name: 'Create linked doc',
  type: 'create-linked-doc',
};

@customElement('edgeless-more-button')
export class EdgelessMoreButton extends WithDisposable(LitElement) {
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

  private _reload = (selections: SurfaceSelection[]) => {
    selections.forEach(sel => {
      const block = this.view.getBlock(sel.blockId);
      if (!!block && this._refreshable(block.model)) {
        (block as RefreshableBlockComponent).refreshData();
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
        if (
          this._block &&
          'open' in this._block &&
          typeof this._block.open === 'function'
        ) {
          this._block.open();
        }
        break;
      case 'center-peek':
        if (this._block && isPeekable(this._block)) {
          peek(this._block);
        }
        break;
    }
  };

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

  private get _block() {
    const blockSelection = this.edgeless.service.selection.surfaceSelections;
    if (
      blockSelection.length !== 1 ||
      blockSelection[0].elements.length !== 1
    ) {
      return;
    }

    const block = this.view.getBlock(blockSelection[0].blockId);
    if (!block) return;

    return block;
  }

  private _refreshable(ele: BlockModel) {
    return (
      isImageBlock(ele) ||
      isBookmarkBlock(ele) ||
      isAttachmentBlock(ele) ||
      isEmbeddedLinkBlock(ele)
    );
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

    if (isSingleSelect && this._block && isPeekable(this._block)) {
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

  override render() {
    const selection = this.edgeless.service.selection;
    const actions = renderActions(
      selection.selectedElements.some(isFrameBlock)
        ? this._FrameActions
        : this._Actions,
      this._runAction
    );

    return html`
      <editor-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <editor-icon-button aria-label="More" .tooltip=${'More'}>
            ${this.vertical ? MoreVerticalIcon : MoreHorizontalIcon}
          </editor-icon-button>
        `}
      >
        <div
          class="more-actions-container"
          data-size="large"
          data-orientation="vertical"
        >
          ${actions}
        </div>
      </editor-menu-button>
    `;
  }

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

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements: BlockSuite.EdgelessModel[] = [];

  @property({ attribute: false })
  accessor vertical = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-more-button': EdgelessMoreButton;
  }
}
