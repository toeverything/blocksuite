import {
  ExpandIcon,
  LineStyleIcon,
  NoteCornerIcon,
  NoteShadowIcon,
  ScissorsIcon,
  ShrinkIcon,
  SmallArrowDownIcon,
} from '@blocksuite/affine-components/icons';
import {
  type EditorMenuButton,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import {
  type ColorScheme,
  DEFAULT_NOTE_BACKGROUND_COLOR,
  NOTE_BACKGROUND_COLORS,
  type NoteBlockModel,
  NoteDisplayMode,
  type StrokeStyle,
} from '@blocksuite/affine-model';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import {
  assertExists,
  Bound,
  countBy,
  maxBy,
  WithDisposable,
} from '@blocksuite/global/utils';
import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';

import type {
  EdgelessColorPickerButton,
  PickColorEvent,
} from '../../edgeless/components/color-picker/index.js';
import type { ColorEvent } from '../../edgeless/components/panel/color-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import {
  packColor,
  packColorsWithColorScheme,
} from '../../edgeless/components/color-picker/utils.js';
import {
  type LineStyleEvent,
  LineStylesPanel,
} from '../../edgeless/components/panel/line-styles-panel.js';
import { getTooltipWithShortcut } from '../../edgeless/components/utils.js';

const SIZE_LIST = [
  { name: 'None', value: 0 },
  { name: 'Small', value: 8 },
  { name: 'Medium', value: 16 },
  { name: 'Large', value: 24 },
  { name: 'Huge', value: 32 },
] as const;

const DisplayModeMap = {
  [NoteDisplayMode.DocAndEdgeless]: 'Both',
  [NoteDisplayMode.EdgelessOnly]: 'Edgeless',
  [NoteDisplayMode.DocOnly]: 'Page',
} as const satisfies Record<NoteDisplayMode, string>;

function getMostCommonBackground(
  elements: NoteBlockModel[],
  colorScheme: ColorScheme
): string | null {
  const colors = countBy(elements, (ele: NoteBlockModel) => {
    return typeof ele.background === 'object'
      ? (ele.background[colorScheme] ?? ele.background.normal ?? null)
      : ele.background;
  });
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as string) : null;
}

