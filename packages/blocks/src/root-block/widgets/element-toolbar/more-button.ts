import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/toolbar/shape/shape-menu.js';

import type { SurfaceSelection } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  BringForwardIcon,
  BringToFrontIcon,
  CopyAsPngIcon,
  FrameIcon,
  GroupIcon,
  MoreCopyIcon,
  MoreDeleteIcon,
  MoreDuplicateIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  RefreshIcon,
  SendBackwardIcon,
  SendToBackIcon,
} from '../../../_common/icons/index.js';
import { type ReorderingType } from '../../../_common/utils/index.js';
import type {
  AttachmentBlockComponent,
  BookmarkBlockComponent,
  EmbedFigmaBlockComponent,
  EmbedGithubBlockComponent,
  EmbedLoomBlockComponent,
  EmbedYoutubeBlockComponent,
  ImageBlockComponent,
} from '../../../index.js';
import { Bound } from '../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { removeContainedFrames } from '../../edgeless/frame-manager.js';
import {
  duplicate,
  splitElements,
} from '../../edgeless/utils/clipboard-utils.js';
import { deleteElements } from '../../edgeless/utils/crud.js';
import {
  isAttachmentBlock,
  isBookmarkBlock,
  isEmbeddedLinkBlock,
  isFrameBlock,
  isImageBlock,
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

type Action =
  | {
      icon: TemplateResult<1>;
      name: string;
      type:
        | 'delete'
        | 'copy-as-png'
        | 'create-frame'
        | 'create-group'
        | 'copy'
        | 'duplicate'
        | 'reload'
        | ReorderingType;
      disabled?: boolean;
    }
  | {
      type: 'divider';
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

const ACTION_DIVIDER: Action = { type: 'divider' };

function Actions(
  actions: Action[],
  onClick: (action: Action) => Promise<void> | void
) {
  return repeat(
    actions,
    action => action.type,
    action => {
      if (action.type === 'divider') {
        return html`
          <edgeless-menu-divider
            data-orientation="horizontal"
            style="--height: 8px"
          ></edgeless-menu-divider>
        `;
      }

      return html`
        <div
          aria-label=${action.name}
          class="action-item ${action.type}"
          @click=${() => onClick(action)}
          ?data-disabled=${action.disabled}
        >
          ${action.icon}${action.name}
        </div>
      `;
    }
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
    }
  `;

  @property({ attribute: false })
  accessor elements: string[] = [];

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

  get _Actions(): Action[] {
    const actions: Action[] = [
      FRAME_ACTION,
      GROUP_ACTION,
      ACTION_DIVIDER,
      ...REORDER_ACTIONS,
      ACTION_DIVIDER,
      ...COPY_ACTIONS,
    ];
    const refreshable = this.selection.selectedElements.every(ele =>
      this._refreshable(ele as BlockModel)
    );
    if (refreshable) {
      actions.push(RELOAD_ACTION);
    }
    actions.push(ACTION_DIVIDER, DELETE_ACTION);
    return actions;
  }

  get _FrameActions(): Action[] {
    return [
      FRAME_ACTION,
      ACTION_DIVIDER,
      ...COPY_ACTIONS,
      ACTION_DIVIDER,
      DELETE_ACTION,
    ];
  }

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
      case 'create-frame': {
        const { service } = this.edgeless;
        const frame = service.frame.createFrameOnSelected();
        if (!frame) break;
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
    }
  };

  override render() {
    const selection = this.edgeless.service.selection;
    const actions = Actions(
      selection.selectedElements.some(ele => isFrameBlock(ele))
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
