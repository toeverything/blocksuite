import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';

import type { EditorHost } from '../view/index.js';
import type { GfxBlockElementModel } from './gfx-block-model.js';

import { PropTypes, requiredProperties } from '../view/decorators/required.js';
import { Viewport } from './viewport.js';

/**
 * A wrapper around `requestConnectedFrame` that only calls at most once in one frame
 */
export function requestThrottledConnectedFrame<
  T extends (...args: unknown[]) => void,
>(func: T, element?: HTMLElement): T {
  let raqId: number | undefined = undefined;
  let latestArgs: unknown[] = [];

  return ((...args: unknown[]) => {
    latestArgs = args;

    if (raqId === undefined) {
      raqId = requestAnimationFrame(() => {
        raqId = undefined;

        if (!element || element.isConnected) {
          func(...latestArgs);
        }
      });
    }
  }) as T;
}

@requiredProperties({
  viewport: PropTypes.instanceOf(Viewport),
})
export class GfxViewportElement extends WithDisposable(LitElement) {
  static override styles = css`
    .gfx-viewport {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout style;
      display: block;
    }
  `;

  private _hideOutsideBlock = requestThrottledConnectedFrame(() => {
    if (this.getModelsInViewport && this.host) {
      const host = this.host;
      const modelsInViewport = this.getModelsInViewport();

      modelsInViewport.forEach(model => {
        const view = host.std.view.getBlock(model.id);

        if (view) {
          view.style.display = '';
        }

        if (this._lastVisibleModels?.has(model)) {
          this._lastVisibleModels!.delete(model);
        }
      });

      this._lastVisibleModels?.forEach(model => {
        const view = host.std.view.getBlock(model.id);

        if (view) {
          view.style.display = 'none';
        }
      });

      this._lastVisibleModels = modelsInViewport;
    }
  }, this);

  private _lastVisibleModels?: Set<GfxBlockElementModel>;

  private _pendingChildrenUpdates: {
    id: string;
    resolve: () => void;
  }[] = [];

  private _refreshViewport = requestThrottledConnectedFrame(() => {
    const { translateX, translateY, zoom } = this.viewport;

    if (this.container) {
      this.container.style.transform = this._toCSSTransform(
        translateX,
        translateY,
        zoom
      );
    }
  }, this);

  private _updatingChildrenFlag = false;

  renderingBlocks = new Set<string>();

  private _toCSSTransform(
    translateX: number,
    translateY: number,
    zoom: number
  ) {
    return `translate3d(${translateX}px, ${translateY}px, 0) scale(${zoom})`;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const viewportUpdateCallback = () => {
      this._refreshViewport();
      this._hideOutsideBlock();
    };

    viewportUpdateCallback();
    this.disposables.add(
      this.viewport.viewportUpdated.on(() => viewportUpdateCallback())
    );
    this.disposables.add(
      this.viewport.sizeUpdated.on(() => viewportUpdateCallback())
    );
  }

  override render() {
    return html`<div class="gfx-viewport">
      <slot></slot>
    </div>`;
  }

  scheduleUpdateChildren(id: string) {
    const { promise, resolve } = Promise.withResolvers<void>();

    this._pendingChildrenUpdates.push({ id, resolve });

    if (!this._updatingChildrenFlag) {
      this._updatingChildrenFlag = true;
      const schedule = () => {
        if (this._pendingChildrenUpdates.length) {
          const childToUpdates = this._pendingChildrenUpdates.splice(
            0,
            this.maxConcurrentRenders
          );

          childToUpdates.forEach(({ resolve }) => resolve());

          if (this._pendingChildrenUpdates.length) {
            requestAnimationFrame(() => {
              this.isConnected && schedule();
            });
          } else {
            this._updatingChildrenFlag = false;
          }
        }
      };

      requestAnimationFrame(() => {
        this.isConnected && schedule();
      });
    }

    return promise;
  }

  @query('.gfx-viewport')
  accessor container: HTMLDivElement | null = null;

  @property({ attribute: false })
  accessor getModelsInViewport: undefined | (() => Set<GfxBlockElementModel>);

  @property({ attribute: false })
  accessor host: undefined | EditorHost;

  @property({ type: Number })
  accessor maxConcurrentRenders: number = 2;

  @property({ attribute: false })
  accessor viewport!: Viewport;
}
