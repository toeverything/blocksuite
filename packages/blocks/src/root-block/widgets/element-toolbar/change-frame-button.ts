import { NoteIcon, RenameIcon } from '@blocksuite/affine-components/icons';
import { toast } from '@blocksuite/affine-components/toast';
import { renderToolbarSeparator } from '@blocksuite/affine-components/toolbar';
import {
  type ColorScheme,
  FRAME_BACKGROUND_COLORS,
  type FrameBlockModel,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import {
  countBy,
  deserializeXYWH,
  maxBy,
  serializeXYWH,
  WithDisposable,
} from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { when } from 'lit/directives/when.js';

import type { EdgelessColorPickerButton } from '../../edgeless/components/color-picker/button.js';
import type { PickColorEvent } from '../../edgeless/components/color-picker/types.js';
import type { ColorEvent } from '../../edgeless/components/panel/color-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import {
  packColor,
  packColorsWithColorScheme,
} from '../../edgeless/components/color-picker/utils.js';
import { DEFAULT_NOTE_HEIGHT } from '../../edgeless/utils/consts.js';
import { mountFrameTitleEditor } from '../../edgeless/utils/text.js';

function getMostCommonColor(
  elements: FrameBlockModel[],
  colorScheme: ColorScheme
): string | null {
  const colors = countBy(elements, (ele: FrameBlockModel) => {
    return typeof ele.background === 'object'
      ? (ele.background[colorScheme] ?? ele.background.normal ?? null)
      : ele.background;
  });
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as string) : null;
}

export class EdgelessChangeFrameButton extends WithDisposable(LitElement) {
  pickColor = (event: PickColorEvent) => {
    if (event.type === 'pick') {
      this.frames.forEach(ele =>
        this.service.updateElement(
          ele.id,
          packColor('background', { ...event.detail })
        )
      );
      return;
    }

    this.frames.forEach(ele =>
      ele[event.type === 'start' ? 'stash' : 'pop']('background')
    );
  };

  get service() {
    return this.edgeless.service;
  }

  private _insertIntoPage() {
    if (!this.edgeless.doc.root) return;

    const rootModel = this.edgeless.doc.root;
    const notes = rootModel.children.filter(
      model =>
        matchFlavours(model, ['affine:note']) &&
        model.displayMode !== NoteDisplayMode.EdgelessOnly
    );
    const lastNote = notes[notes.length - 1];
    const referenceFrame = this.frames[0];

    let targetParent = lastNote?.id;

    if (!lastNote) {
      const targetXYWH = deserializeXYWH(referenceFrame.xywh);

      targetXYWH[1] = targetXYWH[1] + targetXYWH[3];
      targetXYWH[3] = DEFAULT_NOTE_HEIGHT;

      const newAddedNote = this.edgeless.doc.addBlock(
        'affine:note',
        {
          xywh: serializeXYWH(...targetXYWH),
        },
        rootModel.id
      );

      targetParent = newAddedNote;
    }

    this.edgeless.doc.addBlock(
      'affine:surface-ref',
      {
        reference: this.frames[0].id,
        refFlavour: 'affine:frame',
      },
      targetParent
    );

    toast(this.edgeless.host, 'Frame has been inserted into doc');
  }

  private _setFrameBackground(color: string) {
    this.frames.forEach(frame => {
      this.service.updateElement(frame.id, { background: color });
    });
  }

  protected override render() {
    const { frames } = this;
    const len = frames.length;
    const onlyOne = len === 1;
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    const background =
      getMostCommonColor(frames, colorScheme) ?? '--affine-palette-transparent';

    return join(
      [
        onlyOne
          ? html`
              <editor-icon-button
                aria-label=${'Insert into Page'}
                .tooltip=${'Insert into Page'}
                .iconSize=${'20px'}
                .labelHeight=${'20px'}
                @click=${this._insertIntoPage}
              >
                ${NoteIcon}
                <span class="label">Insert into Page</span>
              </editor-icon-button>
            `
          : nothing,

        onlyOne
          ? html`
              <editor-icon-button
                aria-label="Rename"
                .tooltip=${'Rename'}
                .iconSize=${'20px'}
                @click=${() =>
                  mountFrameTitleEditor(this.frames[0], this.edgeless)}
              >
                ${RenameIcon}
              </editor-icon-button>
            `
          : nothing,

        when(
          this.edgeless.doc.awarenessStore.getFlag('enable_color_picker'),
          () => {
            const { type, colors } = packColorsWithColorScheme(
              colorScheme,
              background,
              this.frames[0].background
            );

            return html`
              <edgeless-color-picker-button
                class="background"
                .label=${'Background'}
                .pick=${this.pickColor}
                .color=${background}
                .colors=${colors}
                .colorType=${type}
                .palettes=${FRAME_BACKGROUND_COLORS}
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
                .options=${FRAME_BACKGROUND_COLORS}
                @select=${(e: ColorEvent) => this._setFrameBackground(e.detail)}
              >
              </edgeless-color-panel>
            </editor-menu-button>
          `
        ),
      ].filter(button => button !== nothing),
      renderToolbarSeparator
    );
  }

  @query('edgeless-color-picker-button.background')
  accessor backgroundButton!: EdgelessColorPickerButton;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor frames: FrameBlockModel[] = [];
}

export function renderFrameButton(
  edgeless: EdgelessRootBlockComponent,
  frames?: FrameBlockModel[]
) {
  if (!frames?.length) return nothing;

  return html`
    <edgeless-change-frame-button
      .edgeless=${edgeless}
      .frames=${frames}
    ></edgeless-change-frame-button>
  `;
}
