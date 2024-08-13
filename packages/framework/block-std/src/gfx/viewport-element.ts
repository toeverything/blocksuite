import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { EditorHost } from '../view/index.js';
import type { GfxBlockComponent } from '../view/index.js';
import type { GfxBlockElementModel } from './gfx-block-model.js';
import type { Viewport } from './viewport.js';

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

@customElement('gfx-viewport')
export class GfxViewportElement extends LitElement {
  private _hideOutsideBlock = requestThrottledConnectedFrame(() => {
    if (this.getModelsInViewport && this.host) {
      const modelsInViewport = this.getModelsInViewport();

      if (!this._lastVisibleSet) {
        Array.from(
          this.children as HTMLCollectionOf<GfxBlockComponent>
        ).forEach(block => {
          if (block.model && (block.model as GfxBlockElementModel).xywh) {
            if (!modelsInViewport.has(block.model as GfxBlockElementModel)) {
              block.style.display = 'none';
            }
          }
        });

        this._lastVisibleSet = modelsInViewport;
      } else {
        const modelsInViewport = this.getModelsInViewport();

        modelsInViewport.forEach(model => {
          if (this.host?.std.view.getBlock(model.id)) {
            const view = this.host!.std.view.getBlock(model.id)!;

            if (this._lastVisibleSet!.has(model)) {
              this._lastVisibleSet!.delete(model);
            }
            view.style.display = '';
          }
        });

        this._lastVisibleSet.forEach(model => {
          if (this.host?.std.view.getBlock(model.id)) {
            const view = this.host!.std.view.getBlock(model.id)!;

            view.style.display = 'none';
          }
        });

        this._lastVisibleSet = modelsInViewport;
      }
    }
  }, this);

  private _lastVisibleSet?: Set<GfxBlockElementModel>;

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

  static override styles = css`
    .gfx-viewport {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout style;
      display: block;
    }
  `;

  renderingBlocks = new Set<string>();

  viewport!: Viewport;

  private _toCSSTransform(
    translateX: number,
    translateY: number,
    zoom: number
  ) {
    return `translate3d(${translateX}px, ${translateY}px, 0) scale(${zoom})`;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this.viewport.viewportUpdated.on(() => {
      this._refreshViewport();
      this._hideOutsideBlock();
    });
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
}
