import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/color-panel.js';
import '../../edgeless/components/panel/note-shadow-panel.js';
import '../../edgeless/components/panel/note-display-mode-panel.js';
import '../../edgeless/components/panel/scale-panel.js';
import '../../edgeless/components/panel/size-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

import {
  ExpandIcon,
  LineStyleIcon,
  NoteCornerIcon,
  NoteShadowIcon,
  ScissorsIcon,
  ShrinkIcon,
  SmallArrowDownIcon,
} from '../../../_common/icons/index.js';
import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { NoteDisplayMode } from '../../../_common/types.js';
import { matchFlavours } from '../../../_common/utils/model.js';
import { type NoteBlockModel } from '../../../note-block/note-model.js';
import { Bound, StrokeStyle } from '../../../surface-block/index.js';
import type { EdgelessMenuButton } from '../../edgeless/components/buttons/menu-button.js';
import { type ColorEvent } from '../../edgeless/components/panel/color-panel.js';
import {
  type LineStyleEvent,
  LineStylesPanel,
} from '../../edgeless/components/panel/line-styles-panel.js';
import { getTooltipWithShortcut } from '../../edgeless/components/utils.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

const NOTE_BACKGROUND: CssVariableName[] = [
  '--affine-tag-red',
  '--affine-tag-orange',
  '--affine-tag-yellow',
  '--affine-tag-green',
  '--affine-tag-teal',
  '--affine-tag-blue',
  '--affine-tag-purple',
  '--affine-tag-pink',
  '--affine-tag-gray',
  '--affine-palette-transparent',
];

