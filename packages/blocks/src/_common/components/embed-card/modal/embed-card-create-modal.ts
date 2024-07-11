import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { EdgelessRootBlockComponent } from '../../../../root-block/edgeless/edgeless-root-block.js';
import { Bound } from '../../../../surface-block/utils/bound.js';
import { Vec } from '../../../../surface-block/utils/vec.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../../../consts.js';
import type { EmbedCardStyle } from '../../../types.js';
import { getRootByEditorHost } from '../../../utils/query.js';
import { isValidUrl } from '../../../utils/url.js';
import { toast } from '../../toast.js';
import { embedCardModalStyles } from './styles.js';

@customElement('embed-card-create-modal')
export class EmbedCardCreateModal extends WithDisposable(ShadowlessElement) {
  static override styles = embedCardModalStyles;

  @state()
  private accessor _linkInputValue = '';

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor titleText!: string;

  @property({ attribute: false })
  accessor descriptionText!: string;

  @property({ attribute: false })
  accessor createOptions!:
    | {
        mode: 'page';
        parentModel: BlockModel | string;
        index?: number;
      }
    | {
        mode: 'edgeless';
      };

  @property({ attribute: false })
  accessor onConfirm!: () => void;

  @query('input')
  accessor input!: HTMLInputElement;

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

    const rootService = this.host.spec.getService('affine:page');

    const embedOptions = rootService.getEmbedBlockOptions(url);

    const { mode } = this.createOptions;
    if (mode === 'page') {
      const { parentModel, index } = this.createOptions;
      let flavour = 'affine:bookmark';

      if (embedOptions) {
        flavour = embedOptions.flavour;
      }

      this.host.doc.addBlock(
        flavour as never,
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

      const edgelessRoot = getRootByEditorHost(
        this.host
      ) as EdgelessRootBlockComponent | null;
      assertExists(edgelessRoot);

      const surface = edgelessRoot.surface;
      const center = Vec.toVec(surface.renderer.center);
      edgelessRoot.service.addBlock(
        flavour,
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

      edgelessRoot.tools.setEdgelessTool({
        type: 'default',
      });
    }
    this.onConfirm();
    this.remove();
  };

  private _onCancel = () => {
    this.remove();
  };

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

  override render() {
    return html`<div class="embed-card-modal">
      <div class="embed-card-modal-mask" @click=${this._onCancel}></div>
      <div class="embed-card-modal-wrapper">
        <div class="embed-card-modal-row">
          <div class="embed-card-modal-title">${this.titleText}</div>
        </div>

        <div class="embed-card-modal-row">
          <div class="embed-card-modal-description">
            ${this.descriptionText}
          </div>
        </div>

        <div class="embed-card-modal-row">
          <input
            class="embed-card-modal-input link"
            id="card-description"
            type="text"
            placeholder="Input in https://..."
            value=${this._linkInputValue}
            @input=${this._handleInput}
          />
        </div>

        <div class="embed-card-modal-row">
          <div
            class=${classMap({
              'embed-card-modal-button': true,
              save: true,
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

  document.body.append(embedCardCreateModal);

  return new Promise(resolve => {
    embedCardCreateModal.onConfirm = () => resolve();
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-create-modal': EmbedCardCreateModal;
  }
}
