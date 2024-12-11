import type { AliasInfo } from '@blocksuite/affine-model';
import type {
  BlockComponent,
  BlockStdScope,
  EditorHost,
} from '@blocksuite/block-std';

import {
  EmbedLinkedDocBlockComponent,
  EmbedSyncedDocBlockComponent,
} from '@blocksuite/affine-block-embed';
import {
  notifyLinkedDocClearedAliases,
  notifyLinkedDocSwitchedToCard,
} from '@blocksuite/affine-components/notification';
import { toast } from '@blocksuite/affine-components/toast';
import {
  EmbedLinkedDocModel,
  EmbedSyncedDocModel,
} from '@blocksuite/affine-model';
import {
  type LinkEventType,
  type TelemetryEvent,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { FONT_SM, FONT_XS } from '@blocksuite/affine-shared/styles';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import {
  listenClickAway,
  stopPropagation,
} from '@blocksuite/affine-shared/utils';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import { computed, signal } from '@preact/signals-core';
import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';

import type { LinkableEmbedModel } from '../type.js';

import { isInternalEmbedModel } from '../type.js';

export class EmbedCardEditModal extends SignalWatcher(
  WithDisposable(LitElement)
) {
  static override styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      z-index: var(--affine-z-index-popover);
      animation: affine-popover-fade-in 0.2s ease;
    }

    @keyframes affine-popover-fade-in {
      from {
        opacity: 0;
        transform: translateY(-3px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .embed-card-modal-wrapper {
      display: flex;
      padding: 12px;
      flex-direction: column;
      justify-content: flex-end;
      align-items: flex-start;
      gap: 12px;
      width: 421px;

      color: var(--affine-icon-color);
      box-shadow: var(--affine-overlay-shadow);
      background: ${unsafeCSSVarV2('layer/background/overlayPanel')};
      border-radius: 4px;
      border: 0.5px solid ${unsafeCSSVarV2('layer/insideBorder/border')};
    }

    .row {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .row .input {
      display: flex;
      padding: 4px 10px;
      width: 100%;
      min-width: 100%;
      box-sizing: border-box;
      border-radius: 4px;
      user-select: none;
      background: transparent;
      border: 1px solid ${unsafeCSSVarV2('input/border/default')};
      color: var(--affine-text-primary-color);
      ${FONT_SM};
    }
    .input::placeholder {
      color: var(--affine-placeholder-color);
    }
    .input:focus {
      border-color: ${unsafeCSSVarV2('input/border/active')};
      outline: none;
    }

    textarea.input {
      min-height: 80px;
      resize: none;
    }

    .row.actions {
      justify-content: flex-end;
    }

    .row.actions .button {
      display: flex;
      padding: 4px 12px;
      align-items: center;
      gap: 4px;
      border-radius: 4px;
      border: 1px solid ${unsafeCSSVarV2('button/innerBlackBorder')};
      background: ${unsafeCSSVarV2('button/secondary')};
      ${FONT_XS};
      color: ${unsafeCSSVarV2('text/primary')};
    }
    .row.actions .button[disabled],
    .row.actions .button:disabled {
      pointer-events: none;
      color: ${unsafeCSSVarV2('text/disable')};
    }
    .row.actions .button.save {
      color: ${unsafeCSSVarV2('button/pureWhiteText')};
      background: ${unsafeCSSVarV2('button/primary')};
    }
    .row.actions .button[disabled].save,
    .row.actions .button:disabled.save {
      opacity: 0.5;
    }
  `;

  private _blockComponent: BlockComponent | null = null;

  private _hide = () => {
    this.remove();
  };

  private _onKeydown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !(e.isComposing || e.shiftKey)) {
      this._onSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      this.remove();
    }
  };

  private _onReset = () => {
    const blockComponent = this._blockComponent;

    if (!blockComponent) {
      this.remove();
      return;
    }

    const std = blockComponent.std;

    this.model.doc.updateBlock(this.model, { title: null, description: null });

    if (
      this.isEmbedLinkedDocModel &&
      blockComponent instanceof EmbedLinkedDocBlockComponent
    ) {
      blockComponent.refreshData();

      notifyLinkedDocClearedAliases(std);
    }
    blockComponent.requestUpdate();

    track(std, this.model, this.viewType, 'ResetedAlias', { control: 'reset' });

    this.remove();
  };

  private _onSave = () => {
    const blockComponent = this._blockComponent;

    if (!blockComponent) {
      this.remove();
      return;
    }

    const title = this.title$.value.trim();
    if (title.length === 0) {
      toast(this.host, 'Title can not be empty');
      return;
    }

    const std = blockComponent.std;

    const description = this.description$.value.trim();

    const props: AliasInfo = { title };
    if (description) props.description = description;

    if (
      this.isEmbedSyncedDocModel &&
      blockComponent instanceof EmbedSyncedDocBlockComponent
    ) {
      blockComponent.convertToCard(props);

      notifyLinkedDocSwitchedToCard(std);
    } else {
      this.model.doc.updateBlock(this.model, props);
      blockComponent.requestUpdate();
    }

    track(std, this.model, this.viewType, 'SavedAlias', { control: 'save' });

    this.remove();
  };

  private _updateDescription = (e: InputEvent) => {
    const target = e.target as HTMLTextAreaElement;
    this.description$.value = target.value;
  };

  private _updateTitle = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    this.title$.value = target.value;
  };

  get isEmbedLinkedDocModel() {
    return this.model instanceof EmbedLinkedDocModel;
  }

  get isEmbedSyncedDocModel() {
    return this.model instanceof EmbedSyncedDocModel;
  }

  get isInternalEmbedModel() {
    return isInternalEmbedModel(this.model);
  }

  get modelType(): 'linked' | 'synced' | null {
    if (this.isEmbedLinkedDocModel) return 'linked';
    if (this.isEmbedSyncedDocModel) return 'synced';
    return null;
  }

  get placeholders() {
    if (this.isInternalEmbedModel) {
      return {
        title: 'Add title alias',
        description:
          'Add description alias (empty to inherit document content)',
      };
    }

    return {
      title: 'Write a title',
      description: 'Write a description...',
    };
  }

  private _updateInfo() {
    const title = this.model.title || this.originalDocInfo?.title || '';
    const description =
      this.model.description || this.originalDocInfo?.description || '';

    this.title$.value = title;
    this.description$.value = description;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._updateInfo();
  }

  override firstUpdated() {
    const blockComponent = this.host.std.view.getBlock(this.model.id);
    if (!blockComponent) return;

    this._blockComponent = blockComponent;

    this.disposables.add(
      autoUpdate(blockComponent, this, () => {
        computePosition(blockComponent, this, {
          placement: 'top-start',
          middleware: [flip(), offset(8)],
        })
          .then(({ x, y }) => {
            this.style.left = `${x}px`;
            this.style.top = `${y}px`;
          })
          .catch(console.error);
      })
    );

    this.disposables.add(listenClickAway(this, this._hide));
    this.disposables.addFromEvent(this, 'keydown', this._onKeydown);
    this.disposables.addFromEvent(this, 'pointerdown', stopPropagation);

    this.titleInput.focus();
    this.titleInput.select();
  }

  override render() {
    return html`
      <div class="embed-card-modal-wrapper">
        <div class="row">
          <input
            class="input title"
            type="text"
            placeholder=${this.placeholders.title}
            .value=${live(this.title$.value)}
            @input=${this._updateTitle}
          />
        </div>
        <div class="row">
          <textarea
            class="input description"
            maxlength="500"
            placeholder=${this.placeholders.description}
            .value=${live(this.description$.value)}
            @input=${this._updateDescription}
          ></textarea>
        </div>
        <div class="row actions">
          ${choose(this.modelType, [
            [
              'linked',
              () => html`
                <button
                  class=${classMap({
                    button: true,
                    reset: true,
                  })}
                  .disabled=${this.resetButtonDisabled$.value}
                  @click=${this._onReset}
                >
                  Reset
                </button>
              `,
            ],
            [
              'synced',
              () => html`
                <button
                  class=${classMap({
                    button: true,
                    cancel: true,
                  })}
                  @click=${this._hide}
                >
                  Cancel
                </button>
              `,
            ],
          ])}
          <button
            class=${classMap({
              button: true,
              save: true,
            })}
            .disabled=${this.saveButtonDisabled$.value}
            @click=${this._onSave}
          >
            Save
          </button>
        </div>
      </div>
    `;
  }

  accessor description$ = signal<string>('');

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor model!: LinkableEmbedModel;

  @property({ attribute: false })
  accessor originalDocInfo: AliasInfo | undefined = undefined;

  accessor resetButtonDisabled$ = computed<boolean>(
    () =>
      !(
        Boolean(this.model.title$.value?.length) ||
        Boolean(this.model.description$.value?.length)
      )
  );

  accessor saveButtonDisabled$ = computed<boolean>(
    () => this.title$.value.trim().length === 0
  );

  accessor title$ = signal<string>('');

  @query('.input.title')
  accessor titleInput!: HTMLInputElement;

  @property({ attribute: false })
  accessor viewType!: string;
}

export function toggleEmbedCardEditModal(
  host: EditorHost,
  embedCardModel: LinkableEmbedModel,
  viewType: string,
  originalDocInfo?: AliasInfo
) {
  document.body.querySelector('embed-card-edit-modal')?.remove();

  const embedCardEditModal = new EmbedCardEditModal();
  embedCardEditModal.model = embedCardModel;
  embedCardEditModal.host = host;
  embedCardEditModal.viewType = viewType;
  embedCardEditModal.originalDocInfo = originalDocInfo;
  document.body.append(embedCardEditModal);
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-edit-modal': EmbedCardEditModal;
  }
}

function track(
  std: BlockStdScope,
  model: LinkableEmbedModel,
  viewType: string,
  event: LinkEventType,
  props: Partial<TelemetryEvent>
) {
  std.getOptional(TelemetryProvider)?.track(event, {
    segment: 'toolbar',
    page: 'doc editor',
    module: 'embed card edit popup',
    type: `${viewType} view`,
    category: isInternalEmbedModel(model) ? 'linked doc' : 'link',
    ...props,
  });
}
