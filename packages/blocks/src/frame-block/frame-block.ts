import type { BlockStdScope } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';

import { FrameBlockModel } from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import {
  GfxBlockComponent,
  ShadowlessElement,
  WithDisposable,
  docContext,
  modelContext,
  stdContext,
} from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { Bound, type SerializedXYWH } from '@blocksuite/global/utils';
import { consume } from '@lit/context';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../root-block/index.js';

const NESTED_FRAME_OFFSET = 4;

@customElement('edgeless-frame-title')
export class EdgelessFrameTitle extends WithDisposable(ShadowlessElement) {
  private _cachedHeight = 0;

  private _cachedWidth = 0;

  static override styles = css`
    edgeless-frame-title {
      position: relative;
    }

    .affine-frame-title {
      position: absolute;
      z-index: 1;
      left: 0px;
      top: 0px;
      border-radius: 4px;
      width: fit-content;
      padding: 8px 10px;
      font-size: 14px;
      cursor: default;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transform-origin: left bottom;
      line-height: normal;
    }
  `;

  private _isInsideFrame() {
    return this.gfx.grid.has(
      this.model.elementBound,
      true,
      true,
      model => model !== this.model && model instanceof FrameBlockModel
    );
  }

  private _updateFrameTitleSize() {
    const { _nestedFrame, _zoom: zoom } = this;
    const { elementBound } = this.model;
    const width = this._cachedWidth / zoom;
    const height = this._cachedHeight / zoom;

    if (width && height) {
      this.model.externalXYWH = `[${
        elementBound.x + (_nestedFrame ? NESTED_FRAME_OFFSET / zoom : 0)
      },${
        elementBound.y +
        (_nestedFrame
          ? NESTED_FRAME_OFFSET / zoom
          : -(height + NESTED_FRAME_OFFSET / zoom))
      },${width},${height}]`;

      this.gfx.grid.update(this.model);
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    const { _disposables, doc, gfx, rootService } = this;

    this._nestedFrame = this._isInsideFrame();

    _disposables.add(
      doc.slots.blockUpdated.on(payload => {
        if (
          (payload.type === 'update' &&
            payload.props.key === 'xywh' &&
            doc.getBlock(payload.id)?.model instanceof FrameBlockModel) ||
          (payload.type === 'add' && payload.flavour === 'affine:frame')
        ) {
          this._nestedFrame = this._isInsideFrame();
        }
      })
    );

    _disposables.add(
      this.model.propsUpdated.on(() => {
        this._xywh = this.model.xywh;
        this.requestUpdate();
      })
    );

    _disposables.add(
      rootService.selection.slots.updated.on(() => {
        this._editing =
          rootService.selection.selectedIds[0] === this.model.id &&
          rootService.selection.editing;
      })
    );

    _disposables.add(
      rootService.slots.edgelessToolUpdated.on(tool => {
        this._isNavigator = tool.type === 'frameNavigator';
      })
    );

    _disposables.add(
      gfx.viewport.viewportUpdated.on(({ zoom }) => {
        this._zoom = zoom;
      })
    );

    this._zoom = gfx.viewport.zoom;

    const updateTitle = () => {
      this._frameTitle = this.model.title.toString();
    };
    _disposables.add(() => {
      this.model.title.yText.unobserve(updateTitle);
    });
    this.model.title.yText.observe(updateTitle);

    this._frameTitle = this.model.title.toString();
    this._xywh = this.model.xywh;
  }

  override render() {
    const model = this.model;
    const bound = Bound.deserialize(model.xywh);

    const { _isNavigator, _editing, _zoom: zoom } = this;

    const nestedFrame = this._nestedFrame;
    const maxWidth = nestedFrame
      ? bound.w * zoom - NESTED_FRAME_OFFSET / zoom
      : bound.w * zoom;
    // 32 is the estimated height of title element
    const hidden = 32 / zoom >= bound.h && nestedFrame;
    const transformOperation = [
      `translate(0%, ${nestedFrame ? 0 : -100}%)`,
      `scale(${1 / zoom})`,
      `translate(${nestedFrame ? NESTED_FRAME_OFFSET : 0}px, ${
        nestedFrame ? NESTED_FRAME_OFFSET : -NESTED_FRAME_OFFSET
      }px)`,
    ];

    return html`
      ${this._frameTitle &&
      this._frameTitle.length !== 0 &&
      !_isNavigator &&
      !_editing
        ? html`
            <div
              style=${styleMap({
                display: hidden ? 'none' : 'initial',
                transform: transformOperation.join(' '),
                maxWidth: maxWidth + 'px',
                transformOrigin: nestedFrame ? 'top left' : 'bottom left',
                background: nestedFrame
                  ? 'var(--affine-white)'
                  : 'var(--affine-text-primary-color)',
                color: nestedFrame
                  ? 'var(--affine-text-secondary-color)'
                  : 'var(--affine-white)',
                border: nestedFrame
                  ? '1px solid var(--affine-border-color)'
                  : 'none',
              })}
              class="affine-frame-title"
            >
              ${this._frameTitle}
            </div>
          `
        : nothing}
    `;
  }

  override updated(_changedProperties: Map<string, unknown>) {
    if (
      (!this.gfx.viewport.viewportBounds.contains(this.model.elementBound) &&
        !this.gfx.viewport.viewportBounds.isIntersectWithBound(
          this.model.elementBound
        )) ||
      !this._frameTitleEl
    ) {
      return;
    }

    let sizeChanged = false;
    if (
      this._cachedWidth === 0 ||
      this._cachedHeight === 0 ||
      _changedProperties.has('_frameTitle') ||
      _changedProperties.has('_nestedFrame') ||
      _changedProperties.has('_xywh')
    ) {
      this._cachedWidth = this._frameTitleEl.clientWidth;
      this._cachedHeight = this._frameTitleEl.clientHeight;
      sizeChanged = true;
    }

    if (sizeChanged || _changedProperties.has('_zoom')) {
      this._updateFrameTitleSize();
    }
  }

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }

