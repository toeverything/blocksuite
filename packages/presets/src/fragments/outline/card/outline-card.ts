import type { BlockModel, Doc } from '@blocksuite/store';

import {
  createButtonPopper,
  type NoteBlockModel,
  NoteDisplayMode,
  on,
  once,
  ThemeObserver,
} from '@blocksuite/blocks';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { SelectEvent } from '../utils/custom-events.js';

import { HiddenIcon, SmallArrowDownIcon } from '../../_common/icons.js';

const styles = css`
  :host {
    display: block;
    position: relative;
  }

  .card-container {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .card-preview {
    position: relative;

    width: 100%;

    border-radius: 4px;

    cursor: default;
    user-select: none;
  }

  .card-preview.edgeless:hover {
    background: var(--affine-hover-color);
  }

  .card-header-container {
    padding: 0 8px;
    width: 100%;
    min-height: 28px;
    display: none;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
  }

  .card-header-container.enable-sorting {
    display: flex;
  }

  .card-header-container .card-number {
    text-align: center;
    font-size: var(--affine-font-sm);
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    color: var(--affine-brand-color, #1e96eb);
    font-weight: 500;
    line-height: 14px;
    line-height: 20px;
  }

  .card-header-container .card-header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-header-container .card-divider {
    height: 1px;
    flex: 1;
    border-top: 1px dashed var(--affine-border-color);
    transform: translateY(50%);
  }

  .display-mode-button-group {
    display: none;
    position: absolute;
    right: 8px;
    top: -6px;
    padding-top: 8px;
    padding-bottom: 8px;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
  }

  .card-preview:hover .display-mode-button-group {
    display: flex;
  }

  .display-mode-button-label {
    color: var(--affine-text-primary-color);
  }

  .display-mode-button {
    display: flex;
    border-radius: 4px;
    background-color: var(--affine-hover-color);
    align-items: center;
  }

  .current-mode-label {
    display: flex;
    padding: 2px 0px 2px 4px;
    align-items: center;
  }

  note-display-mode-panel {
    position: absolute;
    display: none;
    background: var(--affine-background-overlay-panel-color);
    border-radius: 8px;
    box-shadow: var(--affine-shadow-2);
    box-sizing: border-box;
    padding: 8px;
    font-size: var(--affine-font-sm);
    color: var(--affine-text-primary-color);
    line-height: 22px;
    font-weight: 400;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
  }

  note-display-mode-panel[data-show] {
    display: flex;
  }

  .card-content {
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    user-select: none;
    color: var(--affine-text-primary-color);
  }

  .card-preview.edgeless .card-content:hover {
    cursor: pointer;
  }

  .card-preview.edgeless .card-header-container:hover {
    cursor: grab;
  }

  .card-container.placeholder {
    pointer-events: none;
    opacity: 0.5;
  }

  .card-container.selected .card-preview.edgeless {
    background: var(--affine-hover-color);
  }

  .card-container.placeholder .card-preview.edgeless {
    background: var(--affine-hover-color);
    opacity: 0.9;
  }

  .card-container[data-sortable='true'] {
    padding: 2px 0;
  }

  .card-container[data-invisible='true'] .card-header-container .card-number,
  .card-container[data-invisible='true']
    .card-header-container
    .card-header-icon,
  .card-container[data-invisible='true'] .card-preview .card-content {
    color: var(--affine-text-disable-color);
    pointer-events: none;
  }

  .card-preview.page outline-block-preview:hover {
    color: var(--affine-brand-color);
  }
`;

export const AFFINE_OUTLINE_NOTE_CARD = 'affine-outline-note-card';

export class OutlineNoteCard extends SignalWatcher(WithDisposable(LitElement)) {
  static override styles = styles;

  private _displayModePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _dispatchClickBlockEvent(block: BlockModel) {
    const event = new CustomEvent('clickblock', {
      detail: {
        blockId: block.id,
      },
    });

    this.dispatchEvent(event);
  }

  private _dispatchDisplayModeChangeEvent(
    note: NoteBlockModel,
    newMode: NoteDisplayMode
  ) {
    const event = new CustomEvent('displaymodechange', {
      detail: {
        note,
        newMode,
      },
    });

    this.dispatchEvent(event);
  }

  private _dispatchDragEvent(e: MouseEvent) {
    e.preventDefault();
    if (
      e.button !== 0 ||
      this.editorMode === 'page' ||
      !this.enableNotesSorting
    )
      return;

    const { clientX: startX, clientY: startY } = e;
    const disposeDragStart = on(this.ownerDocument, 'mousemove', e => {
      if (
        Math.abs(startX - e.clientX) < 5 &&
        Math.abs(startY - e.clientY) < 5
      ) {
        return;
      }
      if (this.status !== 'selected') {
        this._dispatchSelectEvent(e);
      }

      const event = new CustomEvent('drag');

      this.dispatchEvent(event);
      disposeDragStart();
    });

    once(this.ownerDocument, 'mouseup', () => {
      disposeDragStart();
    });
  }

