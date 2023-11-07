import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { FrameBlockModel } from '../../../../../frame-block/index.js';
import { EdgelessBlockType } from '../../../../../surface-block/edgeless-types.js';
import { Bound } from '../../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';
import { isFrameBlock } from '../../../utils/query.js';

const { FRAME } = EdgelessBlockType;

@customElement('edgeless-block-portal-frame')
class EdgelessBlockPortalFrame extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  frame!: FrameBlockModel;

  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

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
    const bound = Bound.deserialize(xywh);
    const style = styleMap({
      position: 'absolute',
      zIndex: `${index}`,
      transform: `translate(${bound.x}px, ${bound.y}px)`,
    });

    return html`
      <div style=${style}>${this.surface.root.renderModel(frame)}</div>
    `;
  }
}

@customElement('edgeless-frames-container')
export class EdgelessFramesContainer extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.position = 'absolute';
    this.style.zIndex = '0';
  }

  protected override firstUpdated() {
    const { _disposables, surface } = this;

    _disposables.add(
      surface.page.slots.blockUpdated.on(({ flavour }) => {
        if (flavour === FRAME) {
          this.requestUpdate();
        }
      })
    );

    this.surface.edgeless.slots.edgelessToolUpdated.on(tool => {
      if (tool.type === 'frameNavigator') {
        this.style.display = 'none';
      } else {
        this.style.display = 'block';
        this.requestUpdate();
      }
    });
  }

  protected override render() {
    const sortedFrames = this.surface.getSortedBlocks(FRAME);
    return html`
      ${repeat(
        sortedFrames,
        frame => frame.id,
        (frame, index) =>
          html`<edgeless-block-portal-frame
            .frame=${frame}
            .index=${index}
            .surface=${this.surface}
          >
          </edgeless-block-portal-frame> `
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frames-container': EdgelessFramesContainer;
    'edgeless-block-portal-frame': EdgelessBlockPortalFrame;
  }
}
