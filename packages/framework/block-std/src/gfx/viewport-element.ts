import { WithDisposable } from '@blocksuite/global/lit';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import { PropTypes, requiredProperties } from '../view/decorators/required.js';
import {
  type BlockComponent,
  type EditorHost,
  ShadowlessElement,
} from '../view/index.js';
import type { GfxBlockElementModel } from './model/gfx-block-model.js';
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

function setBlockState(view: BlockComponent | null, state: 'active' | 'idle') {
  if (!view) return;

  if (state === 'active') {
    view.style.visibility = 'visible';
    view.style.pointerEvents = 'auto';
    view.classList.remove('block-idle');
    view.classList.add('block-active');
    view.dataset.blockState = 'active';
  } else {
    view.style.visibility = 'hidden';
    view.style.pointerEvents = 'none';
    view.classList.remove('block-active');
    view.classList.add('block-idle');
    view.dataset.blockState = 'idle';
  }
}

@requiredProperties({
  viewport: PropTypes.instanceOf(Viewport),
})
export class GfxViewportElement extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    gfx-viewport {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout style;
      display: block;
      transform: none;
    }

    /* CSS for idle blocks that are hidden but maintain layout */
    .block-idle {
      visibility: hidden;
      pointer-events: none;
      will-change: transform;
      contain: size layout style;
    }

    /* CSS for active blocks participating in viewport transformations */
    .block-active {
      visibility: visible;
      pointer-events: auto;
    }
  `;

  private readonly _hideOutsideBlock = () => {
    if (!this.host) return;

    const { host } = this;
    const modelsInViewport = this.getModelsInViewport();

    modelsInViewport.forEach(model => {
      const view = host.std.view.getBlock(model.id);
      setBlockState(view, 'active');

      if (this._lastVisibleModels?.has(model)) {
        this._lastVisibleModels!.delete(model);
      }
    });

    this._lastVisibleModels?.forEach(model => {
      const view = host.std.view.getBlock(model.id);
      setBlockState(view, 'idle');
    });

    this._lastVisibleModels = modelsInViewport;
  };

  private _lastVisibleModels?: Set<GfxBlockElementModel>;

  private readonly _pendingChildrenUpdates: {
    id: string;
    resolve: () => void;
  }[] = [];

  private readonly _refreshViewport = requestThrottledConnectedFrame(() => {
    this._hideOutsideBlock();
  }, this);

  private _updatingChildrenFlag = false;

  override connectedCallback(): void {
    super.connectedCallback();

    const viewportUpdateCallback = () => {
      this._refreshViewport();
    };

    if (!this.enableChildrenSchedule) {
      delete this.scheduleUpdateChildren;
    }

    this._hideOutsideBlock();
    this.disposables.add(
      this.viewport.viewportUpdated.subscribe(() => viewportUpdateCallback())
    );
    this.disposables.add(
      this.viewport.sizeUpdated.subscribe(() => viewportUpdateCallback())
    );
  }

  override render() {
    return html``;
  }

  scheduleUpdateChildren? = (id: string) => {
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
  };

  @property({ attribute: false })
  accessor getModelsInViewport: () => Set<GfxBlockElementModel> = () =>
    new Set();

  @property({ attribute: false })
  accessor host: undefined | EditorHost;

  @property({ type: Number })
  accessor maxConcurrentRenders: number = 2;

  @property({ attribute: false })
  accessor enableChildrenSchedule: boolean = true;

  @property({ attribute: false })
  accessor viewport!: Viewport;

  setBlocksActive(blockIds: string[]): void {
    if (!this.host) return;

    blockIds.forEach(id => {
      const view = this.host?.std.view.getBlock(id);
      if (view) {
        setBlockState(view, 'active');
      }
    });
  }

  setBlocksIdle(blockIds: string[]): void {
    if (!this.host) return;

    blockIds.forEach(id => {
      const view = this.host?.std.view.getBlock(id);
      if (view) {
        setBlockState(view, 'idle');
      }
    });
  }
}
