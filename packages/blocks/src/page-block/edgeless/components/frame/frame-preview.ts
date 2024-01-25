import '../../../../surface-ref-block/surface-ref-portal.js';

import { DisposableGroup } from '@blocksuite/global/utils';
import {
  type EditorHost,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/lit';
import { nanoid, type Page } from '@blocksuite/store';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type {
  EdgelessModel,
  TopLevelBlockModel,
} from '../../../../_common/types.js';
import { buildPath } from '../../../../_common/utils/index.js';
import type { FrameBlockModel } from '../../../../frame-block/frame-model.js';
import type { NoteBlockModel } from '../../../../note-block/note-model.js';
import type { SurfaceBlockModel } from '../../../../surface-block/surface-model.js';
import { Bound } from '../../../../surface-block/utils/bound.js';
import { deserializeXYWH } from '../../../../surface-block/utils/xywh.js';
import type { SurfaceRefPortal } from '../../../../surface-ref-block/surface-ref-portal.js';
import type { SurfaceRefRenderer } from '../../../../surface-ref-block/surface-ref-renderer.js';
import type { SurfaceRefBlockService } from '../../../../surface-ref-block/surface-ref-service.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

type RefElement = Exclude<EdgelessModel, NoteBlockModel>;

const DEFAULT_PREVIEW_CONTAINER_WIDTH = 280;
const DEFAULT_PREVIEW_CONTAINER_HEIGHT = 166;

const styles = css`
  .frame-preview-container {
    display: block;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: relative;
  }

  .frame-preview-surface-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
  }

  .frame-preview-surface-viewport {
    max-width: 100%;
    box-sizing: border-box;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    pointer-events: none;
    user-select: none;
  }

  .frame-preview-surface-canvas-container {
    height: 100%;
    width: 100%;
    position: relative;
  }
`;

@customElement('frame-preview')
export class FramePreview extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless: EdgelessPageBlockComponent | null = null;

  @property({ attribute: false })
  frame!: FrameBlockModel;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  surfaceWidth: number = DEFAULT_PREVIEW_CONTAINER_WIDTH;

  @property({ attribute: false })
  surfaceHeight: number = DEFAULT_PREVIEW_CONTAINER_HEIGHT;

  @state()
  fillScreen = false;

  @state()
  private _surfaceModel: SurfaceBlockModel | null = null;

  private _surfaceRefRendererId: string = nanoid();
  private _surfaceRefRenderer!: SurfaceRefRenderer;

  private _edgelessDisposables: DisposableGroup | null = null;
  private _pageDisposables: DisposableGroup | null = null;
  private _frameDisposables: DisposableGroup | null = null;

  @query('.frame-preview-surface-canvas-container')
  container!: HTMLDivElement;

  @query('.frame-preview-surface-container surface-ref-portal')
  blocksPortal!: SurfaceRefPortal;

  get page() {
    return this.host.page;
  }

  get surfaceRenderer() {
    return this._surfaceRefRenderer.surfaceRenderer;
  }

  private _attachRenderer() {
    if (
      this._surfaceRefRenderer?.surfaceRenderer.canvas.isConnected ||
      !this.container ||
      !this.blocksPortal
    )
      return;

    this.surfaceRenderer.attach(this.container);
    if (this.blocksPortal.isUpdatePending) {
      this.blocksPortal.updateComplete
        .then(() => {
          this.blocksPortal.setStackingCanvas(
            this._surfaceRefRenderer.surfaceRenderer.stackingCanvas
          );
        })
        .catch(console.error);
    } else {
      this.blocksPortal.setStackingCanvas(
        this._surfaceRefRenderer.surfaceRenderer.stackingCanvas
      );
    }
  }

  private get _surfaceRefService() {
    const service = this.host.spec.getService('affine:surface-ref') as
      | SurfaceRefBlockService
      | undefined;

    return service;
  }

  private _setupSurfaceRefRenderer() {
    const surfaceRefService = this._surfaceRefService;
    if (!surfaceRefService) return;
    const renderer = surfaceRefService.getRenderer(
      this._surfaceRefRendererId,
      this.page,
      true
    );
    this._surfaceRefRenderer = renderer;

    this._disposables.add(
      renderer.slots.surfaceModelChanged.on(model => {
        this._surfaceModel = model;
      })
    );
    this._disposables.add(
      renderer.slots.surfaceRendererRefresh.on(() => {
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this._surfaceRefRenderer.surfaceService.layer.slots.layerUpdated.on(
        () => {
          this.blocksPortal.setStackingCanvas(
            this._surfaceRefRenderer.surfaceRenderer.stackingCanvas
          );
        }
      )
    );

    renderer.mount();
  }

  private _cleanupSurfaceRefRenderer() {
    const surfaceRefService = this._surfaceRefService;
    if (!surfaceRefService) return;
    surfaceRefService.removeRenderer(this._surfaceRefRendererId);
  }

  private _refreshViewport() {
    if (!this.frame) {
      return;
    }

    const referencedModel = this.frame;

    // trigger a rerender to update element's size
    // and set viewport after element's size has been updated
    this.updateComplete
      .then(() => {
        this.surfaceRenderer.onResize();
        this.surfaceRenderer.setViewportByBound(
          Bound.fromXYWH(deserializeXYWH(referencedModel.xywh))
        );

        this.blocksPortal?.setViewport(this.surfaceRenderer);
      })
      .catch(console.error);
  }

  private _tryLoadFillScreen() {
    if (!this.edgeless) return;

    this.fillScreen =
      this.edgeless.service.editSession.getItem('presentFillScreen') ?? false;
  }

  private _getViewportWH = (referencedModel: RefElement) => {
    const [, , w, h] = deserializeXYWH(referencedModel.xywh);

    let scale = 1;
    if (this.fillScreen) {
      scale = Math.max(this.surfaceWidth / w, this.surfaceHeight / h);
    } else {
      scale = Math.min(this.surfaceWidth / w, this.surfaceHeight / h);
    }

    return {
      width: w * scale,
      height: h * scale,
    };
  };

  private _updateOnElementChange = (element: string | { id: string }) => {
    const id = typeof element === 'string' ? element : element.id;
    const ele = this.edgeless?.service.getElementById(id);
    if (!ele || !ele.xywh) return;
    const frameBound = Bound.deserialize(this.frame.xywh);
    const eleBound = Bound.deserialize(ele.xywh);
    if (!frameBound.isOverlapWithBound(eleBound)) return;

    this._refreshViewport();
  };

  private _clearEdgelessDisposables = () => {
    this._edgelessDisposables?.dispose();
    this._edgelessDisposables = null;
  };

  private _clearPageDisposables = () => {
    this._pageDisposables?.dispose();
    this._pageDisposables = null;
  };

  private _clearFrameDisposables = () => {
    this._frameDisposables?.dispose();
    this._frameDisposables = null;
  };

  private _setEdgelessDisposables(edgeless: EdgelessPageBlockComponent | null) {
    this._clearEdgelessDisposables();
    if (!edgeless) return;
    this._edgelessDisposables = new DisposableGroup();
    this._edgelessDisposables.add(
      edgeless.slots.navigatorSettingUpdated.on(({ fillScreen }) => {
        if (fillScreen !== undefined) {
          this.fillScreen = fillScreen;
          this._refreshViewport();
        }
      })
    );
    this._edgelessDisposables.add(
      edgeless.service.surface.elementAdded.on(this._updateOnElementChange)
    );
    this._edgelessDisposables.add(
      edgeless.service.surface.elementUpdated.on(this._updateOnElementChange)
    );
    this._edgelessDisposables.add(
      edgeless.service.surface.elementRemoved.on(() => {
        this._refreshViewport();
      })
    );
  }

  private _setPageDisposables(page: Page) {
    this._clearPageDisposables();
    this._pageDisposables = new DisposableGroup();

    this._pageDisposables.add(
      page.slots.blockUpdated.on(event => {
        const { type, flavour } = event;
        const isTopLevelBlock = ['affine:image', 'affine:note'].includes(
          flavour
        );
        if (!isTopLevelBlock) return;

        const frameBound = Bound.deserialize(this.frame.xywh);
        if (type === 'delete') {
          const deleteModel = event.model as TopLevelBlockModel;
          const deleteBound = Bound.deserialize(deleteModel.xywh);
          if (frameBound.containsPoint([deleteBound.x, deleteBound.y])) {
            this._refreshViewport();
          }
        } else {
          const topLevelModel = page.getBlockById(event.id);
          const topLevelBlock = this.host.view.viewFromPath(
            'block',
            buildPath(topLevelModel)
          );
          if (!topLevelBlock) return;
          const newBound = Bound.deserialize(
            (topLevelModel as TopLevelBlockModel).xywh
          );
          if (frameBound.containsPoint([newBound.x, newBound.y])) {
            this._refreshViewport();
          }
        }
      })
    );
  }

  private _setFrameDisposables(frame: FrameBlockModel) {
    this._clearFrameDisposables();
    this._frameDisposables = new DisposableGroup();
    this._frameDisposables.add(
      frame.propsUpdated.on(() => {
        this.requestUpdate();
        this._refreshViewport();
      })
    );
  }

  private _renderSurfaceContent(referencedModel: FrameBlockModel) {
    const { width, height } = this._getViewportWH(referencedModel);
    return html`<div
      class="frame-preview-surface-container"
      style=${styleMap({
        width: `${this.surfaceWidth}px`,
        height: `${this.surfaceHeight}px`,
      })}
    >
      <div
        style=${styleMap({
          backgroundColor: referencedModel.background
            ? `var(${referencedModel.background})`
            : 'var(--affine-platte-transparent)',
          borderRadius: '4px',
        })}
      >
        <div
          class="frame-preview-surface-viewport"
          style=${styleMap({
            width: `${width}px`,
            height: `${height}px`,
            aspectRatio: `${width} / ${height}`,
          })}
        >
          <surface-ref-portal
            .page=${this.page}
            .host=${this.host}
            .refModel=${referencedModel}
            .renderModel=${this.host.renderModel}
          ></surface-ref-portal>
          <div class="frame-preview-surface-canvas-container">
            <!-- attach canvas here -->
          </div>
        </div>
      </div>
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._tryLoadFillScreen();
    this._setupSurfaceRefRenderer();
    this._setPageDisposables(this.page);
    this._setEdgelessDisposables(this.edgeless);
  }

  override firstUpdated() {
    this._refreshViewport();
    this._setFrameDisposables(this.frame);
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('edgeless')) {
      if (this.edgeless) {
        this._setEdgelessDisposables(this.edgeless);
      } else {
        this._clearEdgelessDisposables();
      }
    }

    if (_changedProperties.has('host')) {
      if (this.page) {
        this._setPageDisposables(this.page);
      }
    }

    this._attachRenderer();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupSurfaceRefRenderer();
    this._clearEdgelessDisposables();
    this._clearPageDisposables();
    this._clearFrameDisposables();
  }

  override render() {
    const { _surfaceModel, frame, host } = this;
    const noContent = !_surfaceModel || !frame || !frame.xywh || !host;

    return html`<div class="frame-preview-container">
      ${noContent ? nothing : this._renderSurfaceContent(frame)}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-preview': FramePreview;
  }
}
