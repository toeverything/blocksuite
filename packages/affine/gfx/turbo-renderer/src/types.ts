export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// We can't use viewport instance here because it can't be reused in worker
export interface ViewportState {
  zoom: number;
  viewScale: number;
  viewportX: number;
  viewportY: number;
}

export interface BlockLayout extends Record<string, unknown> {
  type: string;
  rect?: Rect;
}

export interface ViewportLayout {
  blocks: BlockLayout[];
  rect: Rect;
}

export interface TextRect {
  rect: Rect;
  text: string;
}

/**
 * Represents the rendering state of the ViewportTurboRenderer
 * - inactive: Renderer is not active
 * - pending: Bitmap is invalid or not yet available, falling back to DOM rendering
 * - zooming: Zooming in or out, will use fast canvas placeholder rendering
 * - rendering: Currently rendering to a bitmap (async operation in progress)
 * - ready: Bitmap is valid and rendered, DOM elements can be safely removed
 */
export type RenderingState =
  | 'inactive'
  | 'pending'
  | 'zooming'
  | 'rendering'
  | 'ready';

export type MessageBitmapPainted = {
  type: 'bitmapPainted';
  bitmap: ImageBitmap;
  version: number;
};

export type MessagePaintError = {
  type: 'paintError';
  error: string;
  blockType: string;
};

export type WorkerToHostMessage = MessageBitmapPainted | MessagePaintError;

export type MessagePaint = {
  type: 'paintLayout';
  data: {
    layout: ViewportLayout;
    width: number;
    height: number;
    dpr: number;
    zoom: number;
    version: number;
  };
};

export interface BlockLayoutPainter {
  paint(
    ctx: OffscreenCanvasRenderingContext2D,
    block: BlockLayout,
    layoutBaseX: number,
    layoutBaseY: number
  ): void;
}

export interface RendererOptions {
  zoomThreshold: number;
  debounceTime: number;
}

export interface TurboRendererConfig {
  options?: Partial<RendererOptions>;
  painterWorkerEntry: () => Worker;
}

export type HostToWorkerMessage = MessagePaint;
