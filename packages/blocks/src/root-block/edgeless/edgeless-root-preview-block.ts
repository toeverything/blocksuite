import type { RootBlockModel } from '@blocksuite/affine-model';
import type { SurfaceSelection } from '@blocksuite/block-std';
import type { IBound } from '@blocksuite/global/utils';

import { BlockComponent } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import type { SurfaceBlockComponent } from '../../surface-block/surface-block.js';
import type { SurfaceBlockModel } from '../../surface-block/surface-model.js';
import type { FontLoader } from '../font-loader/font-loader.js';
import type { EdgelessRootBlockWidgetName } from '../types.js';
import type { EdgelessRootService } from './edgeless-root-service.js';

import { requestThrottledConnectedFrame } from '../../_common/utils/index.js';
import '../../surface-block/surface-block.js';
import './components/note-slicer/index.js';
import './components/presentation/edgeless-navigator-black-background.js';
import './components/rects/edgeless-dragging-area-rect.js';
import './components/rects/edgeless-selected-rect.js';
import './components/toolbar/edgeless-toolbar.js';
import { edgelessElementsBound } from './utils/bound-utils.js';
import { getBackgroundGrid, isCanvasElement } from './utils/query.js';

@customElement('affine-edgeless-root-preview')
export class EdgelessRootPreviewBlockComponent extends BlockComponent<
  RootBlockModel,
  EdgelessRootService,
  EdgelessRootBlockWidgetName
> {
  private _refreshLayerViewport = requestThrottledConnectedFrame(() => {
    const { zoom, translateX, translateY } = this.service.viewport;
    const { gap } = getBackgroundGrid(zoom, true);

    this.background.style.setProperty(
      'background-position',
      `${translateX}px ${translateY}px`
    );
    this.background.style.setProperty('background-size', `${gap}px ${gap}px`);

    this.layer.style.setProperty('transform', this._getLayerViewport());
    this.layer.dataset.scale = zoom.toString();
  }, this);

  private _resizeObserver: ResizeObserver | null = null;

  private _viewportElement: HTMLElement | null = null;

  static override styles = css`
    affine-edgeless-root {
      -webkit-user-select: none;
      user-select: none;
      display: block;
      height: 100%;
    }

    .widgets-container {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout;
      z-index: 1;
      height: 100%;
    }

    .edgeless-background {
      height: 100%;
      background-color: var(--affine-background-primary-color);
      background-image: radial-gradient(
        var(--affine-edgeless-grid-color) 1px,
        var(--affine-background-primary-color) 1px
      );
    }

    .edgeless-layer {
      position: absolute;
      top: 0;
      left: 0;
      contain: size layout style;
    }

    @media print {
      .selected {
        background-color: transparent !important;
      }
    }
  `;

  fontLoader!: FontLoader;

  mouseRoot!: HTMLElement;

  private _getLayerViewport(negative = false) {
    const { translateX, translateY, zoom } = this.service.viewport;

    if (negative) {
      return `scale(${1 / zoom}) translate(${-translateX}px, ${-translateY}px)`;
    }

    return `translate(${translateX}px, ${translateY}px) scale(${zoom})`;
  }

  private _initFontLoader() {
    const fontLoader = this.service?.fontLoader;
    assertExists(fontLoader);

    fontLoader.ready
      .then(() => {
        this.surface.refresh();
      })
      .catch(console.error);
  }

  private _initPixelRatioChangeEffect() {
    let media: MediaQueryList;

    const onPixelRatioChange = () => {
      if (media) {
        this.service.viewport.onResize();
        media.removeEventListener('change', onPixelRatioChange);
      }

      media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      media.addEventListener('change', onPixelRatioChange);
    };

    onPixelRatioChange();

    this._disposables.add(() => {
      media?.removeEventListener('change', onPixelRatioChange);
    });
  }

  private _initResizeEffect() {
    if (!this._viewportElement) {
      return;
    }

    const resizeObserver = new ResizeObserver((_: ResizeObserverEntry[]) => {
      // FIXME: find a better way to get rid of empty check
      if (!this.service || !this.service.selection || !this.service.viewport) {
        console.error('Service not ready');
        return;
      }
      this.service.selection.set(this.service.selection.surfaceSelections);
      this.service.viewport.onResize();
    });

    resizeObserver.observe(this.viewportElement);
    this._resizeObserver?.disconnect();
    this._resizeObserver = resizeObserver;
  }

  private _initSlotEffects() {
    const { disposables } = this;

    this.disposables.add(
      this.service.themeObserver.mode$.subscribe(() => this.surface.refresh())
    );

    disposables.add(this.service.selection);
  }

  private _initViewport() {
    this.service.viewport.setContainer(this);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.handleEvent('selectionChange', () => {
      const surface = this.host.selection.value.find(
        (sel): sel is SurfaceSelection => sel.is('surface')
      );
      if (!surface) return;

      const el = this.service.getElementById(surface.elements[0]);
      if (isCanvasElement(el)) {
        return true;
      }

      return;
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  override firstUpdated() {
    this._initSlotEffects();
    this._initResizeEffect();
    this._initPixelRatioChangeEffect();
    this._initFontLoader();
    this._initViewport();

    this._disposables.add(
      this.service.viewport.viewportUpdated.on(() => {
        this._refreshLayerViewport();
      })
    );

    this._refreshLayerViewport();
  }

  getElementsBound(): IBound | null {
    const { service } = this;
    return edgelessElementsBound([...service.elements, ...service.blocks]);
  }

  override renderBlock() {
    return html`
      <div class="edgeless-background edgeless-container">
        <div class="edgeless-layer">
          ${this.renderChildren(this.model)}${this.renderChildren(
            this.surfaceBlockModel
          )}
        </div>
      </div>
    `;
  }

  override willUpdate(_changedProperties: Map<PropertyKey, unknown>): void {
    if (_changedProperties.has('editorViewportSelector')) {
      this._initResizeEffect();
    }
  }

  get dispatcher() {
    return this.service?.uiEventDispatcher;
  }

  get surfaceBlockModel() {
    return this.model.children.find(
      child => child.flavour === 'affine:surface'
    ) as SurfaceBlockModel;
  }

  get viewportElement(): HTMLElement {
    if (this._viewportElement) return this._viewportElement;
    this._viewportElement = this.host.closest(
      this.editorViewportSelector
    ) as HTMLElement | null;
    assertExists(this._viewportElement);
    return this._viewportElement;
  }

  @query('.edgeless-background')
  accessor background!: HTMLDivElement;

  @state()
  accessor editorViewportSelector = '.affine-edgeless-viewport';

  @query('.edgeless-layer')
  accessor layer!: HTMLDivElement;

  @query('affine-surface')
  accessor surface!: SurfaceBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-root-preview': EdgelessRootPreviewBlockComponent;
  }
}
