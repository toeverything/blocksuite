import '../buttons/tool-icon-button.js';
import '../toolbar/shape/shape-menu.js';
import '../panel/color-panel.js';

import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { HiddenIcon, NoteIcon } from '../../../../_common/icons/index.js';
import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import { matchFlavours } from '../../../../_common/utils/model.js';
import {
  NOTE_COLORS,
  type NoteBlockModel,
} from '../../../../note-block/note-model.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
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

    .show {
      font-size: 12px;
      color: var(--affine-text-secondary-color);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      height: 30px;
      cursor: pointer;
    }

    .show:hover {
      background: var(--affine-hover-color);
      border-radius: 8px;
    }
  `;

  @property({ attribute: false })
  notes: NoteBlockModel[] = [];

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

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
      this.surface.page.updateBlock(note, { background: color });
    });
  }

  private _setNoteHidden(note: NoteBlockModel, hidden: boolean) {
    this.surface.page.updateBlock(note, { hidden });

    const noteParent = this.surface.page.getParent(note);
    assertExists(noteParent);
    const noteParentChildNotes = noteParent.children.filter(block =>
      matchFlavours(block, ['affine:note'])
    ) as NoteBlockModel[];
    const noteParentLastNote =
      noteParentChildNotes[noteParentChildNotes.length - 1];

    if (!hidden && note !== noteParentLastNote) {
      // move to the end
      this.surface.page.moveBlocks(
        [note],
        noteParent,
        noteParentLastNote,
        false
      );
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
    if (this.notes.length !== 1) return nothing;

    const note = this.notes[0];
    const selectedBackground = note.background;
    const enableIndex =
      this.surface.page.awarenessStore.getFlag('enable_note_index');

    return html`
      ${enableIndex
        ? html`<div
            class="show"
            style=${styleMap({
              width: note.hidden ? '84px' : '158px',
            })}
            @click=${() => this._setNoteHidden(note, !note.hidden)}
          >
            ${note.hidden
              ? html`${NoteIcon}On page`
              : html`
                  ${HiddenIcon}
                  <div>${'Hidden on page mode'}</div>
                `}
          </div>`
        : nothing}
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

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-note-button': EdgelessChangeNoteButton;
  }
}
