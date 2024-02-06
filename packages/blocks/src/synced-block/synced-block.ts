import './components/synced-card.js';
import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';
import '../_common/components/embed-card/embed-card-toolbar.js';

import { UIEventDispatcher } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { BlockElement } from '@blocksuite/lit';
import { Workspace } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing, render } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { HoverController } from '../_common/components/hover/index.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { REFERENCE_NODE } from '../_common/inline/presets/nodes/consts.js';
import { matchFlavours } from '../_common/utils/model.js';
import { getThemeMode } from '../_common/utils/query.js';
import {
  DocEditorBlockSpecs,
  EdgelessEditorBlockSpecs,
} from '../_specs/_specs.js';
import type { PageBlockComponent, PageService } from '../page-block/index.js';
import type { DragHandleOption } from '../page-block/widgets/drag-handle/config.js';
import {
  AFFINE_DRAG_HANDLE_WIDGET,
  AffineDragHandleWidget,
} from '../page-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../page-block/widgets/drag-handle/utils.js';
import { Bound } from '../surface-block/utils/bound.js';
import {
  blockStyles,
  SYNCED_BLOCK_DEFAULT_HEIGHT,
  SYNCED_BLOCK_DEFAULT_WIDTH,
} from './styles.js';
import { type SyncedBlockModel, SyncedBlockSchema } from './synced-model.js';

@customElement('affine-synced')
export class SyncedBlockComponent extends BlockElement<SyncedBlockModel> {
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

  @query('embed-card-caption')
  captionElement?: EmbedCardCaption;

  @query('.affine-synced-container > .synced-block-editor > editor-host')
  syncedDocEditorHost?: EditorHost;

  private _isInSurface = false;

  get isInSurface() {
    return this._isInSurface;
  }

  get edgeless() {
    if (!this._isInSurface) {
      return null;
    }
    return this.host.querySelector('affine-edgeless-page');
  }

