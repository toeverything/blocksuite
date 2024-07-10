import './components/embed-synced-doc-card.js';

import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  type BlockSelector,
  BlockViewType,
  DocCollection,
} from '@blocksuite/store';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { guard } from 'lit/directives/guard.js';
import { styleMap } from 'lit/directives/style-map.js';

import { Peekable } from '../_common/components/peekable.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedEdgelessIcon, EmbedPageIcon } from '../_common/icons/text.js';
import { REFERENCE_NODE } from '../_common/inline/presets/nodes/consts.js';
import { type DocMode, NoteDisplayMode } from '../_common/types.js';
import { matchFlavours } from '../_common/utils/model.js';
import { getThemeMode } from '../_common/utils/query.js';
import { isEmptyDoc } from '../_common/utils/render-linked-doc.js';
import type {
  EdgelessRootService,
  RootBlockComponent,
} from '../root-block/index.js';
import { SpecProvider } from '../specs/utils/spec-provider.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { EmbedSyncedDocCard } from './components/embed-synced-doc-card.js';
import type { EmbedSyncedDocModel } from './embed-synced-doc-model.js';
import type { EmbedSyncedDocBlockService } from './embed-synced-doc-service.js';
import { blockStyles } from './styles.js';

@customElement('affine-embed-synced-doc-block')
@Peekable()
export class EmbedSyncedDocBlockComponent extends EmbedBlockElement<
  EmbedSyncedDocModel,
  EmbedSyncedDocBlockService
