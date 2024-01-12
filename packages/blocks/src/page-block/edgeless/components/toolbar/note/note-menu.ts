import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { toggleEmbedCardCreateModal } from '../../../../../_common/components/embed-card/modal/index.js';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../../../../_common/consts.js';
import { BookmarkIcon } from '../../../../../_common/icons/edgeless.js';
import {
  type NoteChildrenFlavour,
  type NoteTool,
} from '../../../../../_common/utils/index.js';
import { githubUrlRegex } from '../../../../../embed-github-block/embed-github-model.js';
import { GithubIcon } from '../../../../../embed-github-block/styles.js';
import { youtubeUrlRegex } from '../../../../../embed-youtube-block/embed-youtube-model.js';
import { YoutubeIcon } from '../../../../../embed-youtube-block/styles.js';
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
              .tooltip=${'Link'}
              @click=${async () => {
                const url = await toggleEmbedCardCreateModal(
                  this.edgeless.host,
                  'Link',
                  'The added link will be displayed as a card view.'
                );
                if (!url) return;

                const center = Vec.toVec(this.edgeless.surface.viewport.center);
                this.edgeless.surface.addElement(
                  'affine:bookmark',
                  {
                    url,
                    xywh: Bound.fromCenter(
                      center,
                      EMBED_CARD_WIDTH.vertical,
                      EMBED_CARD_HEIGHT.vertical
                    ).serialize(),
                    style: 'vertical',
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
            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              .tooltip=${'YouTube'}
              @click=${async () => {
                const url = await toggleEmbedCardCreateModal(
                  this.edgeless.host,
                  'YouTube',
                  'The added YouTube video link will be displayed as an embed view.',
                  youtubeUrlRegex
                );
                if (!url) return;

                const center = Vec.toVec(this.edgeless.surface.viewport.center);
                this.edgeless.surface.addElement(
                  'affine:embed-youtube',
                  {
                    url,
                    xywh: Bound.fromCenter(
                      center,
                      EMBED_CARD_WIDTH.video,
                      EMBED_CARD_HEIGHT.video
                    ).serialize(),
                    style: 'video',
                  },
                  this.edgeless.surface.model
                );

                this.edgeless.tools.setEdgelessTool({
                  type: 'default',
                });
              }}
            >
              ${YoutubeIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              .tooltip=${'GitHub'}
              @click=${async () => {
                const url = await toggleEmbedCardCreateModal(
                  this.edgeless.host,
                  'GitHub',
                  'The added GitHub issue or pull request link will be displayed as a card view.',
                  githubUrlRegex
                );
                if (!url) return;

                const center = Vec.toVec(this.edgeless.surface.viewport.center);
                this.edgeless.surface.addElement(
                  'affine:embed-github',
                  {
                    url,
                    xywh: Bound.fromCenter(
                      center,
                      EMBED_CARD_WIDTH.vertical,
                      EMBED_CARD_HEIGHT.vertical
                    ).serialize(),
                    style: 'vertical',
                  },
                  this.edgeless.surface.model
                );

                this.edgeless.tools.setEdgelessTool({
                  type: 'default',
                });
              }}
            >
              ${GithubIcon}
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
