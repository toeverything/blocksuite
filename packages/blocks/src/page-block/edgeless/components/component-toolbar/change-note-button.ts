import '../buttons/tool-icon-button.js';
import '../toolbar/shape/shape-menu.js';
import '../panel/color-panel.js';

import { HiddenIcon, NoteIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { assertExists, matchFlavours, type Page } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { CssVariableName } from '../../../../__internal__/theme/css-variables.js';
import type { TopLevelBlockModel } from '../../../../__internal__/utils/types.js';
import {
  NOTE_COLORS,
  type NoteBlockModel,
} from '../../../../note-block/note-model.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { ColorEvent } from '../panel/color-panel.js';
import { createButtonPopper } from '../utils.js';

@customElement('edgeless-change-note-button')
export class EdgelessChangeNoteButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      color: var(--affine-text-primary-color);
      fill: currentColor;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    edgeless-color-panel {
      display: none;
      width: 108px;
      height: 68px;
      padding: 8px 12px;
      flex-wrap: wrap;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    edgeless-color-panel[data-show] {
      display: flex;
    }

    .selected-background {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 20px;
      height: 20px;
      box-sizing: border-box;
      border-radius: 50%;
      color: var(--affine-text-primary-color);
      font-size: 12px;
    }

    .note-status {
      display: flex;
      align-items: center;
      text-align: center;
      justify-content: center;
      gap: 10px;
      width: 24px;
      height: 24px;
      background: var(--affine-blue-600);
      border-radius: 4px;
      color: var(--affine-white);
      font-size: 12px;
      font-family: Avenir Next;
      font-weight: 600;
      line-height: 16px;
    }

    .note-status > span {
      display: flex;
      padding: 4px 6px;
      width: 24px;
      flex-direction: column;
    }

    .note-status.hidden > span {
      display: flex;
      padding: 4px;
    }

    .note-status-button {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--affine-text-secondary-color);
      width: 74px;
      height: 24px;
      padding: 4px 8px;
    }

    .note-status-button.hidden {
      width: 126px;
    }

    .note-status-button:hover {
      background: var(--affine-hover-color);
      border-radius: 8px;
    }

    .note-status-button .hover {
      display: none;
    }
    .note-status-button:hover .hover {
      display: flex;
    }
    .note-status-button:hover .unhover {
      display: none;
    }

    .note-status-button svg {
      width: 20px;
      height: 20px;
    }

    .note-status-button > span {
      font-size: 12px;
      font-family: Avenir Next;
      font-style: normal;
      font-weight: 600;
      line-height: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2px;
    }
  `;

  @property({ attribute: false })
  notes: TopLevelBlockModel[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  @state()
  private _popperShow = false;

  @query('edgeless-tool-icon-button')
  private _colorSelectorButton!: HTMLDivElement;
  @query('edgeless-color-panel')
  private _colorSelector!: HTMLDivElement;

  private _colorSelectorPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _renderSelectedColor(color: CssVariableName) {
    const style = { backgroundColor: `var(${color})` };

    return html`<div class="selected-background" style=${styleMap(style)}>
      A
    </div>`;
  }

  private _setBlockBackground(color: CssVariableName) {
    this.notes.forEach(note => {
      this.page.updateBlock(note, { background: color });
    });
  }

  private _setNoteHidden(note: NoteBlockModel, hidden: boolean) {
    this.page.updateBlock(note, { hidden });

    const noteParent = this.page.getParent(note);
    assertExists(noteParent);
    const noteParentChildNotes = noteParent.children.filter(block =>
      matchFlavours(block, ['affine:note'])
    ) as NoteBlockModel[];
    const noteParentLastNote =
      noteParentChildNotes[noteParentChildNotes.length - 1];

    if (!hidden && note !== noteParentLastNote) {
      // move to the end
      this.page.moveBlocks([note], noteParent, noteParentLastNote, false);
    }
    this.requestUpdate();
  }

  override updated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    if (this._colorSelector) {
      this._colorSelectorPopper = createButtonPopper(
        this._colorSelectorButton,
        this._colorSelector,
        ({ display }) => {
          this._popperShow = display === 'show';
        }
      );
      _disposables.add(this._colorSelectorPopper);
    }
    super.updated(changedProperties);
  }

  override render() {
    if (this.notes.length !== 1) return null;
    const note = this.notes[0];
    const noteParent = this.page.getParent(note);
    assertExists(noteParent);
    const allNotes = noteParent.children.filter(
      block => matchFlavours(block, ['affine:note']) && !block.hidden
    );

    const selectedBackground = note.background;
    const noteIndex = allNotes.indexOf(note) + 1;

    const enableIndex = this.page.awarenessStore.getFlag('enable_note_index');

    if (note.hidden) {
      return html`
        ${enableIndex
          ? html`<div class="note-status hidden">
              <span>${HiddenIcon}</span>
            </div>`
          : nothing}
        <div
          @click=${() => this._setNoteHidden(note, !note.hidden)}
          class="note-status-button hidden"
        >
          <span class="unhover"><span>Hidden on page mode</span></span>
          <span class="hover">${NoteIcon}<span>Show on page</span></span>
        </div>
      `;
    } else {
      return html`
        ${enableIndex
          ? html`<div class="note-status">
              <span>${noteIndex}</span>
            </div>`
          : nothing}
        <div
          @click=${() => this._setNoteHidden(note, !note.hidden)}
          class="note-status-button unhover"
        >
          <span class="unhover">${NoteIcon}<span>On page</span></span>
          <span class="hover">${HiddenIcon}<span>Hidden</span></span>
        </div>
        <edgeless-tool-icon-button
          .tooltip=${this._popperShow ? '' : 'Color'}
          .active=${false}
          @click=${() => this._colorSelectorPopper?.toggle()}
        >
          ${this._renderSelectedColor(selectedBackground)}
        </edgeless-tool-icon-button>
        <edgeless-color-panel
          .value=${selectedBackground}
          .options=${NOTE_COLORS}
          .showLetterMark=${true}
          @select=${(event: ColorEvent) => {
            this._setBlockBackground(event.detail);
          }}
        ></edgeless-color-panel>
      `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-note-button': EdgelessChangeNoteButton;
  }
}
