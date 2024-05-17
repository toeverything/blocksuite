import './components/embed-synced-doc-card.js';
import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';

import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { REFERENCE_NODE } from '../_common/inline/presets/nodes/consts.js';
import { matchFlavours } from '../_common/utils/model.js';
import { getThemeMode } from '../_common/utils/query.js';
import type { NoteBlockModel } from '../note-block/note-model.js';
import type { RootBlockComponent } from '../root-block/index.js';
import { SpecProvider } from '../specs/index.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { EmbedSyncedDocCard } from './components/embed-synced-doc-card.js';
import type { EmbedSyncedDocModel } from './embed-synced-doc-model.js';
import type { EmbedSyncedDocBlockService } from './embed-synced-doc-service.js';
import { blockStyles } from './styles.js';

@customElement('affine-embed-synced-doc-block')
export class EmbedSyncedDocBlockComponent extends EmbedBlockElement<
  EmbedSyncedDocModel,
  EmbedSyncedDocBlockService
> {
  static override styles = blockStyles;

  @state()
  private _editorMode: 'page' | 'edgeless' = 'page';

  @state()
  private _docUpdatedAt: Date = new Date();

  @state()
  private _loading = false;

  @state()
  private _error = false;

  @state()
  private _deleted = false;

  @state()
  private _cycle = false;

  @state()
  private _editing = false;

  @state()
  private _empty = false;

  @query(':scope > .embed-block-container > affine-embed-synced-doc-card')
  syncedDocCard?: EmbedSyncedDocCard;

  @query(':scope > .embed-block-container > embed-card-caption')
  captionElement?: EmbedCardCaption;

  @query(
    ':scope > .embed-block-container > .affine-embed-synced-doc-container > .affine-embed-synced-doc-editor > editor-host'
  )
  syncedDocEditorHost?: EditorHost;

  get syncedDoc() {
    const doc = this.std.collection.getDoc(this.model.pageId);
    return doc;
  }

  get blockState() {
    return {
      isLoading: this._loading,
      isError: this._error,
      isDeleted: this._deleted,
      isCycle: this._cycle,
      isEditing: this._editing,
      isEmpty: this._empty,
    };
  }

  get editorMode() {
    return this._editorMode;
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

  private _checkCycle() {
    let editorHost: EditorHost | null = this.host;
    while (editorHost && !this._cycle) {
      this._cycle = !!editorHost && editorHost.doc.id === this.model.pageId;
      editorHost =
        editorHost.parentElement?.closest<EditorHost>('editor-host') ?? null;
    }
  }

  private _checkEmpty() {
    const syncedDoc = this.syncedDoc;
    const rootModel = syncedDoc?.root;
    if (!syncedDoc || !rootModel) {
      this._empty = false;
      return;
    }

    const noteBlocks = rootModel.children.filter(child =>
      matchFlavours(child, ['affine:note'])
    ) as NoteBlockModel[];
    if (noteBlocks.length === 0) {
      this._empty = true;

      syncedDoc.withoutTransact(() => {
        const noteId = syncedDoc.addBlock('affine:note', {}, rootModel.id);
        syncedDoc.addBlock('affine:paragraph', {}, noteId);
      });

      return;
    }

    const contentBlocks = noteBlocks.flatMap(note => note.children);
    if (contentBlocks.length === 0) {
      this._empty = true;

      syncedDoc.withoutTransact(() => {
        syncedDoc.addBlock('affine:paragraph', {}, noteBlocks[0].id);
      });

      return;
    }

    this._empty =
      contentBlocks.length === 1 && contentBlocks[0].text?.length === 0;
  }

  private _handleFocusEventsInLoad = () => {
    const syncedDocEditorHost = this.syncedDocEditorHost;
    assertExists(syncedDocEditorHost);

    this.disposables.addFromEvent(syncedDocEditorHost, 'focusin', e => {
      e.stopPropagation();
      this._editing = true;
    });
    this.disposables.addFromEvent(syncedDocEditorHost, 'focusout', e => {
      e.stopPropagation();
      this._editing = false;
      if (this._editorMode === 'page') {
        this._checkEmpty();
      }
    });
  };

  private async _load() {
    this._loading = true;
    this._error = false;
    this._deleted = false;
    this._cycle = false;
    this._empty = false;

    const syncedDoc = this.syncedDoc;
    if (!syncedDoc) {
      this._deleted = true;
      this._loading = false;
      return;
    }

    this._checkCycle();
    this._editorMode = this._rootService.getEditorMode(this.model.pageId);
    this._docUpdatedAt = this._rootService.getDocUpdatedAt(this.model.pageId);

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

    if (this._editorMode === 'page') {
      this._checkEmpty();
    }

    this._loading = false;

    if (!this._error && !this._cycle) {
      await this.updateComplete;

      const syncedDocEditorHost = this.syncedDocEditorHost;
      assertExists(syncedDocEditorHost);

      this._handleFocusEventsInLoad();
    }
  }

  private _handlePointerDown = (event: MouseEvent) => {
    if (this._editing) {
      event.stopPropagation();
    }
  };

  private _handleOverlayDblClick = (event: MouseEvent) => {
    event.stopPropagation();
    const syncedDocEditorHost = this.syncedDocEditorHost;
    assertExists(syncedDocEditorHost);
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
    const { doc, pageId, caption, xywh } = this.model;

    if (this.isInSurface) {
      const style = 'vertical';
      const bound = Bound.deserialize(xywh);
      bound.w = EMBED_CARD_WIDTH[style];
      bound.h = EMBED_CARD_HEIGHT[style];

      const edgeless = this.edgeless;
      assertExists(edgeless);
      const blockId = edgeless.service.addBlock(
        'affine:embed-linked-doc',
        { pageId, xywh: bound.serialize(), style, caption },
        edgeless.surface.model
      );
      edgeless.service.selection.set({
        editing: false,
        elements: [blockId],
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

  override connectedCallback() {
    super.connectedCallback();

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
  }

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.syncedDocCard?.requestUpdate();
  }

  override render() {
    delete this.dataset.nestedEditor;

    const { style, xywh } = this.model;

    this._cardStyle = style;

    const bound = Bound.deserialize(xywh);
    this._width = this.isInSurface ? bound.w : EMBED_CARD_WIDTH[style];
    this._height = this.isInSurface ? bound.h : EMBED_CARD_HEIGHT[style];

    const syncedDoc = this.syncedDoc;
    const { isLoading, isError, isDeleted, isCycle, isEditing, isEmpty } =
      this.blockState;
    const isInSurface = this.isInSurface;
    const editorMode = this.editorMode;

    if (isLoading || isError || isDeleted || isCycle || !syncedDoc) {
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

          <embed-card-caption .block=${this}></embed-card-caption>
        `
      );
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
        height: `${editorMode === 'page' && isEditing ? `max-content` : `${height}px`}`,
        minHeight: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      });
    }

    const isSelected = !!this.selected?.is('block');
    const theme = getThemeMode();
    const pageSpec = SpecProvider.getInstance().getSpec('page').value;
    const edgelessSpec = SpecProvider.getInstance().getSpec('edgeless').value;
    const EditorBlockSpec = editorMode === 'page' ? pageSpec : edgelessSpec;

    this.dataset.nestedEditor = 'true';
    const scale = isInSurface ? this.model.scale ?? 1 : undefined;

    return this.renderEmbed(
      () => html`
      </div>
        <div
          class=${classMap({
            'affine-embed-synced-doc-container': true,
            [editorMode]: true,
            [theme]: true,
            selected: isSelected,
            editing: isEditing,
            surface: isInSurface,
          })}
          style=${containerStyleMap}
          @pointerdown=${this._handlePointerDown}
          data-scale=${ifDefined(scale)}
        >
          <div
            class=${classMap({
              'affine-embed-synced-doc-editor': true,
              'affine-page-viewport': editorMode === 'page',
              'affine-edgeless-viewport': editorMode === 'edgeless',
            })}
          >
            ${this.host.renderSpecPortal(syncedDoc, EditorBlockSpec)}
            ${
              isEmpty && !isEditing && editorMode === 'page'
                ? html`
                    <div class="affine-embed-synced-doc-editor-empty">
                      <span
                        >This is a linked doc, you can add content here.</span
                      >
                    </div>
                  `
                : nothing
            }
            </div>

            ${
              isInSurface && !isEditing
                ? html`
                    <div
                      class="affine-embed-synced-doc-editor-overlay"
                      @dblclick=${this._handleOverlayDblClick}
                    ></div>
                  `
                : nothing
            }
          </div>

          ${
            isInSurface
              ? html`<embed-card-caption .block=${this}></embed-card-caption>`
              : nothing
          }

          <affine-block-selection .block=${this}></affine-block-selection>
        </div>

        ${this.isInSurface ? nothing : Object.values(this.widgets)}
      `
    );
  }
}
