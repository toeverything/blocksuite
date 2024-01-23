import {
  createButtonPopper,
  getThemeMode,
  type NoteBlockModel,
  NoteDisplayMode,
  on,
  once,
} from '@blocksuite/blocks';
import { DisposableGroup, noop } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { BlockModel, Page } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import {
  css,
  html,
  LitElement,
  nothing,
  type PropertyValues,
  unsafeCSS,
} from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { HiddenIcon, SmallArrowDownIcon } from '../../_common/icons.js';
import { OutlineBlockPreview } from './outline-preview.js';

noop(OutlineBlockPreview);

export type ReorderEvent = CustomEvent<{
  currentNumber: number;
  targetNumber: number;
  realIndex: number;
}>;

export type SelectEvent = CustomEvent<{
  id: string;
  selected: boolean;
  number: number;
  multiselect: boolean;
}>;

export type FitViewEvent = CustomEvent<{
  block: NoteBlockModel;
}>;

export type ClickBlockEvent = CustomEvent<{
  blockPath: string[];
}>;

export type DisplayModeChangeEvent = CustomEvent<{
  note: NoteBlockModel;
  newMode: NoteDisplayMode;
}>;

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
    background-color: var(--affine-background-primary-color);

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
    align-items: center;
    gap: 4px;
    padding: 2px;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    position: relative;
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

export class OutlineNoteCard extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  editorMode: 'page' | 'edgeless' = 'page';

  @property({ attribute: false })
  note!: NoteBlockModel;

  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  number!: number;

  @property({ attribute: false })
  showPreviewIcon!: boolean;

  @property({ attribute: false })
  enableNotesSorting!: boolean;

  @property({ attribute: false })
  status?: 'selected' | 'placeholder';

  @property({ attribute: false })
  invisible = false;

  @state()
  private _showPopper = false;

  @query('.display-mode-button-group')
  private _displayModeButtonGroup!: HTMLDivElement;
  @query('note-display-mode-panel')
  private _displayModePanel!: HTMLDivElement;
  private _displayModePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _noteDisposables: DisposableGroup | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    const observer = new MutationObserver(() => this.requestUpdate());

    observer.observe(this.ownerDocument.documentElement, {
      subtree: false,
      childList: false,
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    this._disposables.add(() => observer.disconnect());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearNoteDisposables();
  }

  private _clearNoteDisposables = () => {
    this._noteDisposables?.dispose();
    this._noteDisposables = null;
  };

  private _setNoteDisposables() {
    this._clearNoteDisposables();
    this._noteDisposables = new DisposableGroup();
    this._noteDisposables.add(
      this.note.childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );
    this._noteDisposables.add(
      this.note.propsUpdated.on(() => this.requestUpdate())
    );
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

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('note') || _changedProperties.has('index')) {
      this._setNoteDisposables();
    }
  }

  override firstUpdated() {
    this._displayModePopper = createButtonPopper(
      this._displayModeButtonGroup,
      this._displayModePanel,
      ({ display }) => {
        this._showPopper = display === 'show';
      },
      -144,
      -60
    );

    this.disposables.add(this._displayModePopper);
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

  // Need to consider the case that block not a child of a note
  private _buildBlockPath(block: BlockModel) {
    return [this.note.id, block.id];
  }

  private _dispatchClickBlockEvent(block: BlockModel) {
    const event = new CustomEvent('clickblock', {
      detail: {
        blockPath: this._buildBlockPath(block),
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

  override render() {
    if (this.note.isEmpty()) return nothing;

    const mode = getThemeMode();
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
          ${this.invisible
            ? html`<span class="card-header-icon">${HiddenIcon}</span>`
            : html`<span class="card-number">${this.number}</span>`}
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
              return html`<outline-block-preview
                .block=${block}
                .showPreviewIcon=${this.showPreviewIcon}
                .disabledIcon=${this.invisible}
                .cardNumber=${this.number}
                .enableNotesSorting=${this.enableNotesSorting}
                @click=${() => {
                  if (this.editorMode === 'edgeless' || this.invisible) return;
                  this._dispatchClickBlockEvent(block);
                }}
              ></outline-block-preview>`;
            })}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'outline-note-card': OutlineNoteCard;
  }
}