export class EdgelessChangeNoteButton extends WithDisposable(LitElement) {
  private _setBorderRadius = (borderRadius: number) => {
    this.notes.forEach(note => {
      const props = {
        edgeless: {
          style: {
            ...note.edgeless.style,
            borderRadius,
          },
        },
      };
      this.edgeless.service.updateElement(note.id, props);
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

  pickColor = (event: PickColorEvent) => {
    if (event.type === 'pick') {
      this.notes.forEach(element => {
        const props = packColor('background', { ...event.detail });
        this.edgeless.service.updateElement(element.id, props);
      });
      return;
    }

    this.notes.forEach(ele =>
      ele[event.type === 'start' ? 'stash' : 'pop']('background')
    );
  };

  private get _advancedVisibilityEnabled() {
    return this.doc.awarenessStore.getFlag('enable_advanced_block_visibility');
  }

  private get doc() {
    return this.edgeless.doc;
  }

  private _getScaleLabel(scale: number) {
    return Math.round(scale * 100) + '%';
  }

  private _handleNoteSlicerButtonClick() {
    const surfaceService = this.edgeless.service;
    if (!surfaceService) return;

    this.edgeless.slots.toggleNoteSlicer.emit();
  }

  private _setBackground(background: string) {
    this.notes.forEach(element => {
      this.edgeless.service.updateElement(element.id, { background });
    });
  }

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

  private _setDisplayMode(note: NoteBlockModel, newMode: NoteDisplayMode) {
    const { displayMode: currentMode } = note;
    if (newMode === currentMode) {
      return;
    }

    this.edgeless.service.updateElement(note.id, { displayMode: newMode });

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

  private _setShadowType(shadowType: string) {
    this.notes.forEach(note => {
      const props = {
        edgeless: {
          style: {
            ...note.edgeless.style,
            shadowType,
          },
        },
      };
      this.edgeless.service.updateElement(note.id, props);
    });
  }

  private _setStrokeStyle(borderStyle: StrokeStyle) {
    this.notes.forEach(note => {
      const props = {
        edgeless: {
          style: {
            ...note.edgeless.style,
            borderStyle,
          },
        },
      };
      this.edgeless.service.updateElement(note.id, props);
    });
  }

  private _setStrokeWidth(borderSize: number) {
    this.notes.forEach(note => {
      const props = {
        edgeless: {
          style: {
            ...note.edgeless.style,
            borderSize,
          },
        },
      };
      this.edgeless.service.updateElement(note.id, props);
    });
  }

  private _setStyles({ type, value }: LineStyleEvent) {
    if (type === 'size') {
      this._setStrokeWidth(value);
      return;
    }
    if (type === 'lineStyle') {
      this._setStrokeStyle(value);
    }
  }

  override render() {
    const len = this.notes.length;
    const note = this.notes[0];
    const { edgeless, displayMode } = note;
    const { shadowType, borderRadius, borderSize, borderStyle } =
      edgeless.style;
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    const background =
      getMostCommonBackground(this.notes, colorScheme) ??
      DEFAULT_NOTE_BACKGROUND_COLOR;

    const { collapse } = edgeless;
    const scale = edgeless.scale ?? 1;
    const currentMode = DisplayModeMap[displayMode];
    const onlyOne = len === 1;
    const isDocOnly = displayMode === NoteDisplayMode.DocOnly;

    const buttons = [
      onlyOne && this._advancedVisibilityEnabled
        ? html`
            <span class="display-mode-button-label">Show in</span>
            <editor-menu-button
              .contentPadding=${'8px'}
              .button=${html`
                <editor-icon-button
                  aria-label="Mode"
                  .tooltip=${'Display mode'}
                  .justify=${'space-between'}
                  .labelHeight=${'20px'}
                >
                  <span class="label">${currentMode}</span>
                  ${SmallArrowDownIcon}
                </editor-icon-button>
              `}
            >
              <note-display-mode-panel
                .displayMode=${displayMode}
                .onSelect=${(newMode: NoteDisplayMode) =>
                  this._setDisplayMode(note, newMode)}
              >
              </note-display-mode-panel>
            </editor-menu-button>
          `
        : nothing,

      isDocOnly
        ? nothing
        : when(
            this.edgeless.doc.awarenessStore.getFlag('enable_color_picker'),
            () => {
              const { type, colors } = packColorsWithColorScheme(
                colorScheme,
                background,
                note.background
              );

              return html`
                <edgeless-color-picker-button
                  class="background"
                  .label=${'Background'}
                  .pick=${this.pickColor}
                  .color=${background}
                  .colorType=${type}
                  .colors=${colors}
                  .palettes=${NOTE_BACKGROUND_COLORS}
                >
                </edgeless-color-picker-button>
              `;
            },
            () => html`
              <editor-menu-button
                .contentPadding=${'8px'}
                .button=${html`
                  <editor-icon-button
                    aria-label="Background"
                    .tooltip=${'Background'}
                  >
                    <edgeless-color-button
                      .color=${background}
                    ></edgeless-color-button>
                  </editor-icon-button>
                `}
              >
                <edgeless-color-panel
                  .value=${background}
                  .options=${NOTE_BACKGROUND_COLORS}
                  @select=${(e: ColorEvent) => this._setBackground(e.detail)}
                >
                </edgeless-color-panel>
              </editor-menu-button>
            `
          ),

      isDocOnly
        ? nothing
        : html`
            <editor-menu-button
              .contentPadding=${'6px'}
              .button=${html`
                <editor-icon-button
                  aria-label="Shadow style"
                  .tooltip=${'Shadow style'}
                >
                  ${NoteShadowIcon}${SmallArrowDownIcon}
                </editor-icon-button>
              `}
            >
              <edgeless-note-shadow-panel
                .value=${shadowType}
                .background=${background}
                .onSelect=${(value: string) => this._setShadowType(value)}
              >
              </edgeless-note-shadow-panel>
            </editor-menu-button>

            <editor-menu-button
              .button=${html`
                <editor-icon-button
                  aria-label="Border style"
                  .tooltip=${'Border style'}
                >
                  ${LineStyleIcon}${SmallArrowDownIcon}
                </editor-icon-button>
              `}
            >
              <div data-orientation="horizontal">
                ${LineStylesPanel({
                  selectedLineSize: borderSize,
                  selectedLineStyle: borderStyle,
                  onClick: event => this._setStyles(event),
                })}
              </div>
            </editor-menu-button>

            <editor-menu-button
              ${ref(this._cornersPanelRef)}
              .contentPadding=${'8px'}
              .button=${html`
                <editor-icon-button aria-label="Corners" .tooltip=${'Corners'}>
                  ${NoteCornerIcon}${SmallArrowDownIcon}
                </editor-icon-button>
              `}
            >
              <edgeless-size-panel
                .size=${borderRadius}
                .sizeList=${SIZE_LIST}
                .minSize=${0}
                .onSelect=${(size: number) => this._setBorderRadius(size)}
                .onPopperCose=${() => this._cornersPanelRef.value?.hide()}
              >
              </edgeless-size-panel>
            </editor-menu-button>
          `,

      onlyOne && this._advancedVisibilityEnabled
        ? html`
            <editor-icon-button
              aria-label="Slicer"
              .tooltip=${getTooltipWithShortcut('Cutting mode', '-')}
              .active=${this.enableNoteSlicer}
              @click=${() => this._handleNoteSlicerButtonClick()}
            >
              ${ScissorsIcon}
            </editor-icon-button>
          `
        : nothing,

      onlyOne ? this.quickConnectButton : nothing,

      html`
        <editor-icon-button
          aria-label="Size"
          .tooltip=${collapse ? 'Auto height' : 'Customized height'}
          @click=${() => this._setCollapse()}
        >
          ${collapse ? ExpandIcon : ShrinkIcon}
        </editor-icon-button>

        <editor-menu-button
          ${ref(this._scalePanelRef)}
          .contentPadding=${'8px'}
          .button=${html`
            <editor-icon-button
              aria-label="Scale"
              .tooltip=${'Scale'}
              .justify=${'space-between'}
              .labelHeight=${'20px'}
              .iconContainerWidth=${'65px'}
            >
              <span class="label">${this._getScaleLabel(scale)}</span
              >${SmallArrowDownIcon}
            </editor-icon-button>
          `}
        >
          <edgeless-scale-panel
            .scale=${Math.round(scale * 100)}
            .onSelect=${(scale: number) => this._setNoteScale(scale)}
            .onPopperCose=${() => this._scalePanelRef.value?.hide()}
          ></edgeless-scale-panel>
        </editor-menu-button>
      `,
    ];

    return join(
      buttons.filter(button => button !== nothing),
      renderToolbarSeparator
    );
  }

  private accessor _cornersPanelRef: Ref<EditorMenuButton> = createRef();

  private accessor _scalePanelRef: Ref<EditorMenuButton> = createRef();

  @query('edgeless-color-picker-button.background')
  accessor backgroundButton!: EdgelessColorPickerButton;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor enableNoteSlicer!: boolean;

  @property({ attribute: false })
  accessor notes: NoteBlockModel[] = [];

  @property({ attribute: false })
  accessor quickConnectButton!: TemplateResult<1> | typeof nothing;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-note-button': EdgelessChangeNoteButton;
  }
}

export function renderNoteButton(
  edgeless: EdgelessRootBlockComponent,
  notes?: NoteBlockModel[],
  quickConnectButton?: TemplateResult<1>[]
) {
  if (!notes?.length) return nothing;

  return html`
    <edgeless-change-note-button
      .notes=${notes}
      .edgeless=${edgeless}
      .enableNoteSlicer=${false}
      .quickConnectButton=${quickConnectButton?.pop() ?? nothing}
    >
    </edgeless-change-note-button>
  `;
}