  private _dispatchFitViewEvent(e: MouseEvent) {
    e.stopPropagation();

    const event = new CustomEvent('fitview', {
      detail: {
        block: this.note,
      },
    });

    this.dispatchEvent(event);
  }

  private _dispatchSelectEvent(e: MouseEvent) {
    e.stopPropagation();
    const event = new CustomEvent('select', {
      detail: {
        id: this.note.id,
        selected: this.status !== 'selected',
        number: this.number,
        multiselect: e.shiftKey,
      },
    }) as SelectEvent;

    this.dispatchEvent(event);
  }

  private _getCurrentModeLabel(mode: NoteDisplayMode) {
    switch (mode) {
      case NoteDisplayMode.DocAndEdgeless:
        return 'Both';
      case NoteDisplayMode.EdgelessOnly:
        return 'Edgeless';
      case NoteDisplayMode.DocOnly:
        return 'Page';
      default:
        return 'Both';
    }
  }

  override firstUpdated() {
    this._displayModePopper = createButtonPopper(
      this._displayModeButtonGroup,
      this._displayModePanel,
      ({ display }) => {
        this._showPopper = display === 'show';
      },
      {
        mainAxis: 0,
        crossAxis: -60,
      }
    );

    this.disposables.add(this._displayModePopper);
  }

  override render() {
    if (this.note.isEmpty.peek()) return nothing;

    const mode = ThemeObserver.mode;
    const { children, displayMode } = this.note;
    const currentMode = this._getCurrentModeLabel(displayMode);
    const cardHeaderClasses = classMap({
      'card-header-container': true,
      'enable-sorting': this.enableNotesSorting,
    });

    return html`
      <div
        data-invisible="${this.invisible ? 'true' : 'false'}"
        data-sortable="${this.enableNotesSorting ? 'true' : 'false'}"
        class="card-container ${this.status ?? ''} ${mode}"
      >
        <div
          class="card-preview ${this.editorMode}"
          @mousedown=${this._dispatchDragEvent}
          @click=${this._dispatchSelectEvent}
          @dblclick=${this._dispatchFitViewEvent}
        >
        ${html`<div class=${cardHeaderClasses}>
          ${
            this.invisible
              ? html`<span class="card-header-icon">${HiddenIcon}</span>`
              : html`<span class="card-number">${this.number}</span>`
          }
          <span class="card-divider"></span>
          <div class="display-mode-button-group">
            <span class="display-mode-button-label">Show in</span>
            <edgeless-tool-icon-button
              .tooltip=${this._showPopper ? '' : 'Display Mode'}
              .tipPosition=${'left-start'}
              .iconContainerPadding=${0}
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                this._displayModePopper?.toggle();
              }}
              @dblclick=${(e: MouseEvent) => e.stopPropagation()}
            >
              <div class="display-mode-button">
                <span class="current-mode-label">${currentMode}</span>
                ${SmallArrowDownIcon}
              </div>
            </edgeless-tool-icon-button>
          </div>
          </div>
          <note-display-mode-panel
            .displayMode=${displayMode}
            .panelWidth=${220}
            .onSelect=${(newMode: NoteDisplayMode) => {
              this._dispatchDisplayModeChangeEvent(this.note, newMode);
              this._displayModePopper?.hide();
            }}
          >
          </note-display-mode-panel>
        </div>`}
          <div class="card-content">
            ${children.map(block => {
              return html`<affine-outline-block-preview
                .block=${block}
                .className=${this.activeHeadingId === block.id ? 'active' : ''}
                .showPreviewIcon=${this.showPreviewIcon}
                .disabledIcon=${this.invisible}
                .cardNumber=${this.number}
                .enableNotesSorting=${this.enableNotesSorting}
                @click=${() => {
                  if (this.editorMode === 'edgeless' || this.invisible) return;
                  this._dispatchClickBlockEvent(block);
                }}
              ></affine-outline-block-preview>`;
            })}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  @query('.display-mode-button-group')
  private accessor _displayModeButtonGroup!: HTMLDivElement;

  @query('note-display-mode-panel')
  private accessor _displayModePanel!: HTMLDivElement;

  @state()
  private accessor _showPopper = false;

  @property({ attribute: false })
  accessor activeHeadingId: string | null = null;

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor editorMode: 'page' | 'edgeless' = 'page';

  @property({ attribute: false })
  accessor enableNotesSorting!: boolean;

  @property({ attribute: false })
  accessor index!: number;

  @property({ attribute: false })
  accessor invisible = false;

  @property({ attribute: false })
  accessor note!: NoteBlockModel;

  @property({ attribute: false })
  accessor number!: number;

  @property({ attribute: false })
  accessor showPreviewIcon!: boolean;

  @property({ attribute: false })
  accessor status: 'selected' | 'placeholder' | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_OUTLINE_NOTE_CARD]: OutlineNoteCard;
  }
}