@customElement('edgeless-change-note-button')
export class EdgelessChangeNoteButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  accessor notes: NoteBlockModel[] = [];

  @property({ attribute: false })
  accessor enableNoteSlicer!: boolean;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  private accessor _scalePanelRef: Ref<EdgelessMenuButton> = createRef();
  private accessor _cornersPanelRef: Ref<EdgelessMenuButton> = createRef();

  private get doc() {
    return this.edgeless.doc;
  }

  private _setBackground(color: CssVariableName) {
    this.notes.forEach(note => {
      this.doc.updateBlock(note, { background: color });
    });
  }

  private _setShadowType(shadowType: string) {
    this.notes.forEach(note => {
      this.doc.updateBlock(note, () => {
        note.edgeless.style.shadowType = shadowType;
      });
    });
  }

  private _setDisplayMode(note: NoteBlockModel, newMode: NoteDisplayMode) {
    const { displayMode: currentMode } = note;
    if (newMode === currentMode) {
      return;
    }

    this.doc.updateBlock(note, { displayMode: newMode });

    const noteParent = this.doc.getParent(note);
    assertExists(noteParent);
    const noteParentChildNotes = noteParent.children.filter(block =>
      matchFlavours(block, ['affine:note'])
    ) as NoteBlockModel[];
    const noteParentLastNote =
      noteParentChildNotes[noteParentChildNotes.length - 1];

    if (
      currentMode === NoteDisplayMode.EdgelessOnly &&
      newMode !== NoteDisplayMode.EdgelessOnly &&
      note !== noteParentLastNote
    ) {
      // move to the end
      this.doc.moveBlocks([note], noteParent, noteParentLastNote, false);
    }

    // if change note to page only, should clear the selection
    if (newMode === NoteDisplayMode.DocOnly) {
      this.edgeless.service.selection.clear();
    }
  }

  private _setStrokeWidth(borderSize: number) {
    this.notes.forEach(note => {
      this.doc.updateBlock(note, () => {
        note.edgeless.style.borderSize = borderSize;
      });
    });
  }

  private _setStrokeStyle(borderStyle: StrokeStyle) {
    this.notes.forEach(note => {
      this.doc.updateBlock(note, () => {
        note.edgeless.style.borderStyle = borderStyle;
      });
    });
  }

  private _setStyles({ type, value }: LineStyleEvent) {
    if (type === 'size') {
      this._setStrokeWidth(value);
    } else if (type === 'lineStyle') {
      switch (value) {
        case 'solid': {
          this._setStrokeStyle(StrokeStyle.Solid);
          break;
        }
        case 'dash': {
          this._setStrokeStyle(StrokeStyle.Dash);
          break;
        }
        case 'none': {
          this._setStrokeStyle(StrokeStyle.None);
          break;
        }
      }
    }
  }

  private _setBorderRadius = (size: number) => {
    this.notes.forEach(note => {
      this.doc.updateBlock(note, () => {
        note.edgeless.style.borderRadius = size;
      });
    });
  };

  private _setNoteScale = (scale: number) => {
    this.notes.forEach(note => {
      this.doc.updateBlock(note, () => {
        const bound = Bound.deserialize(note.xywh);
        const oldScale = note.edgeless.scale ?? 1;
        const ratio = scale / oldScale;
        bound.w *= ratio;
        bound.h *= ratio;
        const xywh = bound.serialize();
        note.xywh = xywh;
        note.edgeless.scale = scale;
      });
    });
  };

  private _setCollapse() {
    this.notes.forEach(note => {
      const { collapse, collapsedHeight } = note.edgeless;

      if (collapse) {
        this.doc.updateBlock(note, () => {
          note.edgeless.collapse = false;
        });
      } else if (collapsedHeight) {
        const { xywh, edgeless } = note;
        const bound = Bound.deserialize(xywh);
        bound.h = collapsedHeight * (edgeless.scale ?? 1);
        this.doc.updateBlock(note, () => {
          note.edgeless.collapse = true;
          note.xywh = bound.serialize();
        });
      }
    });
    this.requestUpdate();
  }

  private _handleNoteSlicerButtonClick() {
    const surfaceService = this.edgeless.service;
    if (!surfaceService) return;

    this.edgeless.slots.toggleNoteSlicer.emit();
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

  private _getScaleLabel(scale: number) {
    return Math.round(scale * 100) + '%';
  }

  override render() {
    const length = this.notes.length;
    const note = this.notes[0];
    const { background, edgeless, displayMode } = note;
    const { shadowType, borderRadius, borderSize, borderStyle } =
      edgeless.style;

    const { collapse } = edgeless;
    const scale = edgeless.scale ?? 1;
    const currentMode = this._getCurrentModeLabel(displayMode);

    return html`
      ${length === 1
        ? html`
            <span class="display-mode-button-label">Show in</span>
            <edgeless-menu-button
              .contentPadding=${'8px'}
              .button=${html`
                <edgeless-tool-icon-button
                  aria-label="Mode"
                  .tooltip=${'Display mode'}
                  .justify=${'space-between'}
                  .withHover=${true}
                  .labelHeight=${'20px'}
                >
                  <span class="label">${currentMode}</span>
                  ${SmallArrowDownIcon}
                </edgeless-tool-icon-button>
              `}
            >
              <note-display-mode-panel
                slot
                .displayMode=${displayMode}
                .onSelect=${(newMode: NoteDisplayMode) =>
                  this._setDisplayMode(note, newMode)}
              >
              </note-display-mode-panel>
            </edgeless-menu-button>

            <edgeless-menu-divider></edgeless-menu-divider>
          `
        : nothing}
      ${displayMode === NoteDisplayMode.DocOnly
        ? nothing
        : html`
            <edgeless-menu-button
              .contentPadding=${'8px'}
              .button=${html`
                <edgeless-tool-icon-button
                  aria-label="Background"
                  .tooltip=${'Background'}
                >
                  <edgeless-color-button
                    .color=${background}
                  ></edgeless-color-button>
                </edgeless-tool-icon-button>
              `}
            >
              <edgeless-color-panel
                slot
                .value=${background}
                .options=${NOTE_BACKGROUND}
                @select=${(e: ColorEvent) => this._setBackground(e.detail)}
              >
              </edgeless-color-panel>
            </edgeless-menu-button>

            <edgeless-menu-divider></edgeless-menu-divider>

            <edgeless-menu-button
              .contentPadding=${'6px'}
              .button=${html`
                <edgeless-tool-icon-button
                  aria-label="Shadow style"
                  .tooltip=${'Shadow style'}
                >
                  ${NoteShadowIcon}${SmallArrowDownIcon}
                </edgeless-tool-icon-button>
              `}
            >
              <edgeless-note-shadow-panel
                slot
                .value=${shadowType}
                .background=${background}
                .onSelect=${(value: string) => this._setShadowType(value)}
              >
              </edgeless-note-shadow-panel>
            </edgeless-menu-button>

            <edgeless-menu-button
              .button=${html`
                <edgeless-tool-icon-button
                  aria-label="Border style"
                  .tooltip=${'Border style'}
                >
                  ${LineStyleIcon}${SmallArrowDownIcon}
                </edgeless-tool-icon-button>
              `}
            >
              <div slot data-orientation="horizontal">
                ${LineStylesPanel({
                  selectedLineSize: borderSize,
                  selectedLineStyle: borderStyle,
                  onClick: event => this._setStyles(event),
                })}
              </div>
            </edgeless-menu-button>

            <edgeless-menu-button
              ${ref(this._cornersPanelRef)}
              .contentPadding=${'8px'}
              .button=${html`
                <edgeless-tool-icon-button
                  aria-label="Corners"
                  .tooltip=${'Corners'}
                >
                  ${NoteCornerIcon}${SmallArrowDownIcon}
                </edgeless-tool-icon-button>
              `}
            >
              <edgeless-size-panel
                slot
                .size=${borderRadius}
                .labels=${['None', 'Small', 'Medium', 'Large', 'Huge']}
                .sizes=${[0, 8, 16, 24, 32]}
                .minSize=${0}
                .onSelect=${(size: number) => this._setBorderRadius(size)}
                .onPopperCose=${() => this._cornersPanelRef.value?.close()}
              >
              </edgeless-size-panel>
            </edgeless-menu-button>

            <edgeless-menu-divider></edgeless-menu-divider>
          `}
      ${length === 1
        ? html`
            <edgeless-tool-icon-button
              aria-label="Slicer"
              .tooltip=${getTooltipWithShortcut('Cutting mode', '-')}
              .active=${this.enableNoteSlicer}
              @click=${this._handleNoteSlicerButtonClick}
            >
              ${ScissorsIcon}
            </edgeless-tool-icon-button>
            <edgeless-menu-divider></edgeless-menu-divider>
          `
        : nothing}

      <edgeless-tool-icon-button
        aria-label="Size"
        .tooltip=${collapse ? 'Auto height' : 'Customized height'}
        @click=${() => this._setCollapse()}
      >
        ${collapse ? ExpandIcon : ShrinkIcon}
      </edgeless-tool-icon-button>

      <edgeless-menu-button
        ${ref(this._scalePanelRef)}
        .contentPadding=${'8px'}
        .button=${html`
          <edgeless-tool-icon-button
            aria-label="Scale"
            .tooltip=${'Scale'}
            .justify=${'space-between'}
            .labelHeight=${'20px'}
            .iconContainerWidth=${'65px'}
          >
            <span class="label">${this._getScaleLabel(scale)}</span
            >${SmallArrowDownIcon}
          </edgeless-tool-icon-button>
        `}
      >
        <edgeless-scale-panel
          slot
          .scale=${Math.round(scale * 100)}
          .scales=${[50, 100, 200]}
          .minSize=${0}
          .onSelect=${(scale: number) => this._setNoteScale(scale)}
          .onPopperCose=${() => this._scalePanelRef.value?.close()}
        ></edgeless-scale-panel>
      </edgeless-menu-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-note-button': EdgelessChangeNoteButton;
  }
}

export function renderNoteButton(
  edgeless: EdgelessRootBlockComponent,
  notes?: NoteBlockModel[]
) {
  if (!notes?.length) return nothing;

  return html`
    <edgeless-change-note-button
      .notes=${notes}
      .edgeless=${edgeless}
      .enableNoteSlicer=${false}
    >
    </edgeless-change-note-button>
  `;
}
