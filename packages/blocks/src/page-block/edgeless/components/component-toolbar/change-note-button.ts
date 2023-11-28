import '../buttons/tool-icon-button.js';
import '../toolbar/shape/shape-menu.js';
import '../panel/color-panel.js';
import './component-toolbar-menu-divider.js';
import '../panel/note-shadow-panel.js';

import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  ExpandIcon,
  HiddenIcon,
  LineStyleIcon,
  NoteCornerIcon,
  NoteShadowIcon,
  NoteSmallIcon,
  ShrinkIcon,
  SmallArrowDownIcon,
} from '../../../../_common/icons/index.js';
import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import { matchFlavours } from '../../../../_common/utils/model.js';
import { type NoteBlockModel } from '../../../../note-block/note-model.js';
import { Bound, StrokeStyle } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import { type ColorEvent, ColorUnit } from '../panel/color-panel.js';
import {
  LineStylesPanel,
  type LineStylesPanelClickedButton,
  lineStylesPanelStyles,
} from '../panel/line-styles-panel.js';
import { createButtonPopper } from '../utils.js';

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

      .hidden-status {
        font-size: 12px;
        color: var(--affine-text-secondary-color);
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        cursor: pointer;
        width: 151px;
      }

      .hidden-status:hover {
        background: var(--affine-hover-color);
        border-radius: 4px;
      }

      .hidden-status .unhover {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 4px;
      }

      .hidden-status:hover .unhover {
        display: none;
      }

      .hidden-status .hover {
        display: none;
      }

      .hidden-status:hover .hover {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 4px;
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

      edgeless-size-panel {
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

      edgeless-color-panel[data-show] {
        display: flex;
      }
      edgeless-note-shadow-panel,
      edgeless-size-panel {
        display: none;
      }

      edgeless-note-shadow-panel[data-show],
      edgeless-size-panel[data-show] {
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
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  @state()
  private _queryCache = false;

  @state()
  private _showPopper = false;

  @query('.fill-color-button')
  private _fillColorButton!: HTMLDivElement;
  @query('edgeless-color-panel')
  private _fillColorMenu!: HTMLDivElement;
  private _fillColorPopper: ReturnType<typeof createButtonPopper> | null = null;

  @query('.border-style-button')
  private _borderStyleButton!: HTMLDivElement;
  @query('.line-style-panel')
  private _borderStylesPanel!: HTMLDivElement;
  private _borderStylePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @query('.border-radius-button')
  private _borderRadiusButton!: HTMLDivElement;
  @query('edgeless-size-panel')
  private _boderRadiusPanel!: HTMLDivElement;
  private _borderRadiusPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  @query('.shadow-style-button')
  private _shadowTypeButton!: HTMLDivElement;
  @query('edgeless-note-shadow-panel')
  private _shadowTypesPanel!: HTMLDivElement;
  private _shadowTypePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private get page() {
    return this.surface.page;
  }

  private _setBackground(color: CssVariableName) {
    this.notes.forEach(note => {
      this.page.updateBlock(note, { background: color });
    });
  }

  private _setShadowType(shadowType: string) {
    this.notes.forEach(note => {
      this.page.updateBlock(note, () => {
        note.edgeless.style.shadowType = shadowType;
      });
    });
  }

  private _setNoteHidden(note: NoteBlockModel, hidden: boolean) {
    note = this.surface.unwrap(note);
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
    this._queryCache = !this._queryCache;
  }

  private _setStrokeWidth(borderSize: number) {
    this.notes.forEach(note => {
      this.page.updateBlock(note, () => {
        note.edgeless.style.borderSize = borderSize;
      });
    });
  }

  private _setStrokeStyle(borderStyle: StrokeStyle) {
    this.notes.forEach(note => {
      this.page.updateBlock(note, () => {
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
      this.page.updateBlock(note, () => {
        note.edgeless.style.borderRadius = size;
      });
    });
  };

  private _setCollapse() {
    this.notes.forEach(note => {
      const { collapse, collapsedHeight } = note.edgeless;

      const bound = Bound.deserialize(note.xywh);
      if (collapse) {
        this.page.updateBlock(note, () => {
          note.edgeless.collapsedHeight = bound.h;
          note.edgeless.collapse = false;
        });
      } else {
        if (collapsedHeight) {
          bound.h = collapsedHeight;
        }
        this.page.updateBlock(note, () => {
          note.edgeless.collapse = true;
          note.xywh = bound.serialize();
        });
      }
    });
    this.requestUpdate();
  }

  override updated(_changedProperties: PropertyValues) {
    const { _disposables } = this;
    if (_changedProperties.has('_queryCache')) {
      this._fillColorPopper = createButtonPopper(
        this._fillColorButton,
        this._fillColorMenu,
        ({ display }) => (this._showPopper = display === 'show')
      );

      this._disposables.add(this._fillColorPopper);

      this._shadowTypePopper = createButtonPopper(
        this._shadowTypeButton,
        this._shadowTypesPanel,
        ({ display }) => {
          this._showPopper = display === 'show';
        }
      );
      _disposables.add(this._shadowTypePopper);

      this._borderStylePopper = createButtonPopper(
        this._borderStyleButton,
        this._borderStylesPanel,
        ({ display }) => {
          this._showPopper = display === 'show';
        }
      );
      _disposables.add(this._borderStylePopper);

      this._borderRadiusPopper = createButtonPopper(
        this._borderRadiusButton,
        this._boderRadiusPanel,
        ({ display }) => {
          this._showPopper = display === 'show';
        }
      );
      _disposables.add(this._borderRadiusPopper);
    }
  }

  override render() {
    if (this.notes.length !== 1) return nothing;
    const note = this.notes[0];
    const enableIndex = this.page.awarenessStore.getFlag('enable_note_index');
    const { hidden, background, edgeless } = note;
    const { shadowType, borderRadius, borderSize, borderStyle } =
      edgeless.style;

    const { collapse } = edgeless;

    return html`
      ${enableIndex
        ? html`<div
            class="hidden-status"
            @click=${() => this._setNoteHidden(note, !hidden)}
          >
            ${hidden
              ? html`<div class="unhover">
                    ${HiddenIcon} Hidden In Page Mode
                  </div>
                  <div class="hover">${NoteSmallIcon} Show In Page Mode</div>
                  <affine-tooltip
                    >Allow this note show in both page and edgeless
                    mode</affine-tooltip
                  >`
              : html`<div class="unhover">
                    ${NoteSmallIcon} Shown In Page Mode
                  </div>
                  <div class="hover">${HiddenIcon} Hide In Page Mode</div>
                  <affine-tooltip
                    >By Clicking it, the note will only appear in this board,
                    but not in page mode</affine-tooltip
                  > `}
          </div>`
        : nothing}

      <component-toolbar-menu-divider
        .vertical=${true}
      ></component-toolbar-menu-divider>
      ${hidden
        ? nothing
        : html`
            <edgeless-tool-icon-button
              class="fill-color-button"
              .tooltip=${this._showPopper ? '' : 'Background'}
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
                .tooltip=${'Shadow Style'}
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
                .tooltip=${this._showPopper ? '' : 'Border Style'}
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
                .tooltip=${'Corners'}
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
        .tooltip=${collapse ? 'Auto Size' : 'Customized Size'}
        .iconContainerPadding=${2}
        @click=${() => {
          this._setCollapse();
        }}
      >
        ${collapse ? ExpandIcon : ShrinkIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-note-button': EdgelessChangeNoteButton;
  }
}
