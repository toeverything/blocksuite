import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { EdgelessIcon, PageIcon } from '../../../../_common/icons/edgeless.js';
import { NoteDisplayMode } from '../../../../_common/types.js';
import { stopPropagation } from '../../../../_common/utils/event.js';

@customElement('note-display-mode-panel')
export class NoteDisplayModePanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 180px;
      width: var(--panel-width);
      gap: 4px;
    }
    .item {
      display: flex;
      align-items: center;
      width: 100%;
      height: 30px;
      padding: 4px 12px;
      border-radius: 4px;
      gap: 4px;
      box-sizing: border-box;
      cursor: pointer;
    }
    .item-label {
      flex: 1 1 0;
    }
    .item-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      color: var(--affine-icon-color);
    }
    .item:hover,
    .item.selected {
      background-color: var(--affine-hover-color);
    }
  `;

  @property({ attribute: false })
  accessor displayMode!: NoteDisplayMode;

  @property({ attribute: false })
  accessor onSelect!: (displayMode: NoteDisplayMode) => void;

  @property({ attribute: false })
  accessor panelWidth = 240;

  private _DisplayModeIcon(mode: NoteDisplayMode) {
    switch (mode) {
      case NoteDisplayMode.DocAndEdgeless:
        return html`${PageIcon} ${EdgelessIcon}`;
      case NoteDisplayMode.DocOnly:
        return html`${PageIcon}`;
      case NoteDisplayMode.EdgelessOnly:
        return html`${EdgelessIcon}`;
    }
  }

  private _DisplayModeLabel(mode: NoteDisplayMode) {
    switch (mode) {
      case NoteDisplayMode.DocAndEdgeless:
        return 'In Both';
      case NoteDisplayMode.DocOnly:
        return 'In Page Only';
      case NoteDisplayMode.EdgelessOnly:
        return 'In Edgeless Only';
    }
  }

  override render() {
    this.style.setProperty('--panel-width', `${this.panelWidth}px`);

    return repeat(
      Object.keys(NoteDisplayMode),
      mode => mode,
      mode => {
        const displayMode =
          NoteDisplayMode[mode as keyof typeof NoteDisplayMode];
        const isSelected = displayMode === this.displayMode;
        return html`<div
          class="item ${isSelected ? 'selected' : ''} ${displayMode}"
          @click=${() => this.onSelect(displayMode)}
          @dblclick=${stopPropagation}
          @pointerdown=${stopPropagation}
        >
          <div class="item-label">${this._DisplayModeLabel(displayMode)}</div>
          <div class="item-icon">${this._DisplayModeIcon(displayMode)}</div>
        </div>`;
      }
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-display-mode-panel': NoteDisplayModePanel;
  }
}
