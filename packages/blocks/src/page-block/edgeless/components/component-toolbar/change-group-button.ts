import '../buttons/tool-icon-button.js';
import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { toast } from '../../../../_common/components/toast.js';
import {
  NoteIcon,
  RenameIcon,
  UngroupButtonIcon,
} from '../../../../_common/icons/index.js';
import {
  deserializeXYWH,
  type GroupElement,
  serializeXYWH,
} from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import { DEFAULT_NOTE_HEIGHT } from '../../utils/consts.js';
import { mountGroupTitleEditor } from '../../utils/text.js';

@customElement('edgeless-change-group-button')
export class EdgelessChangeGroupButton extends WithDisposable(LitElement) {
  static override styles = css`
    component-toolbar-menu-divider {
      height: 24px;
    }
  `;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  groups!: GroupElement[];

  private _insertIntoPage() {
    if (!this.surface.page.root) return;

    const root = this.surface.page.root;
    const pageChildren = root.children;
    const last = pageChildren[pageChildren.length - 1];
    const referenceGroup = this.groups[0];

    let targetParent = last?.id;

    if (last?.flavour !== 'affine:note') {
      const targetXYWH = deserializeXYWH(referenceGroup.xywh);

      targetXYWH[1] = targetXYWH[1] + targetXYWH[3];
      targetXYWH[3] = DEFAULT_NOTE_HEIGHT;

      const newAddedNote = this.surface.page.addBlock(
        'affine:note',
        {
          xywh: serializeXYWH(...targetXYWH),
        },
        root.id
      );

      targetParent = newAddedNote;
    }

    this.surface.page.addBlock(
      'affine:surface-ref',
      {
        reference: this.groups[0].id,
        refFlavour: 'group',
      },
      targetParent
    );

    toast('Group has been inserted into page');
  }

  protected override render() {
    const { groups } = this;
    return html`
      ${groups.length === 1
        ? html` <edgeless-tool-icon-button
              .tooltip=${'Insert into Page'}
              .tipPosition=${'bottom'}
              @click=${this._insertIntoPage}
            >
              ${NoteIcon}
              <span style="margin-left: 2px;">Insert into Page</span>
            </edgeless-tool-icon-button>
            <component-toolbar-menu-divider></component-toolbar-menu-divider>
            <edgeless-tool-icon-button
              class=${'edgeless-component-toolbar-group-rename-button'}
              @click=${() =>
                mountGroupTitleEditor(groups[0], this.surface.edgeless)}
              .tooltip=${'Rename'}
              .tipPosition=${'bottom'}
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
          groups.forEach(group => this.surface.group.ungroup(group));
        }}
        .tooltip=${'Ungroup'}
        .tipPosition=${'bottom'}
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
