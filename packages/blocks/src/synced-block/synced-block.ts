import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';
import '../_common/components/embed-card/embed-card-toolbar.js';

import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { BlockElement } from '@blocksuite/lit';
import { Workspace } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';

import { HoverController } from '../_common/components/hover/index.js';
import { REFERENCE_NODE } from '../_common/inline/presets/nodes/consts.js';
import { getThemeMode } from '../_common/utils/query.js';
import {
  DocEditorBlockSpecs,
  EdgelessEditorBlockSpecs,
} from '../_specs/_specs.js';
import type { PageBlockComponent, PageService } from '../page-block/index.js';
import type { SyncedBlockModel } from './synced-model.js';

export const SYNCED_BLOCK_DEFAULT_WIDTH = 752;
export const SYNCED_BLOCK_DEFAULT_HEIGHT = 455;

@customElement('affine-synced')
export class SyncedBlockComponent extends BlockElement<SyncedBlockModel> {
  static override styles = css`
    affine-synced {
      position: relative;
      display: block;
      left: -24px;
      width: calc(100% + 48px);
      margin: 10px 0;
    }

    affine-synced .affine-doc-page-block-container {
      padding-left: 0;
      padding-right: 0;
    }

    .affine-synced-block {
      border-radius: 8px;
    }
    .affine-synced-block.page {
      display: block;
      padding: 0px 24px;
      width: 100%;
    }
    .affine-synced-block.edgeless {
      display: block;
      padding: 18px 24px;
      width: 100%;
      height: calc(${SYNCED_BLOCK_DEFAULT_HEIGHT}px + 36px);
    }
    .affine-synced-block.hovered.light,
    affine-synced.with-drag-handle > .affine-synced-block.light {
      box-shadow: 0px 0px 0px 2px rgba(0, 0, 0, 0.08);
    }
    .affine-synced-block.hovered.dark,
    affine-synced.with-drag-handle > .affine-synced-block.dark {
      box-shadow: 0px 0px 0px 2px rgba(255, 255, 255, 0.14);
    }
    .affine-synced-block.editing.light {
      box-shadow:
        0px 0px 0px 2px rgba(0, 0, 0, 0.08),
        0px 0px 0px 1px var(--affine-brand-color);
    }
    .affine-synced-block.editing.dark {
      box-shadow:
        0px 0px 0px 2px rgba(255, 255, 255, 0.14),
        0px 0px 0px 1px var(--affine-brand-color);
    }
  `;

  @state()
  private _pageMode: 'page' | 'edgeless' = 'page';

  @state()
  private _loading = false;

  @state()
  private _error = false;

  @state()
  private _hovered = false;

  @state()
  private _editing = false;

  @query('.affine-synced-block > editor-host')
  syncedDocEditorHost?: EditorHost;

  private _isInSurface = false;

  get isInSurface() {
    return this._isInSurface;
  }

  private get _syncedDoc() {
    const page = this.std.workspace.getPage(this.model.pageId);
    return page;
  }

  private async _load() {
    const syncedDoc = this._syncedDoc;
    if (!syncedDoc) {
      return;
    }

    this._loading = true;
    this._error = false;

    const pageService = this.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService, `Page service not found.`);
    this._pageMode = pageService.getPageMode(this.model.pageId);

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

    if (!syncedDoc.root) {
      await new Promise<void>(resolve => {
        syncedDoc.slots.rootAdded.once(() => {
          resolve();
        });
      });
    }

    this._loading = false;
  }

  // private _selectBlock() {
  //   const selectionManager = this.host.selection;
  //   const blockSelection = selectionManager.create('block', {
  //     path: this.path,
  //   });
  //   selectionManager.setGroup('note', [blockSelection]);
  // }

  // private _handleClick(event: MouseEvent) {
  //   event.stopPropagation();
  //   if (this.isInSurface) return;
  //   this._selectBlock();
  // }

  // private _handleDoubleClick(event: MouseEvent) {
  //   event.stopPropagation();
  //   this.open();
  // }

  private _whenHover = new HoverController(this, ({ abortController }) => {
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
    const { page, pageId, caption } = this.model;

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
  }

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    const syncedDocEditorHost = this.syncedDocEditorHost;
    this._editing = !!syncedDocEditorHost?.std.selection.value.length;
  }

  override render() {
    const syncedDoc = this._syncedDoc;
    const isDeleted = !syncedDoc;
    const isLoading = this._loading;
    const isError = this._error;
    if (isDeleted || isLoading || isError) {
      return nothing;
    }

    const theme = getThemeMode();
    const pageMode = this._pageMode;

    const EditorBlockSpec =
      pageMode === 'page' ? DocEditorBlockSpecs : EdgelessEditorBlockSpecs;

    return html`
      <div
        ${this.isInSurface ? nothing : ref(this._whenHover.setReference)}
        class=${classMap({
          'affine-synced-block': true,
          [pageMode]: true,
          [theme]: true,
          hovered: this._hovered,
          editing: this._editing,
        })}
        @pointerenter=${() => (this._hovered = true)}
        @pointerleave=${() => (this._hovered = false)}
      >
        <div
          class=${classMap({
            'affine-doc-viewport': pageMode === 'page',
            'affine-edgeless-viewport': pageMode === 'edgeless',
          })}
        >
          ${this.host.renderSpecPortal(syncedDoc, EditorBlockSpec)}
        </div>

        ${this._isInSurface
          ? html`<embed-card-caption .block=${this}></embed-card-caption>`
          : nothing}

        <affine-block-selection .block=${this}></affine-block-selection>
      </div>
    `;
  }
}
