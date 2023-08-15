import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  type EdgelessTool,
  type NoteChildrenFlavour,
  throttle,
} from '../../../../../__internal__/index.js';
import { nextItemIcon } from '../../../../../icons/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import {
  BUTTON_GROUP_LENGTH,
  NOTE_MENU_ITEM_LENGTH,
  NOTE_MENU_ITEMS,
} from './note-memu-config.js';

@customElement('edgeless-note-menu')
export class EdgelessNoteMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      height: 76px;
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px 8px 0 0;
      display: flex;
      z-index: -1;
    }
    .note-menu-container {
      display: flex;
      flex-direction: column;
      background: transparent;
      fill: currentcolor;
      position: relative;
    }
    .button-group-container {
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      border: 1px solid var(--affine-border-color);
      border-radius: 8px 8px 0 0;
      padding-bottom: 8px;
      padding-right: 3px;
    }
    .button-group-label {
      font-family: 'Avenir Next';
      font-size: 12px;
      font-weight: 400;
      font-style: normal;
      margin-left: 12px;
      display: flex;
      align-items: end;
      text-align: center;
      color: var(--affine-text-disable-color);
      align-self: flex-end;
      margin-bottom: 9px;
    }
    .button-group-container > :is(edgeless-tool-icon-button) > svg {
      fill: currentColor;
    }
    .menu-button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      width: 42px;
    }
    .next-item-button {
      position: absolute;
      top: 12px;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transform: translateX(50%);
      align-self: flex-end;
    }
    .next-item-button > svg path {
      fill: var(--affine-icon-color);
    }
    .next-item-button > svg {
      transition: 0.3s ease-in-out;
    }
    .next-item-button > svg:hover {
      cursor: pointer;
      transform: scale(1.2);
    }
    .next-item-icon-background {
      fill: var(--affine-background-overlay-panel-color);
    }
    .next-item-icon-stroke {
      stroke: var(--affine-border-color);
    }
    .active-item-rect {
      position: absolute;
      top: 3px;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 2px;
      background: #d9d9d9;
      border-radius: 11px;
    }
    edgeless-tool-icon-button {
      margin-top: 4px;
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  _startIndex!: number;

  @property({ attribute: false })
  _endIndex!: number;

  @property({ attribute: false })
  _activeIndex!: number;

  private _updateNoteTool(
    childFlavour: NoteChildrenFlavour,
    childType: string | null,
    tip: string
  ) {
    if (this.edgelessTool.type !== 'note') return;

    const { background } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'note',
      background,
      childFlavour,
      childType,
      tip,
    });
  }

  private _setNoteBlockType(
    index: number,
    childFlavour: NoteChildrenFlavour,
    childType: string | null,
    tip: string
  ) {
    this._activeIndex = index;
    this._updateNoteTool(childFlavour, childType, tip);
  }

  private _activeNextItem() {
    if (this._activeIndex >= NOTE_MENU_ITEMS.length - 1) return;

    this._activeIndex += 1;
    if (this._activeIndex >= this._endIndex) {
      this._startIndex += 1;
      this._endIndex += 1;
    }

    const childFlavour = NOTE_MENU_ITEMS[this._activeIndex].childFlavour;
    const childType = NOTE_MENU_ITEMS[this._activeIndex].childType;
    const tip = NOTE_MENU_ITEMS[this._activeIndex].tooltip;
    this._updateNoteTool(childFlavour, childType, tip);
  }

  private _handleWheel = throttle((e: WheelEvent) => {
    // prevent scrolling when the menu is at the end (right edge)
    if (this._activeIndex >= NOTE_MENU_ITEM_LENGTH - 1 && e.deltaY < 0) return;
    // prevent scrolling when the menu is at the start (left edge)
    if (this._activeIndex <= 0 && e.deltaY > 0) return;
    // when scrolling down, increase the active index
    if (e.deltaY < 0) {
      this._activeIndex++;
    } else if (e.deltaY > 0) {
      // when scrolling up, decrease the active index
      this._activeIndex--;
    }
    // when the active index is out of the range of the button group
    // update the button group
    if (this._activeIndex >= this._endIndex) {
      this._endIndex = this._activeIndex + 1;
      this._startIndex = this._endIndex - BUTTON_GROUP_LENGTH;
    }

    if (this._activeIndex < this._startIndex) {
      this._startIndex = this._activeIndex;
      this._endIndex = this._startIndex + BUTTON_GROUP_LENGTH;
    }

    if (this._activeIndex < 0 || this._activeIndex >= NOTE_MENU_ITEM_LENGTH)
      return;

    const childFlavour = NOTE_MENU_ITEMS[this._activeIndex].childFlavour;
    const childType = NOTE_MENU_ITEMS[this._activeIndex].childType;
    const tip = NOTE_MENU_ITEMS[this._activeIndex].tooltip;
    this._updateNoteTool(childFlavour, childType, tip);
  }, 100);

  // get currnet visible button group
  private _getMenuButtons(start: number, end: number) {
    return NOTE_MENU_ITEMS.slice(start, end).map((item, index) => {
      return html`
        <div class="menu-button">
          <edgeless-tool-icon-button
            .active=${this._activeIndex === start + index}
            .activeMode=${'background'}
            .tooltip=${item.tooltip}
            @click=${() =>
              this._setNoteBlockType(
                start + index,
                item.childFlavour,
                item.childType,
                item.tooltip
              )}
          >
            ${item.icon}
          </edgeless-tool-icon-button>
          ${this._activeIndex === start + index
            ? html`<div class="active-item-rect"></div>`
            : nothing}
        </div>
      `;
    });
  }

  constructor() {
    super();
    this._activeIndex = 0;
    this._startIndex = 0;
    this._endIndex = BUTTON_GROUP_LENGTH;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'wheel', e => {
      e.preventDefault();
      // prevent edgeless page block from scrolling
      e.stopPropagation();
      this._handleWheel(e);
    });
  }

  override disconnectedCallback() {
    super.connectedCallback();
    this._disposables.dispose();
  }

  override render() {
    if (this.edgelessTool.type !== 'note') return nothing;
    const displayButtons = this._getMenuButtons(
      this._startIndex,
      this._endIndex
    );

    return html`
      <div class="note-memu-container">
        <div class="button-group-container">
          <div class="button-group-label">Blocks</div>
          ${displayButtons}
          <div class="next-item-button" @click=${() => this._activeNextItem()}>
            ${nextItemIcon}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-menu': EdgelessNoteMenu;
  }
}
