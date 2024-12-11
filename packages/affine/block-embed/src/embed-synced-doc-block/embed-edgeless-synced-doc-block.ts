import type { AliasInfo } from '@blocksuite/affine-model';

import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import {
  ThemeExtensionIdentifier,
  ThemeProvider,
} from '@blocksuite/affine-shared/services';
import { BlockStdScope } from '@blocksuite/block-std';
import { assertExists, Bound } from '@blocksuite/global/utils';
import { html } from 'lit';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { guard } from 'lit/directives/guard.js';
import { styleMap } from 'lit/directives/style-map.js';

import { toEdgelessEmbedBlock } from '../common/to-edgeless-embed-block.js';
import { EmbedSyncedDocBlockComponent } from './embed-synced-doc-block.js';

export class EmbedEdgelessSyncedDocBlockComponent extends toEdgelessEmbedBlock(
  EmbedSyncedDocBlockComponent
) {
  protected override _renderSyncedView = () => {
    const { syncedDoc, editorMode } = this;

    assertExists(syncedDoc, 'Doc should exist');

    let containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
    });
    const modelScale = this.model.scale ?? 1;
    const bound = Bound.deserialize(this.model.xywh);
    const width = bound.w / modelScale;
    const height = bound.h / modelScale;
    containerStyleMap = styleMap({
      width: `${width}px`,
      height: `${height}px`,
      minHeight: `${height}px`,
      transform: `scale(${modelScale})`,
      transformOrigin: '0 0',
    });

    const themeService = this.std.get(ThemeProvider);
    const themeExtension = this.std.getOptional(ThemeExtensionIdentifier);
    const appTheme = themeService.app$.value;
    let edgelessTheme = themeService.edgeless$.value;
    if (themeExtension?.getEdgelessTheme && this.syncedDoc?.id) {
      edgelessTheme = themeExtension.getEdgelessTheme(this.syncedDoc.id).value;
    }
    const theme = this.isPageMode ? appTheme : edgelessTheme;

    const isSelected = !!this.selected?.is('block');
    const scale = this.model.scale ?? 1;

    this.dataset.nestedEditor = '';

    const renderEditor = () => {
      return choose(editorMode, [
        [
          'page',
          () => html`
            <div class="affine-page-viewport" data-theme=${appTheme}>
              ${new BlockStdScope({
                doc: syncedDoc,
                extensions: this._buildPreviewSpec('page:preview'),
              }).render()}
            </div>
          `,
        ],
        [
          'edgeless',
          () => html`
            <div class="affine-edgeless-viewport" data-theme=${edgelessTheme}>
              ${new BlockStdScope({
                doc: syncedDoc,
                extensions: this._buildPreviewSpec('edgeless:preview'),
              }).render()}
            </div>
          `,
        ],
      ]);
    };

    return this.renderEmbed(
      () => html`
        <div
          class=${classMap({
            'affine-embed-synced-doc-container': true,
            [editorMode]: true,
            [theme]: true,
            selected: isSelected,
            surface: true,
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
          <div class="affine-embed-synced-doc-editor-overlay"></div>
        </div>
      `
    );
  };

  override convertToCard = (aliasInfo?: AliasInfo) => {
    const { id, doc, caption, xywh } = this.model;

    const edgelessService = this.rootService;
    const style = 'vertical';
    const bound = Bound.deserialize(xywh);
    bound.w = EMBED_CARD_WIDTH[style];
    bound.h = EMBED_CARD_HEIGHT[style];

    if (!edgelessService) {
      return;
    }

    // @ts-expect-error TODO: fix after edgeless refactor
    const newId = edgelessService.addBlock(
      'affine:embed-linked-doc',
      {
        xywh: bound.serialize(),
        style,
        caption,
        ...this.referenceInfo,
        ...aliasInfo,
      },
      // @ts-expect-error TODO: fix after edgeless refactor
      edgelessService.surface
    );

    this.std.command.exec('reassociateConnectors', {
      oldId: id,
      newId,
    });

    // @ts-expect-error TODO: fix after edgeless refactor
    edgelessService.selection.set({
      editing: false,
      elements: [newId],
    });
    doc.deleteBlock(this.model);
  };

  get rootService() {
    return this.std.getService('affine:page');
  }

  override renderGfxBlock() {
    const { style, xywh } = this.model;
    const bound = Bound.deserialize(xywh);

    this.embedContainerStyle.width = `${bound.w}px`;
    this.embedContainerStyle.height = `${bound.h}px`;

    this.cardStyleMap = {
      display: 'block',
      width: `${EMBED_CARD_WIDTH[style]}px`,
      height: `${EMBED_CARD_WIDTH[style]}px`,
      transform: `scale(${bound.w / EMBED_CARD_WIDTH[style]}, ${bound.h / EMBED_CARD_HEIGHT[style]})`,
      transformOrigin: '0 0',
    };

    return this.renderPageContent();
  }

  override accessor useCaptionEditor = true;
}
