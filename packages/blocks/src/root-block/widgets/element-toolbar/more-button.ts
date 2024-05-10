import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/toolbar/shape/shape-menu.js';
import '../../../_common/components/menu-divider.js';

import type { SurfaceSelection } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import {
  css,
  html,
  LitElement,
  nothing,
  type TemplateResult,
  unsafeCSS,
} from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
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
import {
  createButtonPopper,
  type ReorderingType,
} from '../../../_common/utils/index.js';
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
];

const COPY_ACTIONS: Action[] = [
  { icon: MoreCopyIcon, name: 'Copy', type: 'copy' },
  { icon: CopyAsPngIcon, name: 'Copy as PNG', type: 'copy-as-png' },
  { icon: MoreDuplicateIcon, name: 'Duplicate', type: 'duplicate' },
];

const DELETE_ACTION: Action = {
  icon: MoreDeleteIcon,
  name: 'Delete',
  type: 'delete',
};

const FRAME_ACTION: Action = {
  icon: FrameIcon,
  name: 'Frame Section',
  type: 'create-frame',
};

const GROUP_ACTION: Action = {
  icon: GroupIcon,
  name: 'Group Section',
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
      return action.type === 'divider'
        ? html`<menu-divider></menu-divider>`
        : html`<div
            class="action-item ${action.type}"
            @click=${() => onClick(action)}
            ?data-disabled=${action.disabled}
          >
            ${action.icon}${action.name}
          </div>`;
    }
  );
}

@customElement('edgeless-more-button')
export class EdgelessMoreButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      color: var(--affine-text-primary-color);
      fill: currentColor;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .more-actions-container {
      display: none;
      position: absolute;
      width: 164px;
      padding: 8px;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      font-size: 16px;
      line-height: 22px;
    }

    .more-actions-container[data-show] {
      display: block;
    }

    .action-item {
      display: flex;
      white-space: nowrap;
      height: 32px;
      box-sizing: border-box;
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      align-items: center;
      gap: 8px;
    }

    menu-divider {
      width: 88%;
      position: relative;
      left: 8px;
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
  elements: string[] = [];

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  vertical = false;

  @state()
  private _showPopper = false;

  @query('.more-actions-container')
  private _actionsMenu!: HTMLDivElement;

  private _actionsMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

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
    const refreshable = this.selection.elements.every(ele =>
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
    deleteElements(this.surface, this.selection.elements);

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
      const blockElement = this.view.viewFromPath('block', sel.path);
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
        await duplicate(this.edgeless, selection.elements);
        break;
      }
      case 'delete': {
        this._delete();
        break;
      }
      case 'copy-as-png': {
        const { notes, frames, shapes, images } = splitElements(
          this.selection.elements
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
        this.selection.elements.forEach(el => {
          this.edgeless.service.reorderElement(el, type);
        });
        break;
      }
      case 'reload':
        this._reload(this.selection.selections);
        break;
    }
    this._actionsMenuPopper?.hide();
  };

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._actionsMenuPopper = createButtonPopper(
      this,
      this._actionsMenu,
      ({ display }) => {
        this._showPopper = display === 'show';
      }
    );
    _disposables.add(this._actionsMenuPopper);
    super.firstUpdated(changedProperties);
  }

  override render() {
    const selection = this.edgeless.service.selection;

    const actions = Actions(
      selection.elements.some(ele => isFrameBlock(ele))
        ? this._FrameActions
        : this._Actions,
      this._runAction
    );
    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._showPopper ? nothing : 'More'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._actionsMenuPopper?.toggle()}
      >
        ${this.vertical ? MoreVerticalIcon : MoreHorizontalIcon}
      </edgeless-tool-icon-button>
      <div class="more-actions-container">${actions}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-more-button': EdgelessMoreButton;
  }
}