  get surface() {
    if (!this.isInSurface) return null;
    return this.host.querySelector('affine-surface');
  }

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
    const pageService = this.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService, `Page service not found.`);
    return pageService;
  }

  private _checkCycle() {
    let editorHost: EditorHost | null = this.host;
    while (editorHost && !this._cycle) {
      this._cycle = !!editorHost && editorHost.page.id === this.model.pageId;
      editorHost =
        editorHost.parentElement?.closest<EditorHost>('editor-host') ?? null;
    }
  }

  private async _load() {
    this._loading = true;
    this._error = false;
    this._deleted = false;
    this._cycle = false;

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
      await new Promise<void>(resolve => {
        syncedDoc
          .load()
          .then(() => resolve())
          .catch(e => {
            console.error(e);
            this._error = true;
            resolve();
          });
      });
    }

    if (!this._error && !syncedDoc.root) {
      await new Promise<void>(resolve => {
        syncedDoc.slots.rootAdded.once(() => {
          resolve();
        });
      });
    }

    this._loading = false;

    if (!this._error && !this._cycle) {
      await this.updateComplete;

      const syncedDocEditorHost = await this.syncedDocEditorHost;
      assertExists(syncedDocEditorHost);
      this._disposables.add(
        UIEventDispatcher.slots.activeChanged.on(() => {
          this._editing = syncedDocEditorHost.std.event.isActive;
        })
      );
    }
  }

  private _whenHover = new HoverController(this, ({ abortController }) => {
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
  });

  private _dragHandleOption: DragHandleOption = {
    flavour: SyncedBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath }) => {
      if (!anchorBlockPath) return false;
      const anchorComponent = this.std.view.viewFromPath(
        'block',
        anchorBlockPath
      );
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [SyncedBlockSchema.model.flavour])
      )
        return false;

      const blockComponent = anchorComponent as SyncedBlockComponent;
      const element = captureEventTarget(state.raw.target);

      const isDraggingByDragHandle = !!element?.closest(
        AFFINE_DRAG_HANDLE_WIDGET
      );
      const isDraggingByComponent = blockComponent.contains(element);
      const isInSurface = blockComponent.isInSurface;

      if (!isInSurface && (isDraggingByDragHandle || isDraggingByComponent)) {
        this.host.selection.setGroup('note', [
          this.host.selection.create('block', {
            path: blockComponent.path,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      } else if (isInSurface && isDraggingByDragHandle) {
        const syncedPortal = blockComponent.closest(
          '.edgeless-block-portal-synced'
        );
        assertExists(syncedPortal);
        const dragPreviewEl = syncedPortal.cloneNode() as HTMLElement;
        dragPreviewEl.style.transform = '';
        dragPreviewEl.style.left = '0';
        dragPreviewEl.style.top = '0';
        render(
          blockComponent.host.renderModel(blockComponent.model),
          dragPreviewEl
        );

        startDragging([blockComponent], state, dragPreviewEl);
        return true;
      }
      return false;
    },
    onDragEnd: props => {
      const { state, draggingElements } = props;
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          SyncedBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = draggingElements[0] as SyncedBlockComponent;
      const isInSurface = blockComponent.isInSurface;
      const target = captureEventTarget(state.raw.target);
      const isTargetEdgelessContainer =
        target?.classList.contains('edgeless') &&
        target?.classList.contains('affine-block-children-container');

      if (isInSurface) {
        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          ...props,
        });
      } else if (isTargetEdgelessContainer) {
        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: '.affine-synced-container',
          width: SYNCED_BLOCK_DEFAULT_WIDTH,
          height: SYNCED_BLOCK_DEFAULT_HEIGHT,
          ...props,
        });
      }

      return false;
    },
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

    const parent = this.host.page.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'pageId') {
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

  override render() {
    const syncedDoc = this.doc;
    const { isLoading, isError, isDeleted, isCycle } = this.blockState;
    const pageMode = this.pageMode;
    const pageUpdatedAt = this.pageUpdatedAt;
    if (isLoading || isError || isDeleted || isCycle || !syncedDoc) {
      let cardStyleMap = styleMap({
        position: 'relative',
        display: 'block',
        width: '100%',
        margin: '18px 0px',
      });
      if (this.isInSurface) {
        const bound = Bound.deserialize(this.model.xywh);
        const scaleX = bound.w / SYNCED_BLOCK_DEFAULT_WIDTH;
        const scaleY = bound.h / SYNCED_BLOCK_DEFAULT_HEIGHT;
        cardStyleMap = styleMap({
          display: 'block',
          width: `${SYNCED_BLOCK_DEFAULT_WIDTH}px`,
          height: `${SYNCED_BLOCK_DEFAULT_HEIGHT}px`,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: '0 0',
        });
      }

      return html`
        <synced-card
          ${this.isInSurface || !isCycle
            ? nothing
            : ref(this._whenHover.setReference)}
          style=${cardStyleMap}
          .block=${this}
          .pageMode=${pageMode}
          .pageUpdatedAt=${pageUpdatedAt}
          .isLoading=${isLoading}
          .isError=${isError}
          .isDeleted=${isDeleted}
          .isCycle=${isCycle}
        ></synced-card>
      `;
    }

    let containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
      margin: '10px 0',
    });
    if (this.isInSurface) {
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
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      });
    }

    const isSelected = !!this.selected?.is('block');
    const theme = getThemeMode();
    const EditorBlockSpec =
      pageMode === 'page' ? DocEditorBlockSpecs : EdgelessEditorBlockSpecs;

    this.setAttribute('data-nested-editor', 'true');

    return html`
      <div
        ${this.isInSurface || this._editing
          ? nothing
          : ref(this._whenHover.setReference)}
        class=${classMap({
          'affine-synced-container': true,
          [pageMode]: true,
          [theme]: true,
          selected: isSelected,
          editing: this._editing,
        })}
        style=${containerStyleMap}
      >
        <div
          class=${classMap({
            'synced-block-editor': true,
            'affine-doc-viewport': pageMode === 'page',
            'affine-edgeless-viewport': pageMode === 'edgeless',
          })}
        >
          ${this.host.renderSpecPortal(syncedDoc, EditorBlockSpec)}
        </div>

        ${this._isInSurface && !this._editing
          ? html`
              <div
                class="synced-block-editor-overlay"
                @dblclick=${this._handleOverlayDblClick}
              ></div>
            `
          : nothing}
      </div>

      ${this._isInSurface
        ? html`<embed-card-caption .block=${this}></embed-card-caption>`
        : nothing}

      <affine-block-selection .block=${this}></affine-block-selection>
    `;
  }
}
