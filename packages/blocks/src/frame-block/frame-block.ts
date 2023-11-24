/// <reference types="vite/client" />
import { BlockElement } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isCssVariable } from '../_common/theme/css-variables.js';
import type { EdgelessPageBlockComponent } from '../page-block/index.js';
import { Bound } from '../surface-block/index.js';
import type { FrameBlockModel } from './frame-model.js';

@customElement('affine-frame')
export class FrameBlockComponent extends BlockElement<FrameBlockModel> {
  static offset = 12;

  @state()
  showTitle = true;

  @state()
  private _isNavigator = false;

  @query('.affine-frame-title')
  private _titleElement?: HTMLElement;

  get titleBound() {
    if (!this._titleElement) return new Bound();
    const { viewport } = this.surface;
    const { zoom } = viewport;
    const rect = viewport.boundingClientRect;
    const bound = Bound.fromDOMRect(this._titleElement.getBoundingClientRect());
    bound.x -= rect.x;
    bound.y -= rect.y;
    bound.h += FrameBlockComponent.offset;
    bound.h /= zoom;
    bound.w /= zoom;
    const [x, y] = viewport.toModelCoord(bound.x, bound.y);
    bound.x = x;
    bound.y = y;
    return bound;
  }

  get surface() {
    return (<EdgelessPageBlockComponent>this.parentBlockElement).surface;
  }

  override connectedCallback() {
    super.connectedCallback();
    let lastZoom = 0;
    this._disposables.add(
      this.surface.viewport.slots.viewportUpdated.on(({ zoom }) => {
        if (zoom !== lastZoom) {
          this.requestUpdate();
          lastZoom = zoom;
        }
      })
    );

    this._disposables.add(
      this.surface.edgeless.slots.elementUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override createRenderRoot() {
    return this;
  }

  override firstUpdated() {
    this.surface.edgeless.slots.edgelessToolUpdated.on(tool => {
      this._isNavigator = tool.type === 'frameNavigator' ? true : false;
    });
  }

  override render() {
    const { model, showTitle, surface, _isNavigator } = this;
    const bound = Bound.deserialize(
      (surface.edgeless.localRecord.wrap(model) as FrameBlockModel).xywh
    );
    const { zoom } = surface.viewport;
    const text = model.title.toString();

    return html`
      ${showTitle && !_isNavigator
        ? html` <div
            style=${styleMap({
              transformOrigin: 'top left',
              transform: `scale(${1 / zoom})`,
              borderRadius: '4px',
              width: 'fit-content',
              maxWidth: bound.w * zoom + 'px',
              padding: '4px 10px',
              fontSize: '14px',
              position: 'absolute',
              background: 'var(--affine-text-primary-color)',
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
