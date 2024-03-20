import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import { css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { AttachmentBlockModel } from '../../attachment-block/attachment-model.js';
import type { BookmarkBlockModel } from '../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaModel } from '../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../../embed-github-block/embed-github-model.js';
import type { EmbedHtmlModel } from '../../embed-html-block/embed-html-model.js';
import type { EmbedLinkedDocModel } from '../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedLoomModel } from '../../embed-loom-block/embed-loom-model.js';
import type { EmbedSyncedDocModel } from '../../embed-synced-doc-block/embed-synced-doc-model.js';
import type { EmbedYoutubeModel } from '../../embed-youtube-block/embed-youtube-model.js';
import type { ImageBlockModel } from '../../image-block/image-model.js';
import { Bound } from '../../surface-block/utils/bound.js';

@customElement('surface-ref-generic-block-portal')
export class SurfaceRefGenericBlockPortal extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    surface-ref-generic-block-portal {
      position: relative;
    }
  `;

  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!:
    | ImageBlockModel
    | AttachmentBlockModel
    | BookmarkBlockModel
    | EmbedGithubModel
    | EmbedYoutubeModel
    | EmbedFigmaModel
    | EmbedLinkedDocModel
    | EmbedSyncedDocModel
    | EmbedHtmlModel
    | EmbedLoomModel;

  @property({ attribute: false })
  renderModel!: (model: BlockModel) => TemplateResult;

  override firstUpdated() {
    this.disposables.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );
  }

  override render() {
    const { model, index } = this;
    const bound = Bound.deserialize(model.xywh);
    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: `${bound.h}px`,
      transform: `translate(${bound.x}px, ${bound.y}px)`,
    };

    return html`
      <div
        style=${styleMap(style)}
        data-portal-reference-block-id="${model.id}"
      >
        ${this.renderModel(model)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-generic-block-portal': SurfaceRefGenericBlockPortal;
  }
}
