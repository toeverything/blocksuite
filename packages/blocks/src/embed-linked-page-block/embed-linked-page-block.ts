import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, queryAsync, state } from 'lit/decorators.js';

import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import { matchFlavours } from '../_common/utils/index.js';
import type { ImageBlockModel } from '../image-block/index.js';
import {
  Bound,
  deserializeXYWH,
  getCommonBound,
} from '../surface-block/index.js';
import type {
  SurfaceRefBlockModel,
  SurfaceRefBlockService,
} from '../surface-ref-block/index.js';
import type { SurfaceRefRenderer } from '../surface-ref-block/surface-ref-renderer.js';
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

  private _mode: 'edgeless' | 'page' = 'page';

  @queryAsync('.cover-container')
  private _coverContainer!: Promise<HTMLDivElement>;

  private _surfaceRefService!: SurfaceRefBlockService;

  private _surfaceRefRenderer!: SurfaceRefRenderer;

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
      const pageId = this.model.pageId;
      this._loaded = true;
      this._mode = this._service.getPageMode(pageId);
      this._prepareSurfaceRefRenderer();
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

  private _prepareSurfaceRefRenderer() {
    const service = this.std.spec.getService(
      'affine:surface-ref'
    ) as SurfaceRefBlockService;
    assertExists(service, `Surface ref service not found.`);
    if (this._surfaceRefService !== service) {
      this._surfaceRefService = service;
    }
    this._cleanUpSurfaceRefRenderer();

    const surfaceRefService = this._surfaceRefService;
    const surfaceRefRenderer = surfaceRefService.getRenderer(
      `${PathFinder.id(this.path)}`,
      this._linkedPage
    );
    this._surfaceRefRenderer = surfaceRefRenderer;

    surfaceRefRenderer.slots.mounted.on(async () => {
      if (this._mode === 'edgeless') {
        await this._renderEdgelessAbstract();
        return;
      }

      const note = this._getNoteFromPage();
      const target = note.children.find(child =>
        matchFlavours(child, ['affine:image', 'affine:surface-ref'])
      );

      if (!target) {
        return;
      }

      switch (target.flavour) {
        case 'affine:image':
          await this._renderImageAbstract(target);
          return;
        case 'affine:surface-ref':
          await this._renderSurfaceRefAbstract(target);
          return;
      }
    });

    surfaceRefRenderer.mount();
  }

  private _getAbstractText() {
    const note = this._getNoteFromPage();

    const blockHasText = note.children.find(child => child.text != null);

    if (!blockHasText) {
      return 'Preview of the page will be displayed here.';
    }

    return blockHasText.text!.toString();
  }

  private async _addCover(cover: HTMLElement) {
    const coverContainer = await this._coverContainer;
    if (!coverContainer) {
      return;
    }
    while (coverContainer.firstChild) {
      coverContainer.removeChild(coverContainer.firstChild);
    }
    coverContainer.appendChild(cover);
  }

  private _cleanUpSurfaceRefRenderer() {
    const surfaceRefService = this._surfaceRefService;
    if (this._surfaceRefRenderer) {
      surfaceRefService.removeRenderer(this._surfaceRefRenderer.id);
    }
  }

  private async _renderEdgelessAbstract() {
    const renderer = this._surfaceRefRenderer.surfaceRenderer;
    const container = document.createElement('div');
    await this._addCover(container);
    renderer.attach(container);

    // TODO: we may also need to get bounds of surface block's children
    const bounds = Array.from(this._surfaceRefRenderer.elements.values()).map(
      element => Bound.deserialize(element.xywh)
    );
    const bound = getCommonBound(bounds);
    if (bound) {
      renderer.onResize();
      renderer.setViewportByBound(bound);
    }

    return;
  }

  private async _renderImageAbstract(image: BaseBlockModel) {
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
    const $img = document.createElement('img');
    $img.src = url;
    await this._addCover($img);
  }

  private async _renderSurfaceRefAbstract(surfaceRef: BaseBlockModel) {
    const renderer = this._surfaceRefRenderer.surfaceRenderer;
    const container = document.createElement('div');
    await this._addCover(container);
    renderer.attach(container);

    const referenceId = (surfaceRef as SurfaceRefBlockModel).reference;
    if (!referenceId) {
      return;
    }

    const referencedModel = this._surfaceRefRenderer.getModel(referenceId);
    if (!referencedModel) {
      return;
    }
    const bound = Bound.fromXYWH(deserializeXYWH(referencedModel.xywh));
    renderer.onResize();
    renderer.setViewportByBound(bound);
  }

  override async connectedCallback() {
    super.connectedCallback();
    this._load();
    this.model.propsUpdated.on(({ key }) => {
      if (key === 'pageId') {
        this._loaded = false;
        this._load();
      }
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanUpSurfaceRefRenderer();
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
        <div class="cover-container"></div>
      `;
    });
  }
}
