import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { FrameBlockModel } from '../../../../../frame-block/index.js';
import { Bound } from '../../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

const FRAME_OFFSET = 8;

@customElement('edgeless-frame-title')
export class EdgelessFrameTitle extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  frame!: FrameBlockModel;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @state()
  private _editing = false;

  @state()
  private _isNavigator = false;

  private _isInner = false;

  get isInner() {
    return this._isInner;
  }

  private _updateElement = () => {
    this.requestUpdate();
  };

  override connectedCallback() {
    super.connectedCallback();

    const { _disposables, edgeless } = this;
    const { service, surface } = edgeless;

    _disposables.add(
      service.viewport.viewportUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      this.frame.propsUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      this.frame.page.slots.blockUpdated.on(({ type, id }) => {
        if (type === 'update' && id === this.frame.id) {
          this.requestUpdate();
        }

        if (type === 'delete' && id === this.frame.id) {
          this.remove();
        }
      })
    );

    _disposables.add(
      edgeless.service.selection.slots.updated.on(() => {
        this._editing =
          edgeless.service.selection.selectedIds[0] === this.frame.id &&
          edgeless.service.selection.editing;
      })
    );

    surface.edgeless.slots.edgelessToolUpdated.on(tool => {
      this._isNavigator = tool.type === 'frameNavigator';
    });

    this.setAttribute('data-frame-title-id', this.frame.id);

    this.frame.title.yText.observe(this._updateElement);
    _disposables.add(() => {
      this.frame.title.yText.unobserve(this._updateElement);
    });
  }

  override render() {
    const model = this.frame;
    const bound = Bound.deserialize(model.xywh);

    const { frames, viewport } = this.edgeless.service;
    const { zoom } = viewport;

    this._isInner = frames.some(
      frame =>
        frame.id !== model.id && Bound.deserialize(frame.xywh).contains(bound)
    );

    const { _isNavigator, _editing, _isInner } = this;

    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const left = (_isInner ? FRAME_OFFSET : 0) + x;
    const top = (_isInner ? FRAME_OFFSET : -(29 + FRAME_OFFSET)) + y;
    const maxWidth = _isInner
      ? bound.w * zoom - FRAME_OFFSET / zoom
      : bound.w * zoom;
    const hidden = 32 / zoom > bound.h && _isInner;

    const text = model.title.toString();

    return html`
      ${text && !_isNavigator && !_editing
        ? html`
            <div
              style=${styleMap({
                display: hidden ? 'none' : 'initial',
                position: 'absolute',
                zIndex: 1,
                left: '0px',
                top: '0px',
                transform: `translate(${left}px, ${top}px)`,
                borderRadius: '4px',
                width: 'fit-content',
                maxWidth: maxWidth + 'px',
                padding: '8px 10px',
                fontSize: '14px',
                background: _isInner
                  ? 'var(--affine-white)'
                  : 'var(--affine-text-primary-color)',
                color: _isInner
                  ? 'var(--affine-text-secondary-color)'
                  : 'var(--affine-white)',
                cursor: 'default',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                border: _isInner
                  ? '1px solid var(--affine-border-color)'
                  : 'none',
              })}
              class="affine-frame-title"
            >
              ${text}
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
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frames!: FrameBlockModel[];

  @property({ attribute: false })
  onlyTitle = false;

  protected override firstUpdated() {
    const { _disposables } = this;

    _disposables.add(
      this.edgeless.surface.page.slots.blockUpdated.on(({ flavour }) => {
        if (flavour === 'affine:frame') {
          this.requestUpdate();
        }
      })
    );
  }

  protected override render() {
    return html`
      ${repeat(
        this.frames,
        frame => frame.id,
        (frame, index) =>
          this.onlyTitle
            ? html`
                <edgeless-frame-title
                  .frame=${frame}
                  .edgeless=${this.edgeless}
                >
                </edgeless-frame-title>
              `
            : html`
                <edgeless-block-portal-frame
                  .index=${index}
                  .model=${frame}
                  .surface=${this.surface}
                  .edgeless=${this.edgeless}
                >
                </edgeless-block-portal-frame>
              `
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frames-container': EdgelessFramesContainer;
    'edgeless-block-portal-frame': EdgelessBlockPortalFrame;
    'edgeless-frame-title': EdgelessFrameTitle;
  }
}
