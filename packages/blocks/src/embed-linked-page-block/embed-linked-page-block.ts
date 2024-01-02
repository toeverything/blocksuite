import { assertExists } from '@blocksuite/global/utils';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import { matchFlavours } from '../_common/utils/index.js';
import type { ImageBlockModel } from '../image-block/index.js';
import type { EmbedLinkedPageBlockModel } from './embed-linked-page-model.js';
import type { EmbedLinkedPageBlockService } from './embed-linked-page-service.js';

@customElement('affine-embed-linked-page-block')
export class EmbedLinkedPageBlock extends EmbedBlockElement<
  EmbedLinkedPageBlockModel,
  EmbedLinkedPageBlockService
> {
  static override styles = css`
    affine-embed-linked-page-block {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  @state()
  private _loaded = false;

  @state()
  private _abstractCover: TemplateResult = html`${nothing}`;

  private get _linkedPage() {
    const page = this.std.workspace.getPage(this.model.pageId);
    assertExists(
      page,
      `Trying to load page ${this.model.pageId} in linked page block, but the page is not found.`
    );

    return page;
  }

  private get _service() {
    const service = super.service;
    assertExists(service, `Linked page block must run with its service.`);

    return service;
  }

  private _load() {
    const onLoad = () => {
      this._loaded = true;
      this._loadAbstractCover().catch(console.error);
    };

    if (this._loaded) return;

    const page = this._linkedPage;
    if (page.loaded) {
      onLoad();
      return;
    }

    page
      .load()
      .then(() => {
        onLoad();
      })
      .catch(e => {
        console.error(
          `An error occurred while loading page: ${this.model.pageId}`
        );
        console.error(e);
      });
  }

  private _getNoteFromPage() {
    const pageId = this.model.pageId;
    const page = this._linkedPage;

    const note = page.root?.children.find(child =>
      matchFlavours(child, ['affine:note'])
    );
    assertExists(
      note,
      `Trying to get note block in page ${pageId}, but note not found.`
    );

    return note;
  }

  private _getAbstractText() {
    const note = this._getNoteFromPage();

    const blockHasText = note.children.find(child => child.text != null);

    if (!blockHasText) {
      return 'Preview of the page will be displayed here.';
    }

    return blockHasText.text!.toString();
  }

  private async _loadAbstractCover() {
    const pageId = this.model.pageId;
    const mode = this._service.getPageMode(pageId);

    if (mode === 'edgeless') {
      // TODO: get cover from edgeless page
      return;
    }

    const note = this._getNoteFromPage();
    const image = note.children.find(child =>
      matchFlavours(child, ['affine:image'])
    );

    if (!image) {
      return;
    }

    const sourceId = (image as ImageBlockModel).sourceId;
    if (!sourceId) {
      return;
    }

    const storage = this.model.page.blob;
    const blob = await storage.get(sourceId);
    if (!blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    this._abstractCover = html`<img src=${url} draggable="false" />`;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._load();
    this.model.propsUpdated.on(({ key }) => {
      if (key === 'pageId') {
        this._loaded = false;
        this._load();
      }
    });
  }

  override render(): unknown {
    return this.renderEmbed(() => {
      if (!this._loaded) {
        return html`<div>Loading...</div>`;
      }
      const page = this._linkedPage;
      if (!page) {
        return html`<div>Deleted page</div>`;
      }
      const abstractText = this._getAbstractText();
      return html`
        <h3>${page.meta.title}</h3>
        <p>${abstractText}</p>
        ${this._abstractCover}
      `;
    });
  }
}
