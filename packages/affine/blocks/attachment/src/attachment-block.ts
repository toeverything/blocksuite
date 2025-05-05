import {
  CaptionedBlockComponent,
  SelectedStyle,
} from '@blocksuite/affine-components/caption';
import {
  getAttachmentFileIcon,
  getLoadingIconWith,
} from '@blocksuite/affine-components/icons';
import { Peekable } from '@blocksuite/affine-components/peek';
import { toast } from '@blocksuite/affine-components/toast';
import {
  type AttachmentBlockModel,
  AttachmentBlockStyles,
} from '@blocksuite/affine-model';
import {
  FileSizeLimitProvider,
  ThemeProvider,
} from '@blocksuite/affine-shared/services';
import { humanFileSize } from '@blocksuite/affine-shared/utils';
import {
  AttachmentIcon,
  ResetIcon,
  UpgradeIcon,
  WarningIcon,
} from '@blocksuite/icons/lit';
import { BlockSelection } from '@blocksuite/std';
import { Slice } from '@blocksuite/store';
import { type BlobState } from '@blocksuite/sync';
import { effect, signal } from '@preact/signals-core';
import { html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { type ClassInfo, classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { AttachmentEmbedProvider } from './embed';
import { styles } from './styles';
import { downloadAttachmentBlob, refreshData } from './utils';

type State = 'loading' | 'uploading' | 'warning' | 'oversize' | 'none';

@Peekable({
  enableOn: ({ model }: AttachmentBlockComponent) => {
    return !model.doc.readonly && model.props.type.endsWith('pdf');
  },
})
export class AttachmentBlockComponent extends CaptionedBlockComponent<AttachmentBlockModel> {
  static override styles = styles;

  blockDraggable = true;

  blobState$ = signal<Partial<BlobState>>({});

  protected containerStyleMap = styleMap({
    position: 'relative',
    width: '100%',
    margin: '18px 0px',
  });

  private get _maxFileSize() {
    return this.std.get(FileSizeLimitProvider).maxFileSize;
  }

  get isCitation() {
    return !!this.model.props.footnoteIdentifier;
  }

  convertTo = () => {
    return this.std
      .get(AttachmentEmbedProvider)
      .convertTo(this.model, this._maxFileSize);
  };

  copy = () => {
    const slice = Slice.fromModels(this.doc, [this.model]);
    this.std.clipboard.copySlice(slice).catch(console.error);
    toast(this.host, 'Copied to clipboard');
  };

  download = () => {
    downloadAttachmentBlob(this);
  };

  embedded = () => {
    return (
      Boolean(this.blobUrl) &&
      this.std
        .get(AttachmentEmbedProvider)
        .embedded(this.model, this._maxFileSize)
    );
  };

  open = () => {
    const blobUrl = this.blobUrl;
    if (!blobUrl) return;
    window.open(blobUrl, '_blank');
  };

  refreshData = () => {
    refreshData(this.std, this).catch(console.error);
  };

  updateBlobState(state: Partial<BlobState>) {
    this.blobState$.value = { ...this.blobState$.value, ...state };
  }

  determineState = (
    downloading: boolean,
    uploading: boolean,
    overSize: boolean,
    error: boolean
  ): State => {
    if (overSize) return 'oversize';
    if (error) return 'warning';
    if (uploading) return 'uploading';
    if (downloading) return 'loading';
    return 'none';
  };

  protected get embedView() {
    return this.std
      .get(AttachmentEmbedProvider)
      .render(this.model, this.blobUrl ?? undefined, this._maxFileSize);
  }

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create(BlockSelection, {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';

    this.refreshData();

    this.disposables.add(
      effect(() => {
        const blobId = this.model.props.sourceId$.value;
        if (!blobId) return;

        const blobState$ = this.std.store.blobSync.blobState$(blobId);
        if (!blobState$) return;

        const subscription = blobState$.subscribe(state => {
          if (state.overSize || state.errorMessage) {
            state.uploading = false;
            state.downloading = false;
          }

          this.updateBlobState(state);
        });

        return () => subscription.unsubscribe();
      })
    );

    if (!this.model.props.style && !this.doc.readonly) {
      this.doc.withoutTransact(() => {
        this.doc.updateBlock(this.model, {
          style: AttachmentBlockStyles[1],
        });
      });
    }
  }

  override disconnectedCallback() {
    const blobUrl = this.blobUrl;
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    super.disconnectedCallback();
  }

  override firstUpdated() {
    // lazy bindings
    this.disposables.addFromEvent(this, 'click', this.onClick);
  }

  protected onClick(event: MouseEvent) {
    // the peek view need handle shift + click
    if (event.defaultPrevented) return;

    event.stopPropagation();

    if (!this.selected$.peek()) {
      this._selectBlock();
    }
  }

  protected renderUpgradeButton = () => {
    if (this.std.store.readonly) return null;

    const onOverFileSize = this.std.get(FileSizeLimitProvider).onOverFileSize;

    return when(
      onOverFileSize,
      () => html`
        <button
          class="affine-attachment-content-button"
          @click=${(event: MouseEvent) => {
            event.stopPropagation();
            onOverFileSize?.();
          }}
        >
          ${UpgradeIcon()} Upgrade
        </button>
      `
    );
  };

  protected renderReloadButton = () => {
    return html`
      <button
        class="affine-attachment-content-button"
        @click=${(event: MouseEvent) => {
          event.stopPropagation();
          this.refreshData();
        }}
      >
        ${ResetIcon()} Reload
      </button>
    `;
  };

  protected renderWithHorizontal(
    classInfo: ClassInfo,
    icon: TemplateResult,
    title: string,
    description: string,
    kind: TemplateResult,
    state: State
  ) {
    return html`<div class=${classMap(classInfo)}>
      <div class="affine-attachment-content">
        <div class="affine-attachment-content-title">
          <div class="affine-attachment-content-title-icon">${icon}</div>

          <div class="affine-attachment-content-title-text truncate">
            ${title}
          </div>
        </div>

        <div class="affine-attachment-content-description">
          <div class="affine-attachment-content-info truncate">
            ${description}
          </div>
          ${choose(state, [
            ['oversize', this.renderUpgradeButton],
            ['warning', this.renderReloadButton],
          ])}
        </div>
      </div>

      <div class="affine-attachment-banner">${kind}</div>
    </div>`;
  }

  protected renderWithVertical(
    classInfo: ClassInfo,
    icon: TemplateResult,
    title: string,
    description: string,
    kind: TemplateResult,
    state?: State
  ) {
    return html`<div class=${classMap(classInfo)}>
      <div class="affine-attachment-content">
        <div class="affine-attachment-content-title">
          <div class="affine-attachment-content-title-icon">${icon}</div>

          <div class="affine-attachment-content-title-text truncate">
            ${title}
          </div>
        </div>

        <div class="affine-attachment-content-info truncate">
          ${description}
        </div>
      </div>

      <div class="affine-attachment-banner">
        ${kind}
        ${choose(state, [
          ['oversize', this.renderUpgradeButton],
          ['warning', this.renderReloadButton],
        ])}
      </div>
    </div>`;
  }

  protected renderCard = () => {
    const { name, size, style } = this.model.props;
    const cardStyle = style ?? AttachmentBlockStyles[1];

    const theme = this.std.get(ThemeProvider).theme$.value;
    const loadingIcon = getLoadingIconWith(theme);

    const blobState = this.blobState$.value;
    const {
      uploading = false,
      downloading = false,
      overSize = false,
      errorMessage,
    } = blobState;
    const warning = !overSize && Boolean(errorMessage);
    const error = overSize || warning;
    const state = this.determineState(downloading, uploading, overSize, error);
    const loading = state === 'loading' || state === 'uploading';

    const classInfo = {
      'affine-attachment-card': true,
      [cardStyle]: true,
      error,
      loading,
    };

    const icon = loading
      ? loadingIcon
      : error
        ? WarningIcon()
        : AttachmentIcon();
    const title = uploading ? 'Uploading...' : loading ? 'Loading...' : name;
    const description = errorMessage || humanFileSize(size);
    const kind = getAttachmentFileIcon(name.split('.').pop() ?? '');

    return when(
      cardStyle === 'cubeThick',
      () =>
        this.renderWithVertical(
          classInfo,
          icon,
          title,
          description,
          kind,
          state
        ),
      () =>
        this.renderWithHorizontal(
          classInfo,
          icon,
          title,
          description,
          kind,
          state
        )
    );
  };

  private readonly _renderCitation = () => {
    const { name, footnoteIdentifier } = this.model.props;
    const fileType = name.split('.').pop() ?? '';
    const fileTypeIcon = getAttachmentFileIcon(fileType);
    return html`<affine-citation-card
      .icon=${fileTypeIcon}
      .citationTitle=${name}
      .citationIdentifier=${footnoteIdentifier}
      .active=${this.selected$.value}
    ></affine-citation-card>`;
  };

  override renderBlock() {
    return html`
      <div
        class=${classMap({
          'affine-attachment-container': true,
          focused: this.selected$.value,
        })}
        style=${this.containerStyleMap}
      >
        ${when(
          this.isCitation,
          () => this._renderCitation(),
          () =>
            when(
              this.embedView,
              () =>
                html`<div class="affine-attachment-embed-container">
                  ${this.embedView}
                </div>`,
              this.renderCard
            )
        )}
      </div>
    `;
  }

  @property({ attribute: false })
  accessor blobUrl: string | null = null;

  override accessor selectedStyle = SelectedStyle.Border;

  override accessor useCaptionEditor = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}
