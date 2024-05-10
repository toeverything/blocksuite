import './component-toolbar-menu-divider.js';
import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/panel/color-panel.js';
import '../../edgeless/components/panel/note-shadow-panel.js';
import '../../edgeless/components/panel/note-display-mode-panel.js';
import '../../edgeless/components/panel/scale-panel.js';
import '../../edgeless/components/panel/size-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

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
import { createButtonPopper } from '../../../_common/utils/button-popper.js';
import { matchFlavours } from '../../../_common/utils/model.js';
import { type NoteBlockModel } from '../../../note-block/note-model.js';
import { Bound, StrokeStyle } from '../../../surface-block/index.js';
import {
  type ColorEvent,
  ColorUnit,
} from '../../edgeless/components/panel/color-panel.js';
import {
  LineStylesPanel,
  type LineStylesPanelClickedButton,
  lineStylesPanelStyles,
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
  static override styles = [
    lineStylesPanelStyles,
    css`
      :host {
        display: flex;
        color: var(--affine-text-primary-color);
        fill: currentColor;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      .fill-color-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
      }

      .item {
        width: 40px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .item:hover {
        background-color: var(--affine-hover-color);
      }

      .display-mode-button-group {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px;
        font-size: var(--affine-font-xs);
        font-weight: 500;
        line-height: 20px;
      }

      .display-mode-button-label {
        white-space: nowrap;
      }

      .display-mode-button,
      .note-scale-button {
        display: flex;
        border-radius: 4px;
        background-color: var(--affine-hover-color);
        align-items: center;
        gap: 2px;
        padding: 2px;
      }

      .note-scale-button {
        font-size: var(--affine-font-sm);
        font-weight: 500;
        color: var(--affine-text-secondary-color);
        height: 26px;
      }

      .current-mode-label,
      .current-scale-label {
        display: flex;
        padding: 2px 0px 2px 4px;
        align-items: center;
      }

      edgeless-size-panel,
      edgeless-scale-panel {
        border-radius: 8px;
      }

      edgeless-color-panel {
        width: 168px;
        display: none;
        justify-content: center;
        align-items: center;
        background: var(--affine-background-overlay-panel-color);
        box-shadow: var(--affine-shadow-2);
        border-radius: 8px;
      }

      note-display-mode-panel,
      edgeless-note-shadow-panel,
      edgeless-size-panel,
      edgeless-scale-panel {
        display: none;
      }

      note-display-mode-panel[data-show],
      edgeless-note-shadow-panel[data-show],
      edgeless-color-panel[data-show],
      edgeless-size-panel[data-show],
      edgeless-scale-panel[data-show] {
        display: flex;
      }

      component-toolbar-menu-divider {
        width: 4px;
        height: 24px;
      }

      .line-style-panel {
        display: none;
        padding: 6px;
      }

      .line-style-panel component-toolbar-menu-divider {
        margin: 0 8px;
      }

      .line-style-panel[data-show] {
        display: flex;
      }
    `,
  ];

  @property({ attribute: false })
  notes: NoteBlockModel[] = [];

  @property({ attribute: false })
  enableNoteSlicer!: boolean;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @state()
  private _queryCache = false;

  @state()
  private _showFillColorPopper = false;
  @query('.fill-color-button')
  private _fillColorButton!: HTMLDivElement;
  @query('edgeless-color-panel')
  private _fillColorMenu!: HTMLDivElement;
  private _fillColorPopper: ReturnType<typeof createButtonPopper> | null = null;

  @state()
  private _showBorderStylePopper = false;
  @query('.border-style-button')
  private _borderStyleButton!: HTMLDivElement;
  @query('.line-style-panel')
  private _borderStylesPanel!: HTMLDivElement;
  private _borderStylePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showBorderRadiusPopper = false;
  @query('.border-radius-button')
  private _borderRadiusButton!: HTMLDivElement;
  @query('edgeless-size-panel')
  private _boderRadiusPanel!: HTMLDivElement;
  private _borderRadiusPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showShadowTypePopper = false;
  @query('.shadow-style-button')
  private _shadowTypeButton!: HTMLDivElement;
  @query('edgeless-note-shadow-panel')
  private _shadowTypesPanel!: HTMLDivElement;
  private _shadowTypePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showDisplayModePopper = false;
  @query('.display-mode-button-group')
  private _displayModeButtonGroup!: HTMLDivElement;
  @query('note-display-mode-panel')
  private _displayModePanel!: HTMLDivElement;
  private _displayModePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @state()
  private _showNoteScalePopper = false;
  @query('.note-scale-button')
  private _noteScaleButton!: HTMLDivElement;
  @query('edgeless-scale-panel')
  private _noteScalePanel!: HTMLDivElement;
  private _noteScalePopper: ReturnType<typeof createButtonPopper> | null = null;

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

    this._queryCache = !this._queryCache;
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

  private _setStyles({ type, value }: LineStylesPanelClickedButton) {
    if (type === 'size') {
      this._setStrokeWidth(value);
    } else if (type === 'lineStyle') {
      switch (value) {
        case 'solid': {
          this._setStrokeStyle(StrokeStyle.Solid);
          break;
        }
        case 'dash': {
          this._setStrokeStyle(StrokeStyle.Dashed);
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

  override updated(_changedProperties: PropertyValues) {
    const { _disposables } = this;
    if (_changedProperties.has('_queryCache')) {
      this._displayModePopper = createButtonPopper(
        this._displayModeButtonGroup,
        this._displayModePanel,
        ({ display }) => {
          this._showDisplayModePopper = display === 'show';
        },
        -154,
        90
      );
      _disposables.add(this._displayModePopper);

      this._fillColorPopper = createButtonPopper(
        this._fillColorButton,
        this._fillColorMenu,
        ({ display }) => {
          this._showFillColorPopper = display === 'show';
        }
      );
      this._disposables.add(this._fillColorPopper);

      this._shadowTypePopper = createButtonPopper(
        this._shadowTypeButton,
        this._shadowTypesPanel,
        ({ display }) => {
          this._showShadowTypePopper = display === 'show';
        }
      );
      _disposables.add(this._shadowTypePopper);

      this._borderStylePopper = createButtonPopper(
        this._borderStyleButton,
        this._borderStylesPanel,
        ({ display }) => {
          this._showBorderStylePopper = display === 'show';
        }
      );
      _disposables.add(this._borderStylePopper);

      this._borderRadiusPopper = createButtonPopper(
        this._borderRadiusButton,
        this._boderRadiusPanel,
        ({ display }) => {
          this._showBorderRadiusPopper = display === 'show';
        }
      );
      _disposables.add(this._borderRadiusPopper);

      this._noteScalePopper = createButtonPopper(
        this._noteScaleButton,
        this._noteScalePanel,
        ({ display }) => {
          this._showNoteScalePopper = display === 'show';
        }
      );
      _disposables.add(this._noteScalePopper);
    }
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
        ? html`<div class="display-mode-button-group">
              <span class="display-mode-button-label">Show in</span>
              <edgeless-tool-icon-button
                .tooltip=${this._showDisplayModePopper
                  ? nothing
                  : 'Display Mode'}
                .iconContainerPadding=${0}
                @click=${() => this._displayModePopper?.toggle()}
              >
                <div class="display-mode-button">
                  <span class="current-mode-label">${currentMode}</span>
                  ${SmallArrowDownIcon}
                </div>
              </edgeless-tool-icon-button>
            </div>
            <note-display-mode-panel
              .displayMode=${displayMode}
              .onSelect=${(newMode: NoteDisplayMode) => {
                this._setDisplayMode(note, newMode);
                this._displayModePopper?.hide();
              }}
            >
            </note-display-mode-panel>

            <component-toolbar-menu-divider
              .vertical=${true}
            ></component-toolbar-menu-divider>`
        : nothing}
      ${displayMode === NoteDisplayMode.DocOnly
        ? nothing
        : html`
            <edgeless-tool-icon-button
              class="fill-color-button"
              .tooltip=${this._showFillColorPopper ? nothing : 'Background'}
              .iconContainerPadding=${2}
              @click=${() => this._fillColorPopper?.toggle()}
            >
              <div class="fill-color-container">${ColorUnit(background)}</div>
            </edgeless-tool-icon-button>

            <edgeless-color-panel
              .value=${background}
              .options=${NOTE_BACKGROUND}
              @select=${(e: ColorEvent) => this._setBackground(e.detail)}
            >
            </edgeless-color-panel>

            <component-toolbar-menu-divider
              .vertical=${true}
            ></component-toolbar-menu-divider>

            <div class="item shadow-style-button">
              <edgeless-tool-icon-button
                .tooltip=${this._showShadowTypePopper
                  ? nothing
                  : 'Shadow Style'}
                .iconContainerPadding=${0}
                .hover=${false}
                @click=${() => this._shadowTypePopper?.toggle()}
              >
                ${NoteShadowIcon}${SmallArrowDownIcon}
              </edgeless-tool-icon-button>
            </div>

            <edgeless-note-shadow-panel
              .value=${shadowType}
              .background=${background}
              .onSelect=${(value: string) => this._setShadowType(value)}
            >
            </edgeless-note-shadow-panel>

            <div class="item border-style-button">
              <edgeless-tool-icon-button
                .tooltip=${this._showBorderStylePopper
                  ? nothing
                  : 'Border Style'}
                .iconContainerPadding=${0}
                .hover=${false}
                @click=${() => this._borderStylePopper?.toggle()}
              >
                ${LineStyleIcon}${SmallArrowDownIcon}
              </edgeless-tool-icon-button>
            </div>
            ${LineStylesPanel({
              selectedLineSize: borderSize,
              selectedLineStyle: borderStyle,
              onClick: event => {
                this._setStyles(event);
              },
            })}

            <div class="item border-radius-button">
              <edgeless-tool-icon-button
                .tooltip=${this._showBorderRadiusPopper ? nothing : 'Corners'}
                .iconContainerPadding=${0}
                .hover=${false}
                @click=${() => this._borderRadiusPopper?.toggle()}
              >
                ${NoteCornerIcon}${SmallArrowDownIcon}
              </edgeless-tool-icon-button>
            </div>
            <edgeless-size-panel
              .size=${borderRadius}
              .labels=${['None', 'Small', 'Medium', 'Large', 'Huge']}
              .sizes=${[0, 8, 16, 24, 32]}
              .minSize=${0}
              .onSelect=${(size: number) => {
                this._setBorderRadius(size);
              }}
              .onPopperCose=${() => this._borderRadiusPopper?.hide()}
            ></edgeless-size-panel>
            <component-toolbar-menu-divider
              .vertical=${true}
            ></component-toolbar-menu-divider>
          `}

      <edgeless-tool-icon-button
        class="edgeless-auto-height-button"
        .tooltip=${collapse ? 'Auto Height' : 'Customized Height'}
        .iconContainerPadding=${2}
        @click=${() => {
          this._setCollapse();
        }}
      >
        ${collapse ? ExpandIcon : ShrinkIcon}
      </edgeless-tool-icon-button>

      <edgeless-tool-icon-button
        .tooltip=${this._showNoteScalePopper ? nothing : 'Scale'}
        .iconContainerPadding=${0}
        @click=${() => this._noteScalePopper?.toggle()}
      >
        <div class="note-scale-button">
          <span class="current-scale-label">${this._getScaleLabel(scale)}</span>
          ${SmallArrowDownIcon}
        </div>
      </edgeless-tool-icon-button>

      <edgeless-scale-panel
        .scale=${Math.round(scale * 100)}
        .scales=${[50, 100, 200]}
        .minSize=${0}
        .onSelect=${(scale: number) => {
          this._setNoteScale(scale);
        }}
        .onPopperCose=${() => this._noteScalePopper?.hide()}
      ></edgeless-scale-panel>

      ${length === 1
        ? html`<component-toolbar-menu-divider
              .vertical=${true}
            ></component-toolbar-menu-divider>
            <edgeless-tool-icon-button
              class="edgeless-note-slicer-button"
              .tooltip=${getTooltipWithShortcut('Cutting Mode', '-')}
              .iconContainerPadding=${2}
              .active=${this.enableNoteSlicer}
              @click=${this._handleNoteSlicerButtonClick}
            >
              ${ScissorsIcon}
            </edgeless-tool-icon-button>`
        : nothing}
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
  return notes && notes.length >= 0
    ? html`<edgeless-change-note-button
        .notes=${notes}
        .edgeless=${edgeless}
        .enableNoteSlicer=${false}
      >
      </edgeless-change-note-button>`
    : nothing;
}
