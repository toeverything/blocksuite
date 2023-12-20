import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { FrameBlockModel } from '../../../../../frame-block/index.js';
import { Bound } from '../../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

const FRAME_OFFSET = 8;

@customElement('edgeless-frame-title')
export class EdgeelssFrameTitle extends WithDisposable(ShadowlessElement) {
  isInner = false;

  @state()
  private _editing = false;

  @state()
  private _isNavigator = false;

  @property({ attribute: false })
  frame!: FrameBlockModel;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @query('.affine-frame-title')
  private _titleElement?: HTMLElement;

  get titleBound() {
    if (!this._titleElement) return new Bound();
    const { viewport } = this.edgeless.surface;
    const { zoom } = viewport;
    const rect = viewport.boundingClientRect;
    const bound = Bound.fromDOMRect(this._titleElement.getBoundingClientRect());
    bound.x -= rect.x;
    bound.y -= rect.y;
    bound.h += FRAME_OFFSET;
    bound.h /= zoom;
    bound.w /= zoom;
    const [x, y] = viewport.toModelCoord(bound.x, bound.y);
    bound.x = x;
    bound.y = y;
    return bound;
  }

  private _updateElement = () => {
    this.requestUpdate();
  };

  override firstUpdated() {
    const { _disposables, edgeless } = this;
    const { surface } = edgeless;

    _disposables.add(
      surface.viewport.slots.viewportUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      edgeless.slots.elementUpdated.on(({ id }) => {
        if (id === this.frame.id) {
          this.requestUpdate();
        }
      })
    );

    _disposables.add(
      edgeless.slots.elementRemoved.on(({ id }) => {
        if (id === this.frame.id) {
          this.remove();
        }
      })
    );

    _disposables.add(
      edgeless.selectionManager.slots.updated.on(({ editing, elements }) => {
        if (elements[0] === this.frame.id && editing) {
          this._editing = true;
        } else {
          this._editing = false;
        }
      })
    );

    surface.edgeless.slots.edgelessToolUpdated.on(tool => {
      this._isNavigator = tool.type === 'frameNavigator' ? true : false;
    });

    this.setAttribute('data-frame-title-id', this.frame.id);

    this.frame.title.yText.observe(this._updateElement);
    _disposables.add(() => {
      this.frame.title.yText.unobserve(this._updateElement);
    });
  }

  override render() {
    const { edgeless, frame: model, _isNavigator } = this;
    const { surface } = edgeless;
    const { zoom } = surface.viewport;
    const bound = Bound.deserialize(model.xywh);
    this.isInner = surface.frame.frames.some(frame => {
      if (frame.id === model.id) return false;
      if (Bound.deserialize(frame.xywh).contains(bound)) {
        return true;
      }
      return false;
    });

    const [x, y] = surface.viewport.toViewCoord(bound.x, bound.y);
    const { isInner } = this;
    const text = model.title.toString();

    const top = (isInner ? FRAME_OFFSET : -(29 + FRAME_OFFSET)) + y;
    const left = (isInner ? FRAME_OFFSET : 0) + x;
    const maxWidth = isInner
      ? bound.w * zoom - FRAME_OFFSET / zoom
      : bound.w * zoom;
    const hidden = 32 / zoom > bound.h && isInner;
    return html`
      ${text && !_isNavigator && !this._editing
        ? html` <div
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
              background: isInner
                ? 'var(--affine-white)'
                : 'var(--affine-text-primary-color)',
              color: isInner
                ? 'var(--affine-text-secondary-color)'
                : 'var(--affine-white)',
              cursor: 'default',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              border: isInner ? '1px solid var(--affine-border-color)' : 'none',
            })}
            class="affine-frame-title"
          >
            ${text}
          </div>`
        : nothing}
    `;
  }
}

@customElement('edgeless-block-portal-frame')
class EdgelessBlockPortalFrame extends EdgelessPortalBase<FrameBlockModel> {
  override render() {
    const { model, index, surface } = this;
    const bound = Bound.deserialize(model.xywh);
    const { translateX, translateY, zoom } = surface.viewport;
    const style = styleMap({
      position: 'absolute',
      zIndex: `${index}`,
      transform: `translate(${translateX + bound.x * zoom}px, ${
        translateY + bound.y * zoom
      }px) scale(${zoom})`,
      transformOrigin: '0px 0px',
    });

    return html` <div style=${style}>${this.renderModel(model)}</div> `;
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
            ? html`<edgeless-frame-title
                .frame=${frame}
                .edgeless=${this.edgeless}
              >
              </edgeless-frame-title>`
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
    'edgeless-frame-title': EdgeelssFrameTitle;
  }
}
