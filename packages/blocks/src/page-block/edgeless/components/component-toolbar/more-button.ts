import '../buttons/tool-icon-button.js';
import '../toolbar/shape/shape-menu.js';

import { groupBy } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { FrameElement, type PhasorElement } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  type ReorderingType,
  type TopLevelBlockModel,
} from '../../../../__internal__/index.js';
import {
  MoreHorizontalIcon,
  MoreVerticalIcon,
} from '../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { duplicate } from '../../utils/clipboard-utils.js';
import { isTopLevelBlock } from '../../utils/query.js';
import { mountFrameEditor } from '../../utils/text.js';
import { createButtonPopper } from '../utils.js';

type Action = {
  name: string;
  type:
    | 'delete'
    | 'copy-as-png'
    | 'create-frame'
    | 'rename'
    | 'copy'
    | 'duplicate'
    | ReorderingType;
  disabled?: boolean;
};

const ACTIONS: Action[] = [
  // FIXME: should implement these function
  // { name: 'Copy', type: 'copy', disabled: true },
  // { name: 'Paste', type: 'paste', disabled: true },
  // { name: 'Duplicate', type: 'duplicate', disabled: true },
  { name: 'Bring to front', type: 'front' },
  { name: 'Bring forward', type: 'forward' },
  { name: 'Send backward', type: 'backward' },
  { name: 'Send to back', type: 'back' },
  { name: 'Copy as PNG', type: 'copy-as-png' },
  { name: 'Create Frame', type: 'create-frame' },
  { name: 'Delete', type: 'delete' },
];

const FRAME_ACTIONS: Action[] = [
  { name: 'Rename', type: 'rename' },
  { name: 'Copy', type: 'copy' },
  { name: 'Copy as PNG', type: 'copy-as-png' },
  { name: 'Duplicate', type: 'duplicate' },
  { name: 'Delete', type: 'delete' },
];

function Actions(actions: Action[], onClick: (action: Action) => void) {
  return repeat(
    actions,
    action => action.type,
    action =>
      html`<div
        class="action-item ${action.type}"
        @click=${() => onClick(action)}
        ?data-disabled=${action.disabled}
      >
        ${action.name}
      </div>`
  );
}

@customElement('edgeless-more-button')
export class EdgelessMoreButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      color: var(--affine-text-primary-color);
      fill: currentColor;
      font-family: var(--affine-font-family);
    }

    .more-actions-container {
      display: none;
      width: 158px;
      padding: 8px 4px;
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
      width: 100%;
      height: 32px;
      box-sizing: border-box;
      padding: 5px 12px;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
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
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  vertical = false;

  @state()
  private _popperShow = false;

  @query('.more-actions-container')
  private _actionsMenu!: HTMLDivElement;

  private _actionsMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  get page() {
    return this.edgeless.page;
  }

  get selection() {
    return this.edgeless.selectionManager;
  }

  get slots() {
    return this.edgeless.slots;
  }

  get surface() {
    return this.edgeless.surface;
  }

  private _splitElements() {
    const { notes, shapes } = groupBy(this.selection.elements, element => {
      return isTopLevelBlock(element) ? 'notes' : 'shapes';
    }) as {
      notes: TopLevelBlockModel[];
      shapes: PhasorElement[];
    };

    return { notes: notes ?? [], shapes: shapes ?? [] };
  }

  private _delete() {
    this.page.captureSync();
    this.selection.elements.forEach(element => {
      if (isTopLevelBlock(element)) {
        const children = this.page.root?.children ?? [];
        if (children.length > 1) {
          this.page.deleteBlock(element);
        }
      } else if (element) {
        this.edgeless.connector.detachConnectors([element as PhasorElement]);
        this.surface.removeElement(element.id);
      }
    });
    this.selection.setSelection({
      elements: [],
      editing: false,
    });
  }

  private _runAction = async ({ type }: Action) => {
    const selection = this.edgeless.selectionManager;
    switch (type) {
      case 'rename': {
        if (selection.elements[0] instanceof FrameElement)
          mountFrameEditor(selection.elements[0], this.edgeless);
        break;
      }
      case 'copy': {
        this.edgeless.clipboard.copy();
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
        const { notes, shapes } = this._splitElements();
        this.slots.copyAsPng.emit({
          notes,
          shapes,
        });
        break;
      }
      case 'create-frame': {
        this.edgeless.frame.createFrameOnSelected();
        break;
      }
      case 'front':
      case 'forward':
      case 'backward':
      case 'back': {
        const { notes, shapes } = this._splitElements();
        if (notes.length) {
          this.slots.reorderingNotesUpdated.emit({
            elements: notes,
            type,
          });
        }
        if (shapes.length) {
          this.slots.reorderingShapesUpdated.emit({
            elements: shapes,
            type,
          });
        }
        break;
      }
    }
    this._actionsMenuPopper?.hide();
  };

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._actionsMenuPopper = createButtonPopper(
      this,
      this._actionsMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._actionsMenuPopper);
    super.firstUpdated(changedProperties);
  }

  override render() {
    const selection = this.edgeless.selectionManager;

    const actions = Actions(
      selection.elements.length === 1 &&
        selection.elements[0] instanceof FrameElement
        ? FRAME_ACTIONS
        : ACTIONS,
      this._runAction
    );
    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._popperShow ? '' : 'More'}
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
