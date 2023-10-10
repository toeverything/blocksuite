/// <reference types="vite/client" />
import { BlockElement } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isCssVariable } from '../__internal__/theme/css-variables.js';
import { BlendColor } from '../page-block/edgeless/utils/consts.js';
import type { EdgelessPageBlockComponent } from '../page-block/index.js';
import { Bound } from '../surface-block/index.js';
import type { FrameBlockModel } from './frame-model.js';

@customElement('affine-frame')
export class FrameBlockComponent extends BlockElement<FrameBlockModel> {
  static offset = 12;

  @state()
  color = BlendColor;

  @state()
  titleHide = false;

  @query('.affine-frame-title')
  private _titleElement?: HTMLElement;

  get titleBound() {
    if (!this._titleElement) return new Bound();
    const { viewport } = this._surface;
    const { zoom } = viewport;
    const bound = Bound.fromDOMRect(this._titleElement.getBoundingClientRect());
    bound.h += FrameBlockComponent.offset;
    bound.h /= zoom;
    bound.w /= zoom;
    const [x, y] = viewport.toModelCoord(bound.x, bound.y);
    bound.x = x;
    bound.y = y;
    return bound;
  }

  private get _surface() {
    return (<EdgelessPageBlockComponent>this.parentBlockElement).surface;
  }

  override connectedCallback() {
    super.connectedCallback();
    let lastZoom = 0;
    this._disposables.add(
      this._surface.viewport.slots.viewportUpdated.on(({ zoom }) => {
        if (zoom !== lastZoom) {
          this.requestUpdate();
          lastZoom = zoom;
        }
      })
    );
  }

  override createRenderRoot() {
    return this;
  }

  override render() {
    const { model, titleHide, _surface } = this;
    const bound = Bound.fromXYWH(model.xywh);
    const { zoom } = _surface.viewport;
    const text = model.title.toString();
    return html`
      ${!titleHide
        ? html` <div
            style=${styleMap({
              transformOrigin: 'top left',
              transform: `scale(${1 / zoom})`,
              borderRadius: '35px',
              width: 'fit-content',
              maxWidth: bound.w * zoom + 'px',
              padding: '4px 10px',
              fontSize: '14px',
              position: 'absolute',
              background: this.color,
              color: 'var(--affine-white)',
              cursor: 'default',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              top: -(24.36 + FrameBlockComponent.offset) / zoom + 'px',
            })}
            class="affine-frame-title"
          >
            ${text}
          </div>`
        : nothing}
      <div
        class="affine-frame-container"
        style=${styleMap({
          width: bound.w + 'px',
          height: bound.h + 'px',
          backgroundColor: isCssVariable(model.background)
            ? `var(${model.background})`
            : '',
          borderRadius: '8px',
          border: `2px solid ${this.color}`,
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
