import type { Container } from '@blocksuite/global/di';
import { DisposableGroup } from '@blocksuite/global/disposable';
import { ConfigExtensionFactory } from '@blocksuite/std';
import {
  type GfxController,
  GfxExtension,
  GfxExtensionIdentifier,
  type GfxViewportElement,
} from '@blocksuite/std/gfx';
import {
  BehaviorSubject,
  distinctUntilChanged,
  merge,
  Subject,
  take,
  tap,
} from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
  debugLog,
  getViewportLayout,
  paintPlaceholder,
  syncCanvasSize,
} from './renderer-utils';
import type {
  MessagePaint,
  RendererOptions,
  RenderingState,
  TurboRendererConfig,
  ViewportLayout,
  WorkerToHostMessage,
} from './types';

const debug = false; // Toggle for debug logs

const defaultOptions: RendererOptions = {
  zoomThreshold: 1, // With high enough zoom, fallback to DOM rendering
  debounceTime: 1000, // During this period, fallback to DOM
};

export const TurboRendererConfigFactory =
  ConfigExtensionFactory<TurboRendererConfig>('viewport-turbo-renderer');

export class ViewportTurboRendererExtension extends GfxExtension {
  static override key = 'viewportTurboRenderer';

  private readonly state$ = new BehaviorSubject<RenderingState>('inactive');
  public readonly canvas: HTMLCanvasElement = document.createElement('canvas');
  private readonly worker: Worker;
  private readonly disposables = new DisposableGroup();
  private layoutCacheData: ViewportLayout | null = null;
  private layoutVersion = 0;
  private bitmap: ImageBitmap | null = null;
  private viewportElement: GfxViewportElement | null = null;
  private readonly refresh$ = new Subject<void>();

  constructor(gfx: GfxController) {
    super(gfx);

    const id = TurboRendererConfigFactory.identifier;
    const config = this.std.getOptional(id);
    if (!config) {
      throw new Error('TurboRendererConfig not found');
    }
    this.worker = config.painterWorkerEntry();

    // Set up state change logging
    this.state$
      .pipe(
        distinctUntilChanged(),
        tap(state => this.debugLog(`State changed to: ${state}`))
      )
      .subscribe();

    // Set up debounced refresh
    this.refresh$
      .pipe(debounceTime(this.options.debounceTime))
      .subscribe(() => {
        this.refresh().catch(console.error);
      });
  }

  static override extendGfx(gfx: GfxController) {
    Object.defineProperty(gfx, 'turboRenderer', {
      get() {
        return gfx.std.get(ViewportTurboRendererIdentifier);
      },
    });
  }

  static override setup(di: Container) {
    super.setup(di);
  }

  get options(): RendererOptions {
    const id = TurboRendererConfigFactory.identifier;
    const { options } = this.std.getOptional(id) || {};
    return {
      ...defaultOptions,
      ...options,
    };
  }

  override mounted() {
    const mountPoint = document.querySelector('.affine-edgeless-viewport');
    if (mountPoint) {
      mountPoint.append(this.canvas);
    }

    this.viewport.elementReady.pipe(take(1)).subscribe(element => {
      this.viewportElement = element;
      syncCanvasSize(this.canvas, this.std.host);
      this.state$.next('pending');

      this.disposables.add(
        this.viewport.sizeUpdated.subscribe(() => this.handleResize())
      );

      this.disposables.add(
        this.viewport.viewportUpdated.subscribe(() => {
          this.refresh().catch(console.error);
        })
      );

      this.disposables.add(
        this.viewport.zooming$
          .pipe(
            tap(isZooming => {
              this.debugLog(`Zooming signal changed: ${isZooming}`);
              if (isZooming) {
                this.state$.next('zooming');
              } else if (this.state$.value === 'zooming') {
                this.state$.next('pending');
                this.refresh().catch(console.error);
              }
            })
          )
          .subscribe()
      );
    });

    // Handle selection and block updates
    const selectionUpdates$ = this.selection.slots.updated;
    const blockUpdates$ = this.std.store.slots.blockUpdated;

    // Combine all events that should trigger invalidation
    this.disposables.add(
      merge(selectionUpdates$, blockUpdates$).subscribe(() => this.invalidate())
    );
  }

  override unmounted() {
    this.debugLog('Unmounting renderer');
    this.clearBitmap();
    this.clearOptimizedBlocks();
    this.worker.terminate();
    this.canvas.remove();
    this.disposables.dispose();
    this.state$.next('inactive');
    this.state$.complete();
    this.refresh$.complete();
  }

  get viewport() {
    return this.gfx.viewport;
  }

  get selection() {
    return this.gfx.selection;
  }

  get layoutCache() {
    if (this.layoutCacheData) return this.layoutCacheData;
    const layout = getViewportLayout(this.std.host, this.viewport);
    this.debugLog('Layout cache updated');
    return (this.layoutCacheData = layout);
  }

