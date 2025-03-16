import type { EditorHost, GfxBlockComponent } from '@blocksuite/block-std';
import {
  GfxBlockElementModel,
  GfxControllerIdentifier,
  type Viewport,
} from '@blocksuite/block-std/gfx';

import { BlockLayoutHandlersIdentifier } from './layout/block-layout-provider';
import type { BlockLayout, RenderingState, ViewportLayout } from './types';

export function syncCanvasSize(canvas: HTMLCanvasElement, host: HTMLElement) {
  const hostRect = host.getBoundingClientRect();
  const dpr = window.devicePixelRatio;
  canvas.style.position = 'absolute';
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.width = hostRect.width * dpr;
  canvas.height = hostRect.height * dpr;
  canvas.style.pointerEvents = 'none';
}

function getBlockLayouts(host: EditorHost): BlockLayout[] {
  const gfx = host.std.get(GfxControllerIdentifier);
  const models = gfx.gfxElements.filter(e => e instanceof GfxBlockElementModel);
  const components = models
    .map(model => gfx.view.get(model.id))
    .filter(Boolean) as GfxBlockComponent[];

  const layouts: BlockLayout[] = [];
  components.forEach(component => {
    const layoutHandlers = host.std.provider.getAll(
      BlockLayoutHandlersIdentifier
    );
    const handlersArray = Array.from(layoutHandlers.values());
    for (const handler of handlersArray) {
      const layout = handler.queryLayout(component);
      if (layout) {
        layouts.push(layout);
      }
    }
  });
  return layouts;
}

export function getViewportLayout(
  host: EditorHost,
  viewport: Viewport
): ViewportLayout {
  const zoom = viewport.zoom;

  let layoutMinX = Infinity;
  let layoutMinY = Infinity;
  let layoutMaxX = -Infinity;
  let layoutMaxY = -Infinity;

  const blockLayouts = getBlockLayouts(host);

  const providers = host.std.provider.getAll(BlockLayoutHandlersIdentifier);
  const providersArray = Array.from(providers.values());

  blockLayouts.forEach(blockLayout => {
    const provider = providersArray.find(p => p.blockType === blockLayout.type);
    if (!provider) return;

    const { rect } = provider.calculateBound(blockLayout);

    layoutMinX = Math.min(layoutMinX, rect.x);
    layoutMinY = Math.min(layoutMinY, rect.y);
    layoutMaxX = Math.max(layoutMaxX, rect.x + rect.w);
    layoutMaxY = Math.max(layoutMaxY, rect.y + rect.h);
  });

  const layoutModelCoord = [layoutMinX, layoutMinY];
  const w = (layoutMaxX - layoutMinX) / zoom / viewport.viewScale;
  const h = (layoutMaxY - layoutMinY) / zoom / viewport.viewScale;
  const layout: ViewportLayout = {
    blocks: blockLayouts,
    rect: {
      x: layoutModelCoord[0],
      y: layoutModelCoord[1],
      w: Math.max(w, 0),
      h: Math.max(h, 0),
    },
  };
  return layout;
}

export function debugLog(message: string, state: RenderingState) {
  console.log(
    `%c[ViewportTurboRenderer]%c ${message} | state=${state}`,
    'color: #4285f4; font-weight: bold;',
    'color: inherit;'
  );
}

export function paintPlaceholder(
  host: EditorHost,
  canvas: HTMLCanvasElement,
  layout: ViewportLayout | null,
  viewport: Viewport
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (!layout) return;
  const dpr = window.devicePixelRatio;
  const layoutViewCoord = viewport.toViewCoord(layout.rect.x, layout.rect.y);

  const offsetX = layoutViewCoord[0];
  const offsetY = layoutViewCoord[1];
  const colors = [
    'rgba(200, 200, 200, 0.7)',
    'rgba(180, 180, 180, 0.7)',
    'rgba(160, 160, 160, 0.7)',
  ];

  const layoutHandlers = host.std.provider.getAll(
    BlockLayoutHandlersIdentifier
  );
  const handlersArray = Array.from(layoutHandlers.values());

  layout.blocks.forEach((blockLayout, blockIndex) => {
    ctx.fillStyle = colors[blockIndex % colors.length];
    const renderedPositions = new Set<string>();

    const handler = handlersArray.find(h => h.blockType === blockLayout.type);
    if (!handler) return;
    const { subRects } = handler.calculateBound(blockLayout);

    subRects.forEach(rect => {
      const x = ((rect.x - layout.rect.x) * viewport.zoom + offsetX) * dpr;
      const y = ((rect.y - layout.rect.y) * viewport.zoom + offsetY) * dpr;

      const width = rect.w * viewport.zoom * dpr;
      const height = rect.h * viewport.zoom * dpr;

      const posKey = `${x},${y}`;
      if (renderedPositions.has(posKey)) return;
      ctx.fillRect(x, y, width, height);
      if (width > 10 && height > 5) {
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
        ctx.strokeRect(x, y, width, height);
      }

      renderedPositions.add(posKey);
    });
  });
}
