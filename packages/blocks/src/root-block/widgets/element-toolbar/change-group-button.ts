import '../../edgeless/components/buttons/tool-icon-button.js';
import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { toast } from '../../../_common/components/toast.js';
import {
  NoteIcon,
  RenameIcon,
  UngroupButtonIcon,
} from '../../../_common/icons/index.js';
import { NoteDisplayMode } from '../../../_common/types.js';
import { matchFlavours } from '../../../_common/utils/model.js';
import type { GroupElementModel } from '../../../surface-block/index.js';
import {
  deserializeXYWH,
  serializeXYWH,
} from '../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { DEFAULT_NOTE_HEIGHT } from '../../edgeless/utils/consts.js';
import { mountGroupTitleEditor } from '../../edgeless/utils/text.js';

@customElement('edgeless-change-group-button')
export class EdgelessChangeGroupButton extends WithDisposable(LitElement) {
  static override styles = css`
    component-toolbar-menu-divider {
      height: 24px;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  groups!: GroupElementModel[];

  private _insertIntoPage() {
    if (!this.edgeless.doc.root) return;

    const rootModel = this.edgeless.doc.root;
    const notes = rootModel.children.filter(
      model =>
        matchFlavours(model, ['affine:note']) &&
        model.displayMode !== NoteDisplayMode.EdgelessOnly
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
    return html`
      ${groups.length === 1
        ? html` <edgeless-tool-icon-button
              .tooltip=${'Insert into Page'}
              @click=${this._insertIntoPage}
            >
              ${NoteIcon}
              <span style="margin-left: 2px;">Insert into Page</span>
            </edgeless-tool-icon-button>
            <component-toolbar-menu-divider></component-toolbar-menu-divider>
            <edgeless-tool-icon-button
              class=${'edgeless-component-toolbar-group-rename-button'}
              @click=${() => mountGroupTitleEditor(groups[0], this.edgeless)}
              .tooltip=${'Rename'}
            >
              ${RenameIcon}
            </edgeless-tool-icon-button>

            <component-toolbar-menu-divider
              style=${'margin: 0 8px'}
            ></component-toolbar-menu-divider>`
        : nothing}
      <edgeless-tool-icon-button
        class=${'edgeless-component-toolbar-ungroup-button'}
        @click=${() => {
          groups.forEach(group => this.edgeless.service.ungroup(group));
        }}
        .tooltip=${'Ungroup'}
      >
        ${UngroupButtonIcon}
      </edgeless-tool-icon-button>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.display = 'flex';
    this.style.alignItems = 'center';
    this.style.justifyContent = 'center';
  }

  protected override createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-group-button': EdgelessChangeGroupButton;
  }
}

export function renderGroupButton(
  edgeless: EdgelessRootBlockComponent,
  groups?: GroupElementModel[]
) {
  if (!groups?.length) return nothing;

  return html`<edgeless-change-group-button
    .edgeless=${edgeless}
    .groups=${groups}
  >
  </edgeless-change-group-button>`;
}
