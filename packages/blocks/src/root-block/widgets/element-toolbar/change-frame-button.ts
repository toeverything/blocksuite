import { WithDisposable } from '@blocksuite/block-std';
import { deserializeXYWH, serializeXYWH } from '@blocksuite/global/utils';
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import type { FrameBlockModel } from '../../../frame-block/index.js';
import type { ColorEvent } from '../../edgeless/components/panel/color-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import { toast } from '../../../_common/components/toast.js';
import '../../../_common/components/toolbar/icon-button.js';
import '../../../_common/components/toolbar/menu-button.js';
import '../../../_common/components/toolbar/separator.js';
import { renderToolbarSeparator } from '../../../_common/components/toolbar/separator.js';
import { NoteIcon, RenameIcon } from '../../../_common/icons/index.js';
import { NoteDisplayMode } from '../../../_common/types.js';
import { matchFlavours } from '../../../_common/utils/model.js';
import { DEFAULT_NOTE_HEIGHT } from '../../edgeless/utils/consts.js';
import { mountFrameTitleEditor } from '../../edgeless/utils/text.js';

const FRAME_BACKGROUND: CssVariableName[] = [
  '--affine-tag-gray',
  '--affine-tag-red',
  '--affine-tag-orange',
  '--affine-tag-yellow',
  '--affine-tag-green',
  '--affine-tag-teal',
  '--affine-tag-blue',
  '--affine-tag-purple',
  '--affine-tag-pink',
  '--affine-palette-transparent',
] as const;

@customElement('edgeless-change-frame-button')
export class EdgelessChangeFrameButton extends WithDisposable(LitElement) {
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

  private _setFrameBackground(color: CssVariableName) {
    this.frames.forEach(frame => {
      this.service.updateElement(frame.id, { background: color });
    });
  }

  protected override render() {
    const { frames } = this;
    const onlyOne = frames.length === 1;
    const background = frames[0].background;

    return join(
      [
        onlyOne
          ? html`
              <editor-icon-button
                arai-label=${'Insert into Page'}
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

        html`
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
              slot
              .value=${background}
              .options=${FRAME_BACKGROUND}
              @select=${(e: ColorEvent) => this._setFrameBackground(e.detail)}
            >
            </edgeless-color-panel>
          </editor-menu-button>
        `,
      ].filter(button => button !== nothing),
      renderToolbarSeparator
    );
  }

  get service() {
    return this.edgeless.service;
  }

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
