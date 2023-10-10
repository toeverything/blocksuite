import { WithDisposable } from '@blocksuite/lit';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { FrameBlockModel } from '../../../../frame-block/index.js';
import { Bound, compare } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';

@customElement('edgeless-frame')
class EdgelessFrame extends WithDisposable(LitElement) {
  @property({ attribute: false })
  frame!: FrameBlockModel;

  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  protected override createRenderRoot() {
    return this;
  }

  override firstUpdated() {
    this._disposables.add(
      this.surface.page.slots.yBlockUpdated.on(e => {
        if (e.id === this.frame.id) {
          this.requestUpdate();
        }
      })
    );
  }

  protected override render() {
    const { frame, index } = this;
    const { xywh } = frame;
    const bound = Bound.fromXYWH(xywh);
    const style = styleMap({
      width: `${bound.w}px`,
      position: 'absolute',
      zIndex: `${index}`,
      transform: `translate(${bound.x}px, ${bound.y}px)`,
    });

    return html`
      <div style=${style}>${this.surface.root.renderModel(frame)}</div>
    `;
  }
}

@customElement('edgeless-frame-container')
export class EdgelessFrameContainer extends WithDisposable(LitElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  protected override firstUpdated() {
    this._disposables.add(
      this.surface.page.slots.historyUpdated.on(() => this.requestUpdate())
    );
  }

  protected override createRenderRoot() {
    return this;
  }

  private get _frames() {
    return this.surface.model.children.filter(
      child => child.flavour === 'affine:frame'
    ) as FrameBlockModel[];
  }

  private get _sortedFrames() {
    return this._frames.sort(compare);
  }

  protected override render() {
    const { _sortedFrames } = this;

    return html`
      ${repeat(
        _sortedFrames,
        frame => frame.id,
        (frame, index) =>
          html`<edgeless-frame
            .frame=${frame}
            .index=${index}
            .surface=${this.surface}
          >
          </edgeless-frame> `
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-container': EdgelessFrameContainer;
    'edgeless-frame': EdgelessFrame;
  }
}
