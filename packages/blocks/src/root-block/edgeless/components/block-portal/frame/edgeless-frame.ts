import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { FrameBlockModel } from '../../../../../frame-block/index.js';
import {
  Bound,
  type SerializedXYWH,
} from '../../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

const NESTED_FRAME_OFFSET = 4;

@customElement('edgeless-frame-title')
export class EdgelessFrameTitle extends WithDisposable(ShadowlessElement) {
  static override styles = css`
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

  @state()
  private accessor _editing = false;

  @state()
  private accessor _isNavigator = false;

  @query('.affine-frame-title')
  private accessor _frameTitleEl!: HTMLDivElement;

  @state()
  private accessor _nestedFrame = false;

  @state()
  private accessor _frameTitle = '';

  @state()
  private accessor _xywh: SerializedXYWH | null = null;

  private _cachedWidth = 0;

  private _cachedHeight = 0;

  @property({ attribute: false })
  accessor frame!: FrameBlockModel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor zoom!: number;

  private _updateFrameTitleSize() {
    const { _nestedFrame, zoom } = this;
    const { elementBound } = this.frame;
    const width = this._cachedWidth / zoom;
    const height = this._cachedHeight / zoom;

    if (width && height) {
      this.frame.externalXYWH = `[${
        elementBound.x + (_nestedFrame ? NESTED_FRAME_OFFSET / zoom : 0)
      },${
        elementBound.y +
        (_nestedFrame
          ? NESTED_FRAME_OFFSET / zoom
          : -(height + NESTED_FRAME_OFFSET / zoom))
      },${width},${height}]`;
    }
  }

  private _isInsideFrame() {
    return this.edgeless.service.layer.framesGrid.has(
      this.frame.elementBound,
      true,
      true,
      new Set([this.frame])
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    const { _disposables, edgeless } = this;
    const { surface } = edgeless;

    this._nestedFrame = this._isInsideFrame();

    _disposables.add(
      edgeless.doc.slots.blockUpdated.on(payload => {
        if (
          (payload.type === 'update' &&
            payload.props.key === 'xywh' &&
            edgeless.doc.getBlock(payload.id)?.model instanceof
              FrameBlockModel) ||
          (payload.type === 'add' && payload.flavour === 'affine:frame')
        ) {
          this._nestedFrame = this._isInsideFrame();
        }
      })
    );

    _disposables.add(
      this.frame.propsUpdated.on(() => {
        this._xywh = this.frame.xywh;
        this.requestUpdate();
      })
    );

    _disposables.add(
      edgeless.service.selection.slots.updated.on(() => {
        this._editing =
          edgeless.service.selection.selectedIds[0] === this.frame.id &&
          edgeless.service.selection.editing;
      })
    );

    _disposables.add(() => {
      surface.edgeless.slots.edgelessToolUpdated.on(tool => {
        this._isNavigator = tool.type === 'frameNavigator';
      });
    });

    const updateTitle = () => {
      this._frameTitle = this.frame.title.toString();
    };
    _disposables.add(() => {
      this.frame.title.yText.unobserve(updateTitle);
    });
    this.frame.title.yText.observe(updateTitle);

    this._frameTitle = this.frame.title.toString();
    this._xywh = this.frame.xywh;
  }

  override updated(_changedProperties: Map<string, unknown>) {
    if (this.style.display !== 'block' || !this._frameTitleEl) {
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

    if (sizeChanged || _changedProperties.has('zoom')) {
      this._updateFrameTitleSize();
    }
  }

  override render() {
    const model = this.frame;
    const bound = Bound.deserialize(model.xywh);

    const { _isNavigator, _editing, zoom } = this;

    const nestedFrame = this._nestedFrame;
    const maxWidth = nestedFrame
      ? bound.w * zoom - NESTED_FRAME_OFFSET / zoom
      : bound.w * zoom;
    // 32 is the estimated height of title element
    const hidden = 32 / zoom >= bound.h && nestedFrame;
    const transformOperation = [
      `translate(${bound.x}px, ${bound.y}px)`,
      `translate(0%, ${nestedFrame ? 0 : -100}%)`,
      `scale(${1 / zoom})`,
      `translate(${nestedFrame ? NESTED_FRAME_OFFSET : 0}px, ${
        nestedFrame ? NESTED_FRAME_OFFSET : -NESTED_FRAME_OFFSET
      }px)`,
    ];

    return html`
      ${this._frameTitle && !_isNavigator && !_editing
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
}

@customElement('edgeless-block-portal-frame')
class EdgelessBlockPortalFrame extends EdgelessPortalBase<FrameBlockModel> {
  override render() {
    const { model, index } = this;
    const bound = Bound.deserialize(model.xywh);
    const style = styleMap({
      position: 'absolute',
      zIndex: `${index}`,
      left: `${bound.x}px`,
      top: `${bound.y}px`,
      transformOrigin: '0px 0px',
    });

    return html`
      <div class="edgeless-block-portal-frame" style=${style}>
        ${this.renderModel(model)}
      </div>
    `;
  }
}

@customElement('edgeless-frames-container')
export class EdgelessFramesContainer extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    edgeless-frames-container {
      display: block;
    }

    edgeless-frames-container > [data-portal-block-id],
    edgeless-frames-container > [data-frame-title-id] {
      position: relative;
    }
  `;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor frames!: FrameBlockModel[];

  @property({ attribute: false })
  accessor startIndex!: number;

  @property({ attribute: false })
  accessor visibleFrames!: Set<FrameBlockModel>;

  protected override render() {
    const { visibleFrames, edgeless, startIndex } = this;
    const zoom = edgeless.service.viewport.zoom;

    return repeat(
      this.frames,
      frame => frame.id,
      (frame, index) => html`
        <edgeless-frame-title
          data-frame-title-id=${frame.id}
          style=${`z-index: ${startIndex + index};${visibleFrames.has(frame) ? 'display:block' : ''}`}
          .frame=${frame}
          .edgeless=${this.edgeless}
          .zoom=${zoom}
        >
        </edgeless-frame-title>
        <edgeless-block-portal-frame
          data-portal-block-id=${frame.id}
          .index=${1}
          .model=${frame}
          .surface=${this.edgeless.surface}
          .edgeless=${this.edgeless}
          .updatingSet=${this.edgeless.rootElementContainer.renderingSet}
          .concurrentUpdatingCount=${this.edgeless.rootElementContainer
            .concurrentRendering}
          style=${`pointer-events: none; z-index: ${startIndex + index};${visibleFrames.has(frame) ? 'display:block' : ''}`}
        >
        </edgeless-block-portal-frame>
      `
    );
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() => {
        // if zoom changed we need to re-render the frame titles
        this.requestUpdate();
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frames-container': EdgelessFramesContainer;
    'edgeless-block-portal-frame': EdgelessBlockPortalFrame;
    'edgeless-frame-title': EdgelessFrameTitle;
  }
}
