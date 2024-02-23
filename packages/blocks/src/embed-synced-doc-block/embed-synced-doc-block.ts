import './components/embed-synced-doc-card.js';
import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';
import '../_common/components/embed-card/embed-card-toolbar.js';

import { UIEventDispatcher } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { Workspace } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { HoverController } from '../_common/components/hover/index.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { REFERENCE_NODE } from '../_common/inline/presets/nodes/consts.js';
import { matchFlavours } from '../_common/utils/model.js';
import { getThemeMode } from '../_common/utils/query.js';
import {
  DocEditorBlockSpecs,
  EdgelessEditorBlockSpecs,
} from '../_specs/_specs.js';
import type { NoteBlockModel } from '../note-block/note-model.js';
import type { PageBlockComponent } from '../page-block/index.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { EmbedSyncedDocCard } from './components/embed-synced-doc-card.js';
import type { EmbedSyncedDocModel } from './embed-synced-doc-model.js';
import type { EmbedSyncedDocService } from './embed-synced-doc-service.js';
import { blockStyles } from './styles.js';

@customElement('affine-embed-synced-doc-block')
export class EmbedSyncedDocBlockComponent extends EmbedBlockElement<
  EmbedSyncedDocModel,
  EmbedSyncedDocService
> {
  static override styles = blockStyles;

  @state()
  private _pageMode: 'page' | 'edgeless' = 'page';

  @state()
  private _pageUpdatedAt: Date = new Date();

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

  get doc() {
    const page = this.std.workspace.getPage(this.model.pageId);
    return page;
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

  get pageMode() {
    return this._pageMode;
  }

  get pageUpdatedAt() {
    return this._pageUpdatedAt;
  }

  get pageTitle() {
    return this.doc?.meta.title.length ? this.doc.meta.title : 'Untitled';
  }

  private get _pageService() {
    return this.std.spec.getService('affine:page');
  }

  private _checkCycle() {
    let editorHost: EditorHost | null = this.host;
    while (editorHost && !this._cycle) {
      this._cycle = !!editorHost && editorHost.page.id === this.model.pageId;
      editorHost =
        editorHost.parentElement?.closest<EditorHost>('editor-host') ?? null;
    }
  }

  private _checkEmpty() {
    const syncedDoc = this.doc;
    const root = syncedDoc?.root;
    if (!syncedDoc || !root) {
      this._empty = false;
      return;
    }

    const noteBlocks = root.children.filter(child =>
      matchFlavours(child, ['affine:note'])
    ) as NoteBlockModel[];
    if (noteBlocks.length === 0) {
      this._empty = true;

      syncedDoc.withoutTransact(() => {
        const noteId = syncedDoc.addBlock('affine:note', {}, root.id);
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

  private async _load() {
    this._loading = true;
    this._error = false;
    this._deleted = false;
    this._cycle = false;
    this._empty = false;

    const syncedDoc = this.doc;
    if (!syncedDoc) {
      this._deleted = true;
      this._loading = false;
      return;
    }

    this._checkCycle();
    this._pageMode = this._pageService.getPageMode(this.model.pageId);
    this._pageUpdatedAt = this._pageService.getPageUpdatedAt(this.model.pageId);

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

    if (this._pageMode === 'page') {
      this._checkEmpty();
    }

    this._loading = false;

    if (!this._error && !this._cycle) {
      await this.updateComplete;

      const syncedDocEditorHost = this.syncedDocEditorHost;
      assertExists(syncedDocEditorHost);
      this._disposables.add(
        UIEventDispatcher.slots.activeChanged.on(() => {
          this._editing = syncedDocEditorHost.std.event.isActive;
          if (!this._editing && this._pageMode === 'page') {
            this._checkEmpty();
          }
        })
      );
    }
  }

  private _whenHover = new HoverController(
    this,
    ({ abortController }) => {
      if (this._editing) {
        return null;
      }

      UIEventDispatcher.slots.activeChanged.once(() => {
        if (!this.std.event.isActive) {
          abortController.abort();
        }
      });

      const selection = this.host.selection;
      const textSelection = selection.find('text');
      if (
        !!textSelection &&
        (!!textSelection.to || !!textSelection.from.length)
      ) {
        return null;
      }

      const blockSelections = selection.filter('block');
      if (
        blockSelections.length > 1 ||
        (blockSelections.length === 1 && blockSelections[0].path !== this.path)
      ) {
        return null;
      }

      return {
        template: html`
          <style>
            :host {
              z-index: 1;
            }
          </style>
          <embed-card-toolbar
            .block=${this}
            .abortController=${abortController}
          ></embed-card-toolbar>
        `,
        computePosition: {
          referenceElement: this,
          placement: 'top-start',
          middleware: [flip(), offset(4)],
          autoUpdate: true,
        },
      };
    },
    {
      allowMultiple: true,
    }
  );

  private _handlePointerDown = (event: MouseEvent) => {
    if (this._editing) {
      event.stopPropagation();
    }
  };

  private _handleOverlayDblClick = (event: MouseEvent) => {
    event.stopPropagation();
    const syncedDocEditorHost = this.syncedDocEditorHost;
    assertExists(syncedDocEditorHost);
    syncedDocEditorHost.std.event.activate();
  };

  open = () => {
    const syncedDocId = this.model.pageId;
    if (syncedDocId === this.model.page.id) return;

    const pageElement = this.std.view.viewFromPath('block', [
      this.model.page.root?.id ?? '',
    ]) as PageBlockComponent | null;
    assertExists(pageElement);

    pageElement.slots.pageLinkClicked.emit({ pageId: syncedDocId });
  };

  covertToInline = () => {
    const { page, pageId } = this.model;
    const parent = page.getParent(this.model);
    assertExists(parent);
    const index = parent.children.indexOf(this.model);

    const yText = new Workspace.Y.Text();
    yText.insert(0, REFERENCE_NODE);
    yText.format(0, REFERENCE_NODE.length, {
      reference: { type: 'LinkedPage', pageId },
    });
    const text = new page.Text(yText);

    page.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    page.deleteBlock(this.model);
  };

  convertToCard = () => {
    const { page, pageId, caption, xywh } = this.model;

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
      const parent = page.getParent(this.model);
      assertExists(parent);
      const index = parent.children.indexOf(this.model);

      page.addBlock(
        'affine:embed-linked-doc',
        { pageId, caption },
        parent,
        index
      );

      this.std.selection.setGroup('note', []);
    }
    page.deleteBlock(this.model);
  };

  refreshData = () => {
    this._load().catch(e => {
      console.error(e);
      this._error = true;
    });
  };

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

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.syncedDocCard?.requestUpdate();
  }

  override render() {
    const { style, xywh } = this.model;

    this._cardStyle = style;

    const bound = Bound.deserialize(xywh);
    this._width = this.isInSurface ? bound.w : EMBED_CARD_WIDTH[style];
    this._height = this.isInSurface ? bound.h : EMBED_CARD_HEIGHT[style];

    const syncedDoc = this.doc;
    const { isLoading, isError, isDeleted, isCycle, isEditing, isEmpty } =
      this.blockState;
    const isInSurface = this.isInSurface;
    const pageMode = this.pageMode;

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
            ${isInSurface || !isCycle
              ? nothing
              : ref(this._whenHover.setReference)}
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
        height: `${pageMode === 'page' && isEditing ? `max-content` : `${height}px`}`,
        minHeight: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      });
    }

    const isSelected = !!this.selected?.is('block');
    const theme = getThemeMode();
    const EditorBlockSpec =
      pageMode === 'page' ? DocEditorBlockSpecs : EdgelessEditorBlockSpecs;

    this.setAttribute('data-nested-editor', 'true');
    const scale = isInSurface ? this.model.scale ?? 1 : undefined;

    return this.renderEmbed(
      () => html`
        <div
          ${isInSurface || isEditing
            ? nothing
            : ref(this._whenHover.setReference)}
          class=${classMap({
            'affine-embed-synced-doc-container': true,
            [pageMode]: true,
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
              'affine-doc-viewport': pageMode === 'page',
              'affine-edgeless-viewport': pageMode === 'edgeless',
            })}
          >
            ${this.host.renderSpecPortal(syncedDoc, EditorBlockSpec)}
            ${isEmpty && !isEditing && pageMode === 'page'
              ? html`
                  <div class="affine-embed-synced-doc-editor-empty">
                    <span>This is a linked doc, you can add content here.</span>
                  </div>
                `
              : nothing}
          </div>

          ${isInSurface && !isEditing
            ? html`
                <div
                  class="affine-embed-synced-doc-editor-overlay"
                  @dblclick=${this._handleOverlayDblClick}
                ></div>
              `
            : nothing}
        </div>

        ${isInSurface
          ? html`<embed-card-caption .block=${this}></embed-card-caption>`
          : nothing}

        <affine-block-selection .block=${this}></affine-block-selection>
      `
    );
  }
}
