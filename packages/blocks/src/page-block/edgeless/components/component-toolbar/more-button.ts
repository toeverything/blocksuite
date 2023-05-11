import '../tool-icon-button.js';
import '../../toolbar/shape-tool/shape-menu.js';

import { MoreHorizontalIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import type { SurfaceElement, SurfaceManager } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  type TopLevelBlockModel,
} from '../../../../__internal__/index.js';
import type {
  EdgelessSelectionSlots,
  ReorderType,
} from '../../edgeless-page-block.js';
import type { Selectable } from '../../selection-manager.js';
import { isTopLevelBlock } from '../../utils.js';
import { createButtonPopper } from '../utils.js';

type Action = {
  name: string;
  value: 'delete' | ReorderType;
  disabled?: boolean;
};
const ACTIONS: Action[] = [
  // FIXME: should implement these function
  // { name: 'Copy', value: 'copy', disabled: true },
  // { name: 'Paste', value: 'paste', disabled: true },
  // { name: 'Duplicate', value: 'duplicate', disabled: true },
  { name: 'Bring to front', value: 'front' },
  { name: 'Bring forward', value: 'forward' },
  { name: 'Send backward', value: 'backward' },
  { name: 'Send to back', value: 'back' },
  // { name: 'Copy as PNG', value: 'copy as PNG', disabled: true },
  { name: 'Delete', value: 'delete' },
];

function Actions(onClick: (action: Action) => void) {
  return repeat(
    ACTIONS,
    action => action.value,
    action =>
      html`<div
        class="action-item"
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
      fill: none;
      stroke: currentColor;
      color: var(--affine-text-primary-color);
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
      border-radius: 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }

    .action-item:hover {
      background-color: var(--affine-hover-color);
    }

    .action-item[data-disabled] {
      cursor: not-allowed;
    }
  `;

  @property()
  elements: Selectable[] = [];

  @property()
  page!: Page;

  @property()
  surface!: SurfaceManager;

  @property()
  slots!: EdgelessSelectionSlots;

  @state()
  private _popperShow = false;

  @query('.more-actions-container')
  private _actionsMenu!: HTMLDivElement;

  private _actionsMenuPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _splitElements(): {
    frames: TopLevelBlockModel[];
    shapes: SurfaceElement[];
  } {
    const frames: TopLevelBlockModel[] = [];
    const shapes: SurfaceElement[] = [];
    this.elements.forEach(element => {
      if (isTopLevelBlock(element)) {
        frames.push(element);
      } else {
        shapes.push(element);
      }
    });
    return {
      frames,
      shapes,
    };
  }

  private _delete() {
    this.page.captureSync();
    this.elements.forEach(element => {
      if (isTopLevelBlock(element)) {
        const children = this.page.root?.children ?? [];
        if (children.length > 1) {
          this.page.deleteBlock(element);
        }
      } else {
        this.surface.removeElement(element.id);
      }
    });
    this.slots.selectionUpdated.emit({ selected: [], active: false });
  }

  private _runAction = ({ value: type }: Action) => {
    switch (type) {
      case 'delete': {
        this._delete();
        break;
      }
      case 'front': {
        const { frames, shapes } = this._splitElements();
        if (frames.length) {
          this.slots.reorderUpdated.emit({
            elements: frames,
            type,
          });
        }
        if (shapes.length) {
          this.surface.bringToFront(shapes.map(ele => ele.id));
        }
        break;
      }
      case 'forward': {
        const { frames, shapes } = this._splitElements();
        if (frames.length) {
          this.slots.reorderUpdated.emit({
            elements: frames,
            type,
          });
        }
        if (shapes.length) {
          this.surface.bringForward(shapes.map(ele => ele.id));
        }
        break;
      }
      case 'backward': {
        const { frames, shapes } = this._splitElements();
        if (frames.length) {
          this.slots.reorderUpdated.emit({
            elements: frames,
            type,
          });
        }
        if (shapes.length) {
          this.surface.sendBackward(shapes.map(ele => ele.id));
        }
        break;
      }
      case 'back': {
        const { frames, shapes } = this._splitElements();
        if (frames.length) {
          this.slots.reorderUpdated.emit({
            elements: frames,
            type,
          });
        }
        if (shapes.length) {
          this.surface.sendToBack(shapes.map(ele => ele.id));
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
    const actions = Actions(this._runAction);
    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._popperShow ? '' : 'More'}
        .active=${false}
        @click=${() => this._actionsMenuPopper?.toggle()}
      >
        ${MoreHorizontalIcon}
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
