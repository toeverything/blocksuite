import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { toggleLinkCardCreateModal } from '../../../../../_common/components/link-card/modal/index.js';
import {
  LINK_CARD_HEIGHT,
  LINK_CARD_WIDTH,
} from '../../../../../_common/consts.js';
import { BookmarkIcon } from '../../../../../_common/icons/edgeless.js';
import {
  type NoteChildrenFlavour,
  type NoteTool,
} from '../../../../../_common/utils/index.js';
import { Bound } from '../../../../../surface-block/utils/bound.js';
import { Vec } from '../../../../../surface-block/utils/vec.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { NOTE_MENU_ITEMS, NOTE_MENU_WIDTH } from './note-menu-config.js';

@customElement('edgeless-note-menu')
export class EdgelessNoteMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      display: flex;
      z-index: -1;
    }
    .menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .button-group-label {
      font-family: 'Inter';
      font-size: 12px;
      font-weight: 400;
      font-style: normal;
      display: flex;
      text-align: center;
      color: var(--light-text-color-text-secondary-color, #8e8d91);
      width: 38px;
      height: 20px;
      line-height: 20px;
      margin-right: 16px;
    }
    .button-group-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 14px;
      fill: var(--affine-icon-color);
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  childFlavour!: NoteChildrenFlavour;

  @property({ attribute: false })
  childType!: string;

  @property({ attribute: false })
  tip!: string;

  @property({ attribute: false })
  onChange!: (
    props: Partial<{
      childFlavour: NoteTool['childFlavour'];
      childType: string | null;
      tip: string;
    }>
  ) => void;

  override render() {
    if (this.edgeless.edgelessTool.type !== 'affine:note') return nothing;

    const { childType } = this;

    return html`
      <edgeless-slide-menu .menuWidth=${NOTE_MENU_WIDTH}>
        <div class="menu-content">
          <div class="button-group-label">Blocks</div>
          <div class="button-group-container">
            ${NOTE_MENU_ITEMS.map(item => {
              return html`
                <edgeless-tool-icon-button
                  .active=${childType === item.childType}
                  .activeMode=${'background'}
                  .iconContainerPadding=${2}
                  .tooltip=${item.tooltip}
                  @click=${() =>
                    this.onChange({
                      childFlavour: item.childFlavour,
                      childType: item.childType,
                      tip: item.tooltip,
                    })}
                >
                  ${item.icon}
                </edgeless-tool-icon-button>
              `;
            })}
            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              .tooltip=${'Bookmark'}
              @click=${async () => {
                const url = await toggleLinkCardCreateModal(this.edgeless.host);
                if (!url) return;

                const center = Vec.toVec(this.edgeless.surface.viewport.center);
                this.edgeless.surface.addElement(
                  'affine:bookmark',
                  {
                    url,
                    xywh: Bound.fromCenter(
                      center,
                      LINK_CARD_WIDTH.horizontal,
                      LINK_CARD_HEIGHT.horizontal
                    ).serialize(),
                  },
                  this.edgeless.surface.model
                );

                this.edgeless.tools.setEdgelessTool({
                  type: 'default',
                });
              }}
            >
              ${BookmarkIcon}
            </edgeless-tool-icon-button>
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-menu': EdgelessNoteMenu;
  }
}
