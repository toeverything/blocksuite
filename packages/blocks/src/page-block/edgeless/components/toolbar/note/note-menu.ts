import { nextItemIcon } from '@blocksuite/global/config';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type {
  EdgelessTool,
  NoteChildrenFlavour,
  NoteChildrenType,
} from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { BUTTON_GROUP_LENGTH, ButtonConfigs } from './note-memu-config.js';
@customElement('edgeless-note-menu')
export class EdgelessNoteMenu extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      height: 76px;
      display: flex;
      padding: 0;
      z-index: -1;
    }
    .note-menu-container {
      display: flex;
      align-items: center;
      flex-direction: column;
      background: var(--affine-background-overlay-panel-color);
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
    }
    .button-group-label {
      font-family: 'Avenir Next';
      font-size: 12px;
      font-weight: 400;
      font-style: normal;
      margin-left: 12px;
      line-height: 16px;
      display: flex;
      align-items: center;
      text-align: center;
      color: var(--affine-text-disable-color);
    }
    .button-group-container > :is(edgeless-tool-icon-button) > svg {
      fill: currentColor;
    }
    .menu-button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .next-item-button {
      position: absolute;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transform: translateX(50%);
    }
    .next-item-button > svg {
      transform: scale(0.8);
    }
    .next-item-button > svg:hover {
      cursor: pointer;
      transform: scale(1);
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

  _wheelTimer: ReturnType<typeof setTimeout> | null = null;

  private _updateNoteTool(
    childFlavour: NoteChildrenFlavour,
    childType: NoteChildrenType
  ) {
    if (this.edgelessTool.type !== 'note') return;

    const { background } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'note',
      background,
      childFlavour,
      childType,
    });
  }

  private _setNoteBlockType(
    index: number,
    childFlavour: NoteChildrenFlavour,
    childType: NoteChildrenType
  ) {
    this._activeIndex = index;
    this._updateNoteTool(childFlavour, childType);
  }

  private _activeNextItem() {
    if (this._activeIndex >= ButtonConfigs.length - 1) return;

    this._activeIndex += 1;
    if (this._activeIndex >= this._endIndex) {
      this._startIndex += 1;
      this._endIndex += 1;
    }

    const childFlavour = ButtonConfigs[this._activeIndex].childFlavour;
    const childType = ButtonConfigs[this._activeIndex].childType;
    this._updateNoteTool(childFlavour, childType);
  }

  private _handleWheel(e: WheelEvent) {
    e.preventDefault();
    // prevent edgeless page block from scrolling
    e.stopPropagation();
    // prevent scrolling when the menu is at the end (right edge)
    if (this._activeIndex >= ButtonConfigs.length - 1 && e.deltaY > 0) return;
    // prevent scrolling when the menu is at the start (left edge)
    if (this._activeIndex <= 0 && e.deltaY < 0) return;
    // when scrolling down, increase the active index
    if (e.deltaY > 0) {
      this._activeIndex++;
    } else {
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

    const childFlavour = ButtonConfigs[this._activeIndex].childFlavour;
    const childType = ButtonConfigs[this._activeIndex].childType;

    // debounce the update of the note tool
    this._wheelTimer && clearTimeout(this._wheelTimer);
    this._wheelTimer = setTimeout(() => {
      this._updateNoteTool(childFlavour, childType);
    }, 500);
  }

  // get currnet visible button group
  private _getMenuButtons(start: number, end: number) {
    return ButtonConfigs.slice(start, end).map((button, index) => {
      return html`
        <div class="menu-button">
          <edgeless-tool-icon-button
            .active=${this._activeIndex === start + index}
            .activeMode=${'background'}
            .tooltip=${button.tooltip}
            @click=${() =>
              this._setNoteBlockType(
                start + index,
                button.childFlavour,
                button.childType
              )}
          >
            ${button.icon}
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
    this._wheelTimer = null;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('wheel', this._handleWheel.bind(this));
  }

  override disconnectedCallback() {
    super.connectedCallback();
    this.removeEventListener('wheel', this._handleWheel.bind(this));
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
