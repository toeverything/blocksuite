import { nextItemIcon } from '@blocksuite/global/config';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../__internal__/index.js';
import { type Flavour } from '../../../../models.js';
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
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  startIndex!: number;

  @property({ attribute: false })
  endIndex!: number;

  @property({ attribute: false })
  activeIndex!: number;

  private _getMenuButtons(start: number, end: number) {
    return ButtonConfigs.slice(start, end).map((button, index) => {
      return html`
        <edgeless-tool-icon-button
          ?active=${this.activeIndex === start + index}
          .activeMode=${'background'}
          .tooltip=${button.tooltip}
          @click=${() =>
            this._setNoteBlockType(
              start + index,
              button.flavour,
              button.blockType
            )}
        >
          ${button.icon}
        </edgeless-tool-icon-button>
      `;
    });
  }

  private _setNoteBlockType(
    index: number,
    flavour: Flavour,
    blockType: string
  ) {
    if (this.edgelessTool.type !== 'note') return;

    this.activeIndex = index;
    console.log('activeIndex: ', this.activeIndex);
    const { background } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'note',
      background,
      flavour,
      blockType,
    });
  }

  private _activeNextItem() {
    if (
      this.edgelessTool.type !== 'note' ||
      this.activeIndex >= ButtonConfigs.length - 1
    )
      return;

    this.activeIndex += 1;
    const { background } = this.edgelessTool;
    this.edgeless.slots.edgelessToolUpdated.emit({
      type: 'note',
      background,
      flavour: ButtonConfigs[this.activeIndex].flavour,
      blockType: ButtonConfigs[this.activeIndex].blockType,
    });
    if (this.activeIndex >= this.endIndex) {
      this.startIndex += 1;
      this.endIndex += 1;
    }
    console.log('activeIndex: ', this.activeIndex);
  }

  constructor() {
    super();
    this.activeIndex = 0;
    this.startIndex = 0;
    this.endIndex = BUTTON_GROUP_LENGTH;
  }

  override render() {
    if (this.edgelessTool.type !== 'note') return nothing;
    const displayButtons = this._getMenuButtons(this.startIndex, this.endIndex);

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
