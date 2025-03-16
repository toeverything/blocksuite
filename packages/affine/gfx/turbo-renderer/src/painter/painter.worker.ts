import {
  Container,
  createIdentifier,
  type ServiceProvider,
} from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';

import type {
  BlockLayoutPainter,
  HostToWorkerMessage,
  ViewportLayout,
  WorkerToHostMessage,
} from '../types';

export const BlockPainterProvider = createIdentifier<BlockLayoutPainter>(
  'block-painter-provider'
);

export const BlockLayoutPainterExtension = (
  type: string,
  painter: new () => BlockLayoutPainter
): ExtensionType => {
  return {
    setup: di => {
      di.addImpl(BlockPainterProvider(type), painter);
    },
  };
};

export class ViewportLayoutPainter {
  private readonly canvas: OffscreenCanvas = new OffscreenCanvas(0, 0);
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private zoom = 1;
  public provider: ServiceProvider;

  getPainter(type: string): BlockLayoutPainter | undefined {
    return this.provider.get(BlockPainterProvider(type));
  }

  constructor(extensions: ExtensionType[]) {
    const container = new Container();

    extensions.forEach(extension => {
      extension.setup(container);
    });

    this.provider = container.provider();

    self.onmessage = this.handler;
  }

  setSize(layoutRectW: number, layoutRectH: number, dpr: number, zoom: number) {
    const width = layoutRectW * dpr * zoom;
    const height = layoutRectH * dpr * zoom;

    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);
    this.zoom = zoom;
    this.clearBackground();
  }

  private clearBackground() {
    if (!this.canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  paint(layout: ViewportLayout, version: number) {
    const { canvas, ctx } = this;
    if (!canvas || !ctx) return;
    if (layout.rect.w === 0 || layout.rect.h === 0) {
      console.warn('empty layout rect');
      return;
    }

    this.clearBackground();

    ctx.scale(this.zoom, this.zoom);

    layout.blocks.forEach(blockLayout => {
      const painter = this.getPainter(blockLayout.type);
      if (!painter) return;
      painter.paint(ctx, blockLayout, layout.rect.x, layout.rect.y);
    });

    const bitmap = canvas.transferToImageBitmap();
    const message: WorkerToHostMessage = {
      type: 'bitmapPainted',
      bitmap,
      version,
    };
    self.postMessage(message, { transfer: [bitmap] });
  }

  handler = async (e: MessageEvent<HostToWorkerMessage>) => {
    const { type, data } = e.data;
    switch (type) {
      case 'paintLayout': {
        const { layout, width, height, dpr, zoom, version } = data;
        this.setSize(width, height, dpr, zoom);
        this.paint(layout, version);
        break;
      }
    }
  };
}
