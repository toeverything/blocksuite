import {
  CaptionedBlockComponent,
  SelectedStyle,
} from '@blocksuite/affine-components/caption';
import {
  getAttachmentFileIcon,
  LoadingIcon,
} from '@blocksuite/affine-components/icons';
import { Peekable } from '@blocksuite/affine-components/peek';
import {
  type ResolvedStateInfo,
  ResourceController,
} from '@blocksuite/affine-components/resource';
import { toast } from '@blocksuite/affine-components/toast';
import {
  type AttachmentBlockModel,
  AttachmentBlockStyles,
} from '@blocksuite/affine-model';
import {
  CitationProvider,
  DocModeProvider,
  FileSizeLimitProvider,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { formatSize } from '@blocksuite/affine-shared/utils';
import {
  AttachmentIcon,
  ResetIcon,
  UpgradeIcon,
} from '@blocksuite/icons/lit';
import { BlockSelection } from '@blocksuite/std';
import { nanoid, Slice } from '@blocksuite/store';
import { computed, signal } from '@preact/signals-core';
import { html, type TemplateResult } from 'lit';
import { choose } from 'lit/directives/choose.js';
import { type ClassInfo, classMap } from 'lit/directives/class-map.js';
import { guard } from 'lit/directives/guard.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';
import { filter } from 'rxjs/operators';

import { AttachmentEmbedProvider } from './embed';
import { styles } from './styles';
import { downloadAttachmentBlob, refreshData } from './utils';

type AttachmentResolvedStateInfo = ResolvedStateInfo & {
  kind?: TemplateResult;
};

@Peekable({
  enableOn: ({ model }: AttachmentBlockComponent) => {
    return !model.store.readonly && model.props.type.endsWith('pdf');
  },
})
export class AttachmentBlockComponent extends CaptionedBlockComponent<AttachmentBlockModel> {
  static override styles = styles;

  blockDraggable = true;

  resourceController = new ResourceController(
    computed(() => this.model.props.sourceId$.value)
  );

  get blobUrl() {
    return this.resourceController.blobUrl$.value;
  }

  get filetype() {
    const name = this.model.props.name$.value;
    return name.split('.').pop() ?? '';
  }

  protected containerStyleMap = styleMap({
    position: 'relative',
    width: '100%',
    margin: '18px 0px',
  });

  private get _maxFileSize() {
    return this.std.get(FileSizeLimitProvider).maxFileSize;
  }

  get citationService() {
    return this.std.get(CitationProvider);
  }

  get isCitation() {
    return this.citationService.isCitationModel(this.model);
  }

  convertTo = () => {
    return this.std
      .get(AttachmentEmbedProvider)
      .convertTo(this.model, this._maxFileSize);
  };

  copy = () => {
    const slice = Slice.fromModels(this.store, [this.model]);
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
    refreshData(this).catch(console.error);
  };

  private readonly _refreshKey$ = signal<string | null>(null);

reload = () => {
  const isEmbedded = this.model.props.embed;
  const hasBlobUrl = !!this.resourceController.blobUrl$.value;

  if (isEmbedded && hasBlobUrl) {
    // For embedded attachments with a loaded blob (likely local or cached), update refreshKey
    this._refreshKey$.value = nanoid();
    console.log('Embedded reload with blobUrl, updated refreshKey:', this._refreshKey$.value);
    return;
  }

  // For non-embedded or cloud attachments (no blobUrl), perform full refresh
  this.resourceController.updateState({ downloading: true });
  this.refreshData();
  this.resourceController.updateState({ downloading: false, state: 'none' });
  this._refreshKey$.value = nanoid();
  console.log('Full reload, updated refreshKey:', this._refreshKey$.value);
};

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create(BlockSelection, {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private readonly _trackCitationDeleteEvent = () => {
    this._disposables.add(
      this.std.store.slots.blockUpdated
        .pipe(
          filter(payload => {
            if (!payload.isLocal) return false;

            const { flavour, id, type } = payload;
            if (
              type !== 'delete' ||
              flavour !== this.model.flavour ||
              id !== this.model.id
            )
              return false;

            const { model } = payload;
            if (!this.citationService.isCitationModel(model)) return false;

            return true;
          })
        )
        .subscribe(() => {
          this.citationService.trackEvent('Delete');
        })
    );
  };

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';

    this.resourceController.setEngine(this.std.store.blobSync);

    this.disposables.add(this.resourceController.subscribe());
    this.disposables.add(this.resourceController);

    this.disposables.add(
      this.model.props.sourceId$.subscribe(() => {
        this.refreshData();
      })
    );

    if (!this.model.props.style && !this.store.readonly) {
      this.store.withoutTransact(() => {
        this.store.updateBlock(this.model, {
          style: AttachmentBlockStyles[1],
        });
      });
    }

    this._trackCitationDeleteEvent();
  }

  override firstUpdated() {
    this.disposables.addFromEvent(this, 'click', this.onClick);
  }

  protected onClick(event: MouseEvent) {
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

            const mode =
              this.std.get(DocModeProvider).getEditorMode() ?? 'page';
            const segment = mode === 'page' ? 'doc' : 'whiteboard';
            this.std
              .getOptional(TelemetryProvider)
              ?.track('AttachmentUpgradedEvent', {
                segment,
                page: `${segment} editor`,
                module: 'attachment',
                control: 'upgrade',
                category: 'card',
                type: this.model.props.name.split('.').pop() ?? '',
              });
          }}
        >
          ${UpgradeIcon()} Upgrade
        </button>
      `
    );
  };

  protected renderNormalButton = (needUpload: boolean) => {
    return null;
  };

  protected renderWithHorizontal(
    classInfo: ClassInfo,
    {
      icon,
      title,
      description,
      kind,
      state,
      needUpload,
    }: AttachmentResolvedStateInfo
  ) {
    return html`
      <div class=${classMap(classInfo)}>
        <div class="affine-attachment-content">
          <div class="affine-attachment-content-title">
            <div class="affine-attachment-content-title-icon">${icon}</div>
            <div class="affine-attachment-content-title-text truncate">
              ${title}
            </div>
          </div>
        </div>

        <div class="affine-attachment-banner">${kind}</div>
      </div>
    `;
  }

  protected renderWithVertical(
    classInfo: ClassInfo,
    {
      icon,
      title,
      description,
      kind,
      state,
      needUpload,
    }: AttachmentResolvedStateInfo
  ) {
    return html`
      <div class=${classMap(classInfo)}>
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

        <div class="affine-attachment-banner">${kind}</div>
      </div>
    `;
  }

  protected resolvedState$ = computed<AttachmentResolvedStateInfo>(() => {
    const size = this.model.props.size;
    const name = this.model.props.name$.value;
    const kind = getAttachmentFileIcon(this.filetype);

    const resolvedState = this.resourceController.resolveStateWith({
      loadingIcon: LoadingIcon(),
      errorIcon: null, // Suppress warning symbol
      icon: AttachmentIcon(),
      title: name,
      description: formatSize(size),
    });

    return { ...resolvedState, kind };
  });

  protected renderCardView = () => {
    const resolvedState = this.resolvedState$.value;
    const cardStyle = this.model.props.style$.value ?? AttachmentBlockStyles[1];

    const classInfo = {
      'affine-attachment-card': true,
      [cardStyle]: true,
      loading: resolvedState.loading,
    };

    return when(
      cardStyle === 'cubeThick',
      () => this.renderWithVertical(classInfo, resolvedState),
      () => this.renderWithHorizontal(classInfo, resolvedState)
    );
  };

  protected renderEmbedView = () => {
    const { model, blobUrl } = this;
    if (!model.props.embed || !blobUrl) {
      console.log('renderEmbedView: Skipping due to missing embed or blobUrl', {
        embed: model.props.embed,
        blobUrl,
        name: model.props.name,
      });
      return null;
    }

    const { std, _maxFileSize } = this;
    const provider = std.get(AttachmentEmbedProvider);

    const render = provider.getRender(model, _maxFileSize);
    if (!render) {
      console.log('renderEmbedView: No render function available', {
        name: model.props.name,
      });
      return null;
    }

    return html`
      <div class="affine-attachment-embed-container">
        ${guard([this._refreshKey$.value], () => render(model, blobUrl))}
      </div>
    `;
  };

  private readonly _renderCitation = () => {
    const { name, footnoteIdentifier } = this.model.props;
    const icon = getAttachmentFileIcon(this.filetype);

    return html`<affine-citation-card
      .icon=${icon}
      .citationTitle=${name}
      .citationIdentifier=${footnoteIdentifier}
      .active=${this.selected$.value}
    ></affine-citation-card>`;
  };

  override renderBlock() {
    console.log('renderBlock called, flavour:', this.model.flavour, 'state:', this.resolvedState$.value.state);
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
          () => this.renderEmbedView() ?? this.renderCardView()
        )}
      </div>
    `;
  }

  override accessor selectedStyle = SelectedStyle.Border;

  override accessor useCaptionEditor = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}