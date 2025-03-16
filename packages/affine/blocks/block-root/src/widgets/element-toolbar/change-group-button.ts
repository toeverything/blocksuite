import { toast } from '@blocksuite/affine-components/toast';
import { renderToolbarSeparator } from '@blocksuite/affine-components/toolbar';
import type { GroupElementModel } from '@blocksuite/affine-model';
import {
  DEFAULT_NOTE_HEIGHT,
  NoteBlockModel,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import { matchModels } from '@blocksuite/affine-shared/utils';
import { deserializeXYWH, serializeXYWH } from '@blocksuite/global/gfx';
import { WithDisposable } from '@blocksuite/global/lit';
import { EditIcon, PageIcon, UngroupIcon } from '@blocksuite/icons/lit';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { mountGroupTitleEditor } from '../../edgeless/utils/text.js';

export class EdgelessChangeGroupButton extends WithDisposable(LitElement) {
  private _insertIntoPage() {
    if (!this.edgeless.doc.root) return;

    const rootModel = this.edgeless.doc.root;
    const notes = rootModel.children.filter(
      model =>
        matchModels(model, [NoteBlockModel]) &&
        model.props.displayMode !== NoteDisplayMode.EdgelessOnly
    );
    const lastNote = notes[notes.length - 1];
    const referenceGroup = this.groups[0];

    let targetParent = lastNote?.id;

    if (!lastNote) {
      const targetXYWH = deserializeXYWH(referenceGroup.xywh);

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
        reference: this.groups[0].id,
        refFlavour: 'group',
      },
      targetParent
    );

    toast(this.edgeless.host, 'Group has been inserted into page');
  }

  protected override render() {
    const { groups } = this;
    const onlyOne = groups.length === 1;

    return join(
      [
        onlyOne
          ? html`
              <editor-icon-button
                aria-label="Insert into Page"
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
                @click=${() => mountGroupTitleEditor(groups[0], this.edgeless)}
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
            @click=${() =>
              groups.forEach(group => this.edgeless.service.ungroup(group))}
          >
            ${UngroupIcon()}
          </editor-icon-button>
        `,
      ].filter(button => button !== nothing),
      renderToolbarSeparator
    );
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor groups!: GroupElementModel[];
}

export function renderGroupButton(
  edgeless: EdgelessRootBlockComponent,
  groups?: GroupElementModel[]
) {
  if (!groups?.length) return nothing;

  return html`
    <edgeless-change-group-button .edgeless=${edgeless} .groups=${groups}>
    </edgeless-change-group-button>
  `;
}