> {
  get syncedDoc() {
    return this._syncedDocMode === 'page'
      ? this.std.collection.getDoc(this.model.pageId, {
          readonly: true,
          selector: this._pageFilter,
        })
      : this.std.collection.getDoc(this.model.pageId, {
          readonly: true,
        });
  }

  get blockState() {
    return {
      isLoading: this._loading,
      isError: this._error,
      isDeleted: this._deleted,
      isCycle: this._cycle,
    };
  }

  get editorMode() {
    return this._syncedDocMode;
  }

  get docUpdatedAt() {
    return this._docUpdatedAt;
  }

  get docTitle() {
    return this.syncedDoc?.meta?.title.length
      ? this.syncedDoc.meta.title
      : 'Untitled';
  }

  private get _rootService() {
    return this.std.spec.getService('affine:page');
  }

  private get isPageMode() {
    return this._syncedDocMode === 'page';
  }

  static override styles = blockStyles;

  private _pageFilter: BlockSelector = block => {
    if (
      matchFlavours(block.model, ['affine:note']) &&
      block.model.displayMode === NoteDisplayMode.EdgelessOnly
    ) {
      return BlockViewType.Hidden;
    }

    return BlockViewType.Display;
  };

  @state()
  accessor depth = 0;

  @state()
  private accessor _syncedDocMode: DocMode = 'page';

  @state()
  private accessor _isEmptySyncedDoc: boolean = true;

  @state()
  private accessor _docUpdatedAt: Date = new Date();

  @state()
  private accessor _loading = false;

  @state()
  private accessor _error = false;

  @state()
  private accessor _deleted = false;

  @state()
  private accessor _cycle = false;

  override accessor useCaptionEditor = false;

  @query(
    ':scope > .affine-block-component > .embed-block-container > affine-embed-synced-doc-card'
  )
  accessor syncedDocCard: EmbedSyncedDocCard | null = null;

  @query(
    ':scope > .affine-block-component > .embed-block-container > .affine-embed-synced-doc-container > .affine-embed-synced-doc-editor > div > editor-host'
  )
  accessor syncedDocEditorHost: EditorHost | null = null;

  private _checkCycle() {
    let editorHost: EditorHost | null = this.host;
    while (editorHost && !this._cycle) {
      this._cycle = !!editorHost && editorHost.doc.id === this.model.pageId;
      editorHost =
        editorHost.parentElement?.closest<EditorHost>('editor-host') ?? null;
    }
  }

  private async _load() {
    this._loading = true;
    this._error = false;
    this._deleted = false;
    this._cycle = false;

    const syncedDoc = this.syncedDoc;
    if (!syncedDoc) {
      this._deleted = true;
      this._loading = false;
      return;
    }

    this._checkCycle();

    if (!syncedDoc.loaded) {
      try {
        syncedDoc.load();
      } catch (e) {
        console.error(e);
        this._error = true;
      }
    }

    if (!this._error && !syncedDoc.root) {
      await new Promise<void>(resolve => {
        syncedDoc.slots.rootAdded.once(() => resolve());
      });
    }

    this._loading = false;
  }

  private _setDocUpdatedAt() {
    const meta = this.doc.collection.meta.getDocMeta(this.model.pageId);
    if (meta) {
      const date = meta.updatedDate || meta.createDate;
      this._docUpdatedAt = new Date(date);
    }
  }

  private _isClickAtBorder(
    event: MouseEvent,
    element: HTMLElement,
    tolerance = 8
  ): boolean {
    const { x, y } = event;
    const rect = element.getBoundingClientRect();
    if (!rect) {
      return false;
    }

    return (
      Math.abs(x - rect.left) < tolerance ||
      Math.abs(x - rect.right) < tolerance ||
      Math.abs(y - rect.top) < tolerance ||
      Math.abs(y - rect.bottom) < tolerance
    );
  }

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _handleClick(_event: MouseEvent) {
    if (this.isInSurface) return;
    this._selectBlock();
  }

  private _buildPreviewSpec = (name: 'page:preview' | 'edgeless:preview') => {
    const nextDepth = this.depth + 1;
    const previewSpecBuilder = SpecProvider.getInstance().getSpec(name);
    const currentDisposables = this.disposables;

    previewSpecBuilder.setup(
      'affine:embed-synced-doc',
      (slots, disposableGroup) => {
        disposableGroup.add(
          slots.viewConnected.on(({ component }) => {
            const nextComponent = component as EmbedSyncedDocBlockComponent;
            nextComponent.depth = nextDepth;
            currentDisposables.add(() => {
              nextComponent.depth = 0;
            });
          })
        );
        disposableGroup.add(
          slots.viewDisconnected.on(({ component }) => {
            const nextComponent = component as EmbedSyncedDocBlockComponent;
            nextComponent.depth = 0;
          })
        );
      }
    );

    return previewSpecBuilder.value;
  };

  private _renderSyncedView = () => {
    const syncedDoc = this.syncedDoc;
    const isInSurface = this.isInSurface;
    const editorMode = this._syncedDocMode;

    assertExists(syncedDoc);

    if (this.isPageMode && !this.isInSurface) {
      this.style.width = 'calc(100% + 48px)';
      this.style.marginLeft = '-24px';
      this.style.marginRight = '-24px';
    }

    let containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
    });
    if (isInSurface) {
      const scale = this.model.scale ?? 1;
      const bound = Bound.deserialize(
        (this.edgeless?.service.getElementById(this.model.id) ?? this.model)
          .xywh
      );
      const width = bound.w / scale;
      const height = bound.h / scale;
      containerStyleMap = styleMap({
        width: `${width}px`,
        height: `${height}px`,
        minHeight: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      });
    }

    const theme = getThemeMode();
    const isSelected = !!this.selected?.is('block');
    const scale = isInSurface ? this.model.scale ?? 1 : undefined;

    this.dataset.nestedEditor = '';

    const renderEditor = () => {
      return choose(editorMode, [
        [
          'page',
          () => html`
            <div class="affine-page-viewport">
              ${this.host.renderSpecPortal(
                syncedDoc,
                this._buildPreviewSpec('page:preview')
              )}
            </div>
          `,
        ],
        [
          'edgeless',
          () => html`
            <div class="affine-edgeless-viewport">
              ${this.host.renderSpecPortal(
                syncedDoc,
                this._buildPreviewSpec('edgeless:preview')
              )}
            </div>
          `,
        ],
      ]);
    };

    const icon = this.isPageMode ? EmbedPageIcon : EmbedEdgelessIcon;

    return this.renderEmbed(
      () => html`
        <div
          class=${classMap({
            'affine-embed-synced-doc-container': true,
            [editorMode]: true,
            [theme]: true,
            selected: isSelected,
            surface: isInSurface,
          })}
          @click=${this._handleClick}
          style=${containerStyleMap}
          ?data-scale=${scale}
        >
          <div class="affine-embed-synced-doc-editor">
            ${this.isPageMode && this._isEmptySyncedDoc
              ? html`
                  <div class="affine-embed-synced-doc-editor-empty">
                    <span>
                      This is a linked doc, you can add content here.
                    </span>
                  </div>
                `
              : guard([editorMode, syncedDoc], renderEditor)}
          </div>
          ${isInSurface
            ? nothing
            : html`
                <div
                  class=${classMap({
                    'affine-embed-synced-doc-header-wrapper': true,
                    selected: isSelected,
                  })}
                >
                  <div class="affine-embed-synced-doc-header">
                    ${icon}
                    <span class="affine-embed-synced-doc-title">
                      ${this.docTitle}
                    </span>
                  </div>
                </div>
              `}
          ${isInSurface
            ? html` <div class="affine-embed-synced-doc-editor-overlay"></div> `
            : nothing}
        </div>
      `
    );
  };

  private _initEdgelessFitEffect = () => {
    const fitToContent = () => {
      const { _syncedDocMode } = this;

      if (_syncedDocMode !== 'edgeless') return;

      const service = this.syncedDocEditorHost?.std.spec.getService(
        'affine:page'
      ) as EdgelessRootService;

      if (!service) return;

      service.viewport.onResize();
      service.zoomToFit();
    };

    const observer = new ResizeObserver(fitToContent);
    const blockElement = this.embedBlock;

    observer.observe(blockElement);

    this._disposables.add(() => {
      observer.disconnect();
    });

    this.syncedDocEditorHost?.updateComplete
      .then(() => {
        fitToContent();
      })
      .catch(() => {});
  };

  open = () => {
    const syncedDocId = this.model.pageId;
    if (syncedDocId === this.doc.id) return;

    const rootElement = this.std.view.viewFromPath('block', [
      this.doc.root?.id ?? '',
    ]) as RootBlockComponent | null;
    assertExists(rootElement);

    rootElement.slots.docLinkClicked.emit({ docId: syncedDocId });
  };

  covertToInline = () => {
    const { doc, pageId } = this.model;
    const parent = doc.getParent(this.model);
    assertExists(parent);
    const index = parent.children.indexOf(this.model);

    const yText = new DocCollection.Y.Text();
    yText.insert(0, REFERENCE_NODE);
    yText.format(0, REFERENCE_NODE.length, {
      reference: { type: 'LinkedPage', pageId },
    });
    const text = new doc.Text(yText);

    doc.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    doc.deleteBlock(this.model);
  };

  convertToCard = () => {
    const { id, doc, pageId, caption, xywh } = this.model;

    if (this.isInSurface) {
      const style = 'vertical';
      const bound = Bound.deserialize(xywh);
      bound.w = EMBED_CARD_WIDTH[style];
      bound.h = EMBED_CARD_HEIGHT[style];

      const edgeless = this.edgeless;
      assertExists(edgeless);
      const newId = edgeless.service.addBlock(
        'affine:embed-linked-doc',
        { pageId, xywh: bound.serialize(), style, caption },
        edgeless.surface.model
      );

      this.std.command.exec('reassociateConnectors', {
        oldId: id,
        newId,
      });

      edgeless.service.selection.set({
        editing: false,
        elements: [newId],
      });
    } else {
      const parent = doc.getParent(this.model);
      assertExists(parent);
      const index = parent.children.indexOf(this.model);

      doc.addBlock(
        'affine:embed-linked-doc',
        { pageId, caption },
        parent,
        index
      );

      this.std.selection.setGroup('note', []);
    }
    doc.deleteBlock(this.model);
  };

  refreshData = () => {
    this._load().catch(e => {
      console.error(e);
      this._error = true;
    });
  };

  override connectedCallback() {
    super.connectedCallback();

    this.style.display = 'block';
    this._load().catch(e => {
      console.error(e);
      this._error = true;
    });

    this.contentEditable = 'false';

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'pageId' || key === 'style') {
        this._load().catch(e => {
          console.error(e);
          this._error = true;
        });
      }
    });

    if (this.isInSurface) {
      const surface = this.surface;
      assertExists(surface);

      this.disposables.add(
        this.model.propsUpdated.on(() => {
          this.requestUpdate();
        })
      );
    }

    this._setDocUpdatedAt();
    this.disposables.add(
      this.doc.collection.meta.docMetaUpdated.on(() => {
        this._setDocUpdatedAt();
      })
    );

    this._syncedDocMode = this._rootService.docModeService.getMode(
      this.model.pageId
    );
    this._isEmptySyncedDoc = isEmptyDoc(this.syncedDoc, this._syncedDocMode);
    this.disposables.add(
      this._rootService.docModeService.onModeChange(mode => {
        this._syncedDocMode = mode;
        this._isEmptySyncedDoc = isEmptyDoc(this.syncedDoc, mode);
      }, this.model.pageId)
    );

    this.syncedDoc &&
      this.disposables.add(
        this.syncedDoc.slots.blockUpdated.on(() => {
          this._isEmptySyncedDoc = isEmptyDoc(
            this.syncedDoc,
            this._syncedDocMode
          );
        })
      );
  }

  override firstUpdated() {
    this.disposables.addFromEvent(this, 'click', e => {
      e.stopPropagation();
      if (this._isClickAtBorder(e, this)) {
        e.preventDefault();
        this._selectBlock();
      }
    });

    // Forward docLinkClicked event from the synced doc
    const syncedDocRootService =
      this.syncedDocEditorHost?.std.spec.getService('affine:page');
    if (syncedDocRootService) {
      this.disposables.add(
        syncedDocRootService.slots.docLinkClicked.on(({ docId }) => {
          this._rootService.slots.docLinkClicked.emit({ docId });
        })
      );
    }

    this._initEdgelessFitEffect();
  }

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.syncedDocCard?.requestUpdate();
  }

  override renderBlock() {
    delete this.dataset.nestedEditor;

    const { style, xywh } = this.model;

    this._cardStyle = style;

    const bound = Bound.deserialize(xywh);
    this._width = this.isInSurface ? bound.w : EMBED_CARD_WIDTH[style];
    this._height = this.isInSurface ? bound.h : EMBED_CARD_HEIGHT[style];

    const syncedDoc = this.syncedDoc;
    const { isLoading, isError, isDeleted, isCycle } = this.blockState;
    const isInSurface = this.isInSurface;
    const isCardOnly = this.depth >= 1;

    if (
      isLoading ||
      isError ||
      isDeleted ||
      isCardOnly ||
      isCycle ||
      !syncedDoc
    ) {
      let cardStyleMap = styleMap({
        position: 'relative',
        display: 'block',
        width: '100%',
      });
      if (isInSurface) {
        const bound = Bound.deserialize(this.model.xywh);
        const scaleX = bound.w / EMBED_CARD_WIDTH[style];
        const scaleY = bound.h / EMBED_CARD_HEIGHT[style];
        cardStyleMap = styleMap({
          display: 'block',
          width: `${EMBED_CARD_WIDTH[style]}px`,
          height: `${EMBED_CARD_HEIGHT[style]}px`,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: '0 0',
        });
      }

      return this.renderEmbed(
        () => html`
          <affine-embed-synced-doc-card
            style=${cardStyleMap}
            .block=${this}
          ></affine-embed-synced-doc-card>
        `
      );
    }

    return this._renderSyncedView();
  }
}