  async refresh() {
    if (this.state$.value === 'inactive') return;

    this.clearCanvas();

    // Determine the next state based on current conditions
    let nextState: RenderingState;

    if (this.viewport.zoom > this.options.zoomThreshold) {
      this.debugLog('Zoom above threshold, falling back to DOM rendering');
      nextState = 'pending';
      this.clearOptimizedBlocks();
    } else if (this.isZooming()) {
      this.debugLog('Currently zooming, using placeholder rendering');
      nextState = 'zooming';
      this.paintPlaceholder();
      this.updateOptimizedBlocks();
    } else if (this.canUseBitmapCache()) {
      this.debugLog('Using cached bitmap');
      nextState = 'ready';
      this.drawCachedBitmap();
      this.updateOptimizedBlocks();
    } else {
      this.debugLog('Starting bitmap rendering');
      nextState = 'rendering';
      this.state$.next(nextState);
      await this.paintLayout();
      this.drawCachedBitmap();
      this.updateOptimizedBlocks();
      // After rendering completes, transition to ready state
      nextState = 'ready';
    }

    this.state$.next(nextState);
  }

  invalidate() {
    this.layoutVersion++;
    this.layoutCacheData = null;
    this.clearBitmap();
    this.clearCanvas();
    this.clearOptimizedBlocks();
    this.state$.next('pending');
    this.debugLog(`Invalidated renderer (layoutVersion=${this.layoutVersion})`);
  }

  private debugLog(message: string) {
    if (!debug) return;
    debugLog(message, this.state$.value);
  }

  private clearBitmap() {
    if (!this.bitmap) return;
    this.bitmap.close();
    this.bitmap = null;
    this.debugLog('Bitmap cleared');
  }

  private async paintLayout(): Promise<void> {
    return new Promise(resolve => {
      if (!this.worker) return;

      const layout = this.layoutCache;
      const dpr = window.devicePixelRatio;
      const currentVersion = this.layoutVersion;

      this.debugLog(`Requesting bitmap painting (version=${currentVersion})`);
      const message: MessagePaint = {
        type: 'paintLayout',
        data: {
          layout,
          width: layout.rect.w,
          height: layout.rect.h,
          dpr,
          zoom: this.viewport.zoom,
          version: currentVersion,
        },
      };
      this.worker.postMessage(message);

      this.worker.onmessage = (e: MessageEvent<WorkerToHostMessage>) => {
        if (e.data.type === 'bitmapPainted') {
          if (e.data.version === this.layoutVersion) {
            this.debugLog(
              `Bitmap painted successfully (version=${e.data.version})`
            );
            this.clearBitmap();
            this.bitmap = e.data.bitmap;
            this.state$.next('ready');
            resolve();
          } else {
            this.debugLog(
              `Received outdated bitmap (got=${e.data.version}, current=${this.layoutVersion})`
            );
            e.data.bitmap.close();
            this.state$.next('pending');
            resolve();
          }
        } else if (e.data.type === 'paintError') {
          this.debugLog(
            `Paint error: ${e.data.error} for blockType: ${e.data.blockType}`
          );
          this.state$.next('pending');
          resolve();
        }
      };
    });
  }

  private canUseBitmapCache(): boolean {
    // Never use bitmap cache during zooming
    if (this.isZooming()) return false;
    return !!(this.layoutCache && this.bitmap);
  }

  private isZooming(): boolean {
    return this.viewport.zooming$.value;
  }

  private clearCanvas() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.debugLog('Canvas cleared');
  }

  private drawCachedBitmap() {
    if (!this.bitmap) {
      this.debugLog('No cached bitmap available, requesting refresh');
      this.refresh$.next();
      return;
    }

    const layout = this.layoutCache;
    const bitmap = this.bitmap;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    this.clearCanvas();
    const layoutViewCoord = this.viewport.toViewCoord(
      layout.rect.x,
      layout.rect.y
    );

    ctx.drawImage(
      bitmap,
      layoutViewCoord[0] * window.devicePixelRatio,
      layoutViewCoord[1] * window.devicePixelRatio,
      layout.rect.w * window.devicePixelRatio * this.viewport.zoom,
      layout.rect.h * window.devicePixelRatio * this.viewport.zoom
    );

    this.debugLog('Bitmap drawn to canvas');
  }

  private canOptimize(): boolean {
    const isBelowZoomThreshold =
      this.viewport.zoom <= this.options.zoomThreshold;
    return (
      (this.state$.value === 'ready' || this.state$.value === 'zooming') &&
      isBelowZoomThreshold
    );
  }

  private updateOptimizedBlocks() {
    requestAnimationFrame(() => {
      if (!this.viewportElement || !this.layoutCache) return;
      if (!this.canOptimize()) return;

      const blockElements = this.viewportElement.getModelsInViewport();
      const blockIds = Array.from(blockElements).map(model => model.id);
      this.debugLog(`Optimized ${blockIds.length} blocks`);
    });
  }

  private clearOptimizedBlocks() {
    this.debugLog('Cleared optimized blocks');
  }

  private handleResize() {
    this.debugLog('Container resized, syncing canvas size');
    syncCanvasSize(this.canvas, this.std.host);
    this.invalidate();
    this.refresh$.next();
  }

  private paintPlaceholder() {
    paintPlaceholder(
      this.std.host,
      this.canvas,
      this.layoutCache,
      this.viewport
    );
  }
}

export const ViewportTurboRendererIdentifier = GfxExtensionIdentifier(
  'viewportTurboRenderer'
);
