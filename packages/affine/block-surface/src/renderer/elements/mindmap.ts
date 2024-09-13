import type { MindmapElementModel } from '@blocksuite/affine-model';
import type { GfxModel } from '@blocksuite/block-std/gfx';
import type { IBound } from '@blocksuite/global/utils';

import type { RoughCanvas } from '../../utils/rough/canvas.js';
import type { CanvasRenderer } from '../canvas-renderer.js';

import { ConnectorPathGenerator } from '../../managers/connector-manager.js';
import { connector as renderConnector } from './connector/index.js';

export function mindmap(
  model: MindmapElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: CanvasRenderer,
  rc: RoughCanvas,
  bound: IBound
) {
  const dx = model.x - bound.x;
  const dy = model.y - bound.y;

  matrix = matrix.translate(-dx, -dy);

  model.traverse((to, from) => {
    if (from) {
      const connector = model.getConnector(from, to);
      if (!connector) return;

      const elementGetter = (id: string) =>
        model.surface.getElementById(id) ??
        (model.surface.doc.getBlockById(id) as GfxModel);
      ConnectorPathGenerator.updatePath(connector, null, elementGetter);

      if (connector) {
        const dx = connector.x - bound.x;
        const dy = connector.y - bound.y;
        const origin = ctx.globalAlpha;
        const shouldSetGlobalAlpha = origin !== connector.opacity;

        if (shouldSetGlobalAlpha) {
          ctx.globalAlpha = connector.opacity;
        }

        renderConnector(connector, ctx, matrix.translate(dx, dy), renderer, rc);

        if (shouldSetGlobalAlpha) {
          ctx.globalAlpha = origin;
        }
      }
    }
  });

  model.extraConnectors.forEach(connector => {
    const dx = connector.x - bound.x;
    const dy = connector.y - bound.y;

    renderConnector(connector, ctx, matrix.translate(dx, dy), renderer, rc);
  });
}
