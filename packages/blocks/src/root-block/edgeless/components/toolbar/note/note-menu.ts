import '../../buttons/tool-icon-button.js';
import '../common/slide-menu.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { toggleEmbedCardCreateModal } from '../../../../../_common/components/embed-card/modal/index.js';
import { BookmarkIcon } from '../../../../../_common/icons/edgeless.js';
import { AttachmentIcon } from '../../../../../_common/icons/text.js';
import {
  type NoteChildrenFlavour,
  type NoteTool,
  openFileOrFiles,
} from '../../../../../_common/utils/index.js';
import { FigmaIcon } from '../../../../../embed-figma-block/styles.js';
import { GithubIcon } from '../../../../../embed-github-block/styles.js';
import { LoomIcon } from '../../../../../embed-loom-block/styles.js';
import { YoutubeIcon } from '../../../../../embed-youtube-block/styles.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
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
    .github-icon {
      color: var(--affine-black);
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  childFlavour!: NoteChildrenFlavour;

  @property({ attribute: false })
  childType!: string | null;

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

  override firstUpdated() {
    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(tool => {
        if (tool.type !== 'affine:note') return;
        this.childFlavour = tool.childFlavour;
        this.childType = tool.childType;
        this.tip = tool.tip;
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.disposables.dispose();
  }

  override render() {
    if (this.edgeless.edgelessTool.type !== 'affine:note') return nothing;

    const { childType } = this;

    return html`
      <edgeless-slide-menu .menuWidth=${NOTE_MENU_WIDTH}>
        <div class="menu-content">
          <div class="button-group-label">Blocks</div>
          <div class="button-group-container">
            ${repeat(
              NOTE_MENU_ITEMS,
              item => item.childFlavour,
              item => html`
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
              `
            )}

            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              .tooltip=${'Links'}
              @click=${() =>
                toggleEmbedCardCreateModal(
                  this.edgeless.host,
                  'Links',
                  'The added link will be displayed as a card view.',
                  {
                    mode: 'edgeless',
                  }
                )}
            >
              ${BookmarkIcon}
            </edgeless-tool-icon-button>

            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              .tooltip=${'File'}
              @click=${async () => {
                const file = await openFileOrFiles();
                if (!file) return;
                await this.edgeless.addAttachments([file]);
              }}
            >
              ${AttachmentIcon}
            </edgeless-tool-icon-button>

            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              .tooltip=${'YouTube'}
              @click=${() =>
                toggleEmbedCardCreateModal(
                  this.edgeless.host,
                  'YouTube',
                  'The added YouTube video link will be displayed as an embed view.',
                  {
                    mode: 'edgeless',
                  }
                )}
            >
              ${YoutubeIcon}
            </edgeless-tool-icon-button>

            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              .tooltip=${'Figma'}
              @click=${() =>
                toggleEmbedCardCreateModal(
                  this.edgeless.host,
                  'Figma',
                  'The added Figma link will be displayed as an embed view.',
                  {
                    mode: 'edgeless',
                  }
                )}
            >
              ${FigmaIcon}
            </edgeless-tool-icon-button>

            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              .tooltip=${'GitHub'}
              @click=${() =>
                toggleEmbedCardCreateModal(
                  this.edgeless.host,
                  'GitHub',
                  'The added GitHub issue or pull request link will be displayed as a card view.',
                  {
                    mode: 'edgeless',
                  }
                )}
            >
              ${GithubIcon}
            </edgeless-tool-icon-button>

            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              .tooltip=${'Loom'}
              @click=${() =>
                toggleEmbedCardCreateModal(
                  this.edgeless.host,
                  'Loom',
                  'The added Loom video link will be displayed as an embed view.',
                  {
                    mode: 'edgeless',
                  }
                )}
            >
              ${LoomIcon}
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
