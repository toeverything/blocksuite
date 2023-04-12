import '../tool-icon-button.js';
import '../../toolbar/shape-tool/shape-menu.js';

import { MoreHorizontalIcon } from '@blocksuite/global/config';
import type { SurfaceManager } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { WithDisposable } from '../../../../__internal__/index.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { Selectable } from '../../selection-manager.js';
import { isTopLevelBlock } from '../../utils.js';
import { createButtonPopper } from '../utils.js';

type Action = {
  name: string;
  value: 'delete' | 'moveToBack' | 'moveToFront';
  disabled?: boolean;
};
const ACTIONS: Action[] = [
  // FIXME: should implement these function
  // { name: 'Copy', value: 'copy', disabled: true },
  // { name: 'Paste', value: 'paste', disabled: true },
  // { name: 'Duplicate', value: 'duplicate', disabled: true },
  { name: 'Bring to front', value: 'moveToFront' },
  { name: 'Send to back', value: 'moveToBack' },
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
  static styles = css`
    :host {
      display: block;
      fill: none;
      stroke: currentColor;
      color: var(--affine-text-color);
    }

    .more-actions-container {
      display: none;
      width: 158px;
      padding: 8px 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
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
      background-color: var(--affine-hover-background);
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

  private _runAction = (action: Action) => {
    switch (action.value) {
      case 'delete': {
        this._delete();
        break;
      }
      case 'moveToBack': {
        this.surface.moveToBack(this.elements.map(ele => ele.id));
        break;
      }
      case 'moveToFront': {
        this.surface.moveToFront(this.elements.map(ele => ele.id));
        break;
      }
    }
    this._actionsMenuPopper?.hide();
  };

  firstUpdated(changedProperties: Map<string, unknown>) {
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

  render() {
    const actions = Actions(this._runAction);
    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._popperShow ? '' : 'More'}
        .active=${false}
        @tool.click=${() => this._actionsMenuPopper?.toggle()}
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
