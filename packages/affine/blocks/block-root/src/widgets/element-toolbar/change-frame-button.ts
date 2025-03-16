import { EdgelessFrameManagerIdentifier } from '@blocksuite/affine-block-frame';
import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import type {
  EdgelessColorPickerButton,
  PickColorEvent,
} from '@blocksuite/affine-components/color-picker';
import { packColor } from '@blocksuite/affine-components/color-picker';
import { toast } from '@blocksuite/affine-components/toast';
import { renderToolbarSeparator } from '@blocksuite/affine-components/toolbar';
import {
  type ColorScheme,
  DEFAULT_NOTE_HEIGHT,
  type FrameBlockModel,
  NoteBlockModel,
  NoteDisplayMode,
  resolveColor,
} from '@blocksuite/affine-model';
import { FeatureFlagService } from '@blocksuite/affine-shared/services';
import { matchModels } from '@blocksuite/affine-shared/utils';
import { deserializeXYWH, serializeXYWH } from '@blocksuite/global/gfx';
import { WithDisposable } from '@blocksuite/global/lit';
import { EditIcon, PageIcon, UngroupIcon } from '@blocksuite/icons/lit';
import { html, LitElement, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import countBy from 'lodash-es/countBy';
import maxBy from 'lodash-es/maxBy';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { mountFrameTitleEditor } from '../../edgeless/utils/text.js';

function getMostCommonColor(
  elements: FrameBlockModel[],
  colorScheme: ColorScheme
): string {
  const colors = countBy(elements, (ele: FrameBlockModel) =>
    resolveColor(ele.props.background, colorScheme)
  );
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as string) : 'transparent';
}

export class EdgelessChangeFrameButton extends WithDisposable(LitElement) {
  get crud() {
    return this.edgeless.std.get(EdgelessCRUDIdentifier);
  }

  pickColor = (e: PickColorEvent) => {
    const field = 'background';

    if (e.type === 'pick') {
      const color = e.detail.value;
      this.frames.forEach(ele => {
        const props = packColor(field, color);
        this.crud.updateElement(ele.id, props);
      });
      return;
    }

    this.frames.forEach(ele =>
      ele[e.type === 'start' ? 'stash' : 'pop'](field)
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
        matchModels(model, [NoteBlockModel]) &&
        model.props.displayMode !== NoteDisplayMode.EdgelessOnly
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

  protected override render() {
    const { frames } = this;
    const len = frames.length;
    const onlyOne = len === 1;
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    const background = getMostCommonColor(frames, colorScheme);
    const enableCustomColor = this.edgeless.doc
      .get(FeatureFlagService)
      .getFlag('enable_color_picker');

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
                ${PageIcon()}
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
                ${EditIcon()}
              </editor-icon-button>
            `
          : nothing,

        html`
          <editor-icon-button
            aria-label="Ungroup"
            .tooltip=${'Ungroup'}
            .iconSize=${'20px'}
            @click=${() => {
              this.edgeless.doc.captureSync();
              const frameMgr = this.edgeless.std.get(
                EdgelessFrameManagerIdentifier
              );
              frames.forEach(frame =>
                frameMgr.removeAllChildrenFromFrame(frame)
              );
              frames.forEach(frame => {
                this.edgeless.service.removeElement(frame);
              });
              this.edgeless.service.selection.clear();
            }}
          >
            ${UngroupIcon()}
          </editor-icon-button>
        `,

        html`
          <edgeless-color-picker-button
            class="background"
            .label="${'Background'}"
            .pick=${this.pickColor}
            .color=${background}
            .theme=${colorScheme}
            .originalColor=${this.frames[0].props.background}
            .enableCustomColor=${enableCustomColor}
          >
          </edgeless-color-picker-button>
        `,
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
