/// <reference types="vite/client" />
import { BlockElement } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isCssVariable } from '../_common/theme/css-variables.js';
import type { EdgelessFrameTitle } from '../root-block/edgeless/components/block-portal/frame/edgeless-frame.js';
import { Bound } from '../surface-block/index.js';
import type { FrameBlockModel } from './frame-model.js';

@customElement('affine-frame')
export class FrameBlockComponent extends BlockElement<FrameBlockModel> {
  @state()
  private accessor _isNavigator = false;

  get titleElement(): EdgelessFrameTitle | null {
    return (
      this.closest('affine-edgeless-root')?.querySelector?.(
        `[data-frame-title-id="${this.model.id}"]`
      ) ?? null
    );
  }

  private get _surface() {
    return this.closest('affine-edgeless-root')!.surface;
  }

  private get _edgeless() {
    return this.closest('affine-edgeless-root');
  }

  override connectedCallback() {
    super.connectedCallback();

    let lastZoom = 0;
    this._disposables.add(
      this._edgeless!.service.viewport.viewportUpdated.on(({ zoom }) => {
        if (zoom !== lastZoom) {
          lastZoom = zoom;
          this.requestUpdate();
        }
      })
    );

    this._disposables.add(
      this.doc.slots.blockUpdated.on(({ type, id }) => {
        if (id === this.model.id && type === 'update') {
          this.requestUpdate();
        }
      })
    );
  }

  override createRenderRoot() {
    return this;
  }

  override firstUpdated() {
    this._surface.edgeless.slots.edgelessToolUpdated.on(tool => {
      this._isNavigator = tool.type === 'frameNavigator';
    });
  }

  override renderBlock() {
    const { model, _isNavigator } = this;
    const bound = Bound.deserialize(model.xywh);

    return html`
      <div
        class="affine-frame-container"
        style=${styleMap({
          width: bound.w + 'px',
          height: bound.h + 'px',
          backgroundColor: isCssVariable(model.background)
            ? `var(${model.background})`
            : '',
          borderRadius: '8px',
          border: _isNavigator ? 'none' : `2px solid var(--affine-black-30)`,
        })}
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-frame': FrameBlockComponent;
  }
}
