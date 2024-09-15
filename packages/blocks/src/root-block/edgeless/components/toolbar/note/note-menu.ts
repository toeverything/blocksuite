import { AttachmentIcon, LinkIcon } from '@blocksuite/affine-components/icons';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { NoteTool } from '../../../tools/note-tool.js';
import type { EdgelessTool } from '../../../types.js';

import {
  getImageFilesFromLocal,
  type NoteChildrenFlavour,
  openFileOrFiles,
} from '../../../../../_common/utils/index.js';
import { ImageIcon } from '../../../../../image-block/styles.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import { NOTE_MENU_ITEMS } from './note-menu-config.js';

export class EdgelessNoteMenu extends EdgelessToolbarToolMixin(LitElement) {
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
    .button-group-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 14px;
      fill: var(--affine-icon-color);
    }
    .button-group-container svg {
      width: 20px;
      height: 20px;
    }
    .divider {
      width: 1px;
      height: 24px;
      background: var(--affine-border-color);
      transform: scaleX(0.5);
      margin: 0 14px;
    }
  `;

  override type: EdgelessTool['type'] = 'affine:note';

  private async _addImages() {
    this._imageLoading = true;
    const imageFiles = await getImageFilesFromLocal();
    const ids = await this.edgeless.addImages(imageFiles);
    this._imageLoading = false;
    this.edgeless.service.tool.setEdgelessTool(
      { type: 'default' },
      { elements: ids, editing: false }
    );
  }

  private _onHandleLinkButtonClick() {
    const { insertedLinkType } = this.edgeless.service.std.command.exec(
      'insertLinkByQuickSearch'
    );

    insertedLinkType
      ?.then(type => {
        const flavour = type?.flavour;
        if (!flavour) return;

        this.edgeless.std
          .getOptional(TelemetryProvider)
          ?.track('CanvasElementAdded', {
            control: 'toolbar:general',
            page: 'whiteboard editor',
            module: 'toolbar',
            type: flavour.split(':')[1],
          });
      })
      .catch(console.error);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
  }

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

  override render() {
    const { childType } = this;

    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <!-- add to edgeless -->
          <div class="button-group-container">
            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .tooltip=${'Image'}
              @click=${this._addImages}
              .disabled=${this._imageLoading}
            >
              ${ImageIcon}
            </edgeless-tool-icon-button>

            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .tooltip=${getTooltipWithShortcut('Link', '@')}
              @click=${() => {
                this._onHandleLinkButtonClick();
              }}
            >
              ${LinkIcon}
            </edgeless-tool-icon-button>

            <edgeless-tool-icon-button
              .activeMode=${'background'}
              .tooltip=${'File'}
              @click=${async () => {
                const file = await openFileOrFiles();
                if (!file) return;
                await this.edgeless.addAttachments([file]);
                this.edgeless.service.tool.setEdgelessTool({ type: 'default' });
                this.edgeless.std
                  .getOptional(TelemetryProvider)
                  ?.track('CanvasElementAdded', {
                    control: 'toolbar:general',
                    page: 'whiteboard editor',
                    module: 'toolbar',
                    segment: 'toolbar',
                    type: 'attachment',
                  });
              }}
            >
              ${AttachmentIcon}
            </edgeless-tool-icon-button>
          </div>

          <div class="divider"></div>

          <!-- add to note -->
          <div class="button-group-container">
            ${repeat(
              NOTE_MENU_ITEMS,
              item => item.childFlavour,
              item => html`
                <edgeless-tool-icon-button
                  .active=${childType === item.childType}
                  .activeMode=${'background'}
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
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }

  @state()
  private accessor _imageLoading = false;

  @property({ attribute: false })
  accessor childFlavour!: NoteChildrenFlavour;

  @property({ attribute: false })
  accessor childType!: string | null;

  @property({ attribute: false })
  accessor onChange!: (
    props: Partial<{
      childFlavour: NoteTool['childFlavour'];
      childType: string | null;
      tip: string;
    }>
  ) => void;

  @property({ attribute: false })
  accessor tip!: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-menu': EdgelessNoteMenu;
  }
}