  @state()
  private accessor _editing = false;

  @state()
  private accessor _frameTitle = '';

  @query('.affine-frame-title')
  private accessor _frameTitleEl!: HTMLDivElement;

  @state()
  private accessor _isNavigator = false;

  @state()
  private accessor _nestedFrame = false;

  @state()
  private accessor _xywh: SerializedXYWH | null = null;

  @state()
  private accessor _zoom!: number;

  @consume({ context: docContext })
  accessor doc!: Doc;

  @consume({ context: modelContext })
  accessor model!: FrameBlockModel;

  @consume({
    context: stdContext,
  })
  accessor std!: BlockStdScope;
}

@customElement('affine-frame')
export class FrameBlockComponent extends GfxBlockComponent<FrameBlockModel> {
  override connectedCallback() {
    super.connectedCallback();

    this._disposables.add(
      this.doc.slots.blockUpdated.on(({ type, id }) => {
        if (id === this.model.id && type === 'update') {
          this.requestUpdate();
        }
      })
    );
  }

  override firstUpdated() {
    this.rootService.slots.edgelessToolUpdated.on(tool => {
      this._isNavigator = tool.type === 'frameNavigator';
    });
  }

  override renderGfxBlock() {
    const { model, _isNavigator, showBorder, rootService } = this;
    const backgroundColor = ThemeObserver.generateColorProperty(
      model.background,
      '--affine-platte-transparent'
    );
    const frameIndex = rootService.layer.getZIndex(model);

    return html`
      <edgeless-frame-title
        style=${styleMap({
          zIndex: 2147483647 - -frameIndex,
        })}
      ></edgeless-frame-title>
      <div
        class="affine-frame-container"
        style=${styleMap({
          zIndex: `${frameIndex}`,
          backgroundColor,
          height: '100%',
          width: '100%',
          borderRadius: '8px',
          border:
            _isNavigator || !showBorder
              ? 'none'
              : `2px solid var(--affine-black-30)`,
        })}
      ></div>
    `;
  }

  override toZIndex(): string {
    return 'auto';
  }

  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }

  @state()
  private accessor _isNavigator = false;

  @state()
  accessor showBorder = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-frame': FrameBlockComponent;
  }
}
