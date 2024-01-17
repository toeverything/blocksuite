import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { EdgelessPageBlockComponent } from '../../../../page-block/edgeless/edgeless-page-block.js';
import type { PageService } from '../../../../page-block/page-service.js';
import type { EdgelessElementType } from '../../../../surface-block/edgeless-types.js';
import { Bound } from '../../../../surface-block/utils/bound.js';
import { Vec } from '../../../../surface-block/utils/vec.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../../../consts.js';
import type { EmbedCardStyle } from '../../../types.js';
import { getPageByEditorHost } from '../../../utils/query.js';
import { isValidUrl } from '../../../utils/url.js';
import { toast } from '../../toast.js';
import { embedCardModalStyles } from './styles.js';

@customElement('embed-card-create-modal')
export class EmbedCardCreateModal extends WithDisposable(ShadowlessElement) {
  static override styles = embedCardModalStyles;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  titleText!: string;

  @property({ attribute: false })
  descriptionText!: string;

  @property({ attribute: false })
  createOptions!:
    | {
        mode: 'page';
        parentModel: BlockModel | string;
        index?: number;
      }
    | {
        mode: 'edgeless';
      };

  @property({ attribute: false })
  onConfirm!: () => void;

  @query('input')
  input!: HTMLInputElement;

  @state()
  private _linkInputValue = '';

  override connectedCallback() {
    super.connectedCallback();

    this.updateComplete
      .then(() => {
        requestAnimationFrame(() => {
          this.input.focus();
        });
      })
      .catch(console.error);
    this.disposables.addFromEvent(this, 'keydown', this._onDocumentKeydown);
  }

  private _handleInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._linkInputValue = target.value;
  }

  private _onDocumentKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      this._onConfirm();
    }
    if (e.key === 'Escape') {
      this.remove();
    }
  };

  private _onConfirm = () => {
    const url = this.input.value;

    if (!isValidUrl(url)) {
      toast(this.host, 'Invalid link');
      return;
    }

    const pageService = this.host.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);

    const embedOptions = pageService.getEmbedBlockOptions(url);

    const { mode } = this.createOptions;
    if (mode === 'page') {
      const { parentModel, index } = this.createOptions;
      let flavour = 'affine:bookmark';

      if (embedOptions) {
        flavour = embedOptions.flavour;
      }

      this.host.page.addBlock(
        flavour,
        {
          url,
        },
        parentModel,
        index
      );
    } else if (mode === 'edgeless') {
      let flavour = 'affine:bookmark',
        targetStyle: EmbedCardStyle = 'vertical';

      if (embedOptions) {
        flavour = embedOptions.flavour;
        targetStyle = embedOptions.styles[0];
      }

      const edgelessPageElement = getPageByEditorHost(
        this.host
      ) as EdgelessPageBlockComponent | null;
      assertExists(edgelessPageElement);

      const surface = edgelessPageElement.surface;
      const center = Vec.toVec(surface.viewport.center);
      surface.addElement(
        flavour as EdgelessElementType,
        {
          url,
          xywh: Bound.fromCenter(
            center,
            EMBED_CARD_WIDTH[targetStyle],
            EMBED_CARD_HEIGHT[targetStyle]
          ).serialize(),
          style: targetStyle,
        },
        surface.model
      );

      edgelessPageElement.tools.setEdgelessTool({
        type: 'default',
      });
    }
    this.onConfirm();
    this.remove();
  };

  private _onCancel = () => {
    this.remove();
  };

  override render() {
    return html`<div class="embed-card-modal blocksuite-overlay">
      <div class="embed-card-modal-mask" @click=${this._onCancel}></div>
      <div class="embed-card-modal-wrapper">
        <div class="embed-card-modal-title">${this.titleText}</div>

        <div class="embed-card-modal-content">
          <div class="embed-card-modal-content-text">
            ${this.descriptionText}
          </div>

          <input
            class="embed-card-modal-input link"
            tabindex="0"
            type="text"
            placeholder="Input in https://..."
            value=${this._linkInputValue}
            @input=${this._handleInput}
          />
        </div>

        <div class="embed-card-modal-action">
          <div
            class="embed-card-modal-button cancel"
            tabindex="0"
            @click=${() => this.remove()}
          >
            Cancel
          </div>

          <div
            class=${classMap({
              'embed-card-modal-button': true,
              confirm: true,
              disabled: !isValidUrl(this._linkInputValue),
            })}
            tabindex="0"
            @click=${this._onConfirm}
          >
            Confirm
          </div>
        </div>
      </div>
    </div>`;
  }
}

export async function toggleEmbedCardCreateModal(
  host: EditorHost,
  titleText: string,
  descriptionText: string,
  createOptions:
    | {
        mode: 'page';
        parentModel: BlockModel | string;
        index?: number;
      }
    | {
        mode: 'edgeless';
      }
): Promise<void> {
  host.selection.clear();

  const embedCardCreateModal = new EmbedCardCreateModal();
  embedCardCreateModal.host = host;
  embedCardCreateModal.titleText = titleText;
  embedCardCreateModal.descriptionText = descriptionText;
  embedCardCreateModal.createOptions = createOptions;

  document.body.appendChild(embedCardCreateModal);

  return new Promise(resolve => {
    embedCardCreateModal.onConfirm = () => resolve();
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-create-modal': EmbedCardCreateModal;
  }
}
