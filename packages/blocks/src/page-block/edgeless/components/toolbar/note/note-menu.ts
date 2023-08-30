import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  type EdgelessTool,
  type NoteChildrenFlavour,
} from '../../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import {
  NOTE_MENU_ITEMS,
  NOTE_MENU_WIDTH,
  TOP_END_TOOLTIP_TYPE,
  TOP_START_TOOLTIP_TYPE,
} from './note-menu-config.js';

@customElement('edgeless-note-menu')
export class EdgelessNoteMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      display: flex;
      z-index: -1;
    }
    .note-menu-container {
      display: flex;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px 8px 0 0;
      border: 1px solid var(--affine-border-color);
      position: relative;
      cursor: default;
    }
    .menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .button-group-label {
      font-family: 'Inter';
      font-size: 12px;
      font-weight: 400;
      font-style: normal;
      display: flex;
      text-align: center;
      color: var(--light-text-color-text-secondary-color, #8e8d91);
      width: 38px;
      height: 20px;
      line-height: 20px;
      margin-right: 16px;
    }
    .button-group-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 14px;
      fill: var(--affine-icon-color);
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

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

  private _getTooltipPosition(childType: string | null) {
    if (!childType) return 'top';

    return TOP_END_TOOLTIP_TYPE.includes(childType)
      ? 'top-end'
      : TOP_START_TOOLTIP_TYPE.includes(childType)
      ? 'top-start'
      : 'top';
  }

  override render() {
    if (this.edgelessTool.type !== 'note') return nothing;

    const { childType } = this.edgelessTool;

    return html`
      <div class="note-menu-container">
        <edgeless-slide-menu .menuWidth=${NOTE_MENU_WIDTH}>
          <div class="menu-content">
            <div class="button-group-label">Blocks</div>
            <div class="button-group-container">
              ${NOTE_MENU_ITEMS.map(item => {
                return html`
                  <edgeless-tool-icon-button
                    .active=${childType === item.childType}
                    .activeMode=${'background'}
                    .iconContainerPadding=${2}
                    .tooltip=${item.tooltip}
                    .tipPosition=${this._getTooltipPosition(item.childType)}
                    @click=${() =>
                      this._updateNoteTool(
                        item.childFlavour,
                        item.childType,
                        item.tooltip
                      )}
                  >
                    ${item.icon}
                  </edgeless-tool-icon-button>
                `;
              })}
            </div>
          </div>
        </edgeless-slide-menu>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-menu': EdgelessNoteMenu;
  }
}
