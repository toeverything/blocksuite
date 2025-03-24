import { shapeToolbarConfig } from '@blocksuite/affine-gfx-shape';
import {
  MindmapElementModel,
  ShapeElementModel,
} from '@blocksuite/affine-model';
import type { ToolbarActions } from '@blocksuite/affine-shared/services';

import {
  createMindmapLayoutActionMenu,
  createMindmapStyleActionMenu,
} from './mindmap';

const mindmapActions = [
  {
    id: 'a.mindmap-style',
    when(ctx) {
      const models = ctx.getSurfaceModelsByType(ShapeElementModel);
      return models.some(hasGrouped);
    },
    content(ctx) {
      const models = ctx.getSurfaceModelsByType(ShapeElementModel);
      if (!models.length) return null;

      let mindmaps = models
        .map(model => model.group)
        .filter(model => ctx.matchModel(model, MindmapElementModel));
      if (!mindmaps.length) return null;

      // Not displayed when there is both a normal shape and a mindmap shape.
      if (models.length !== mindmaps.length) return null;

      mindmaps = Array.from(new Set(mindmaps));

      return createMindmapStyleActionMenu(ctx, mindmaps);
    },
  },
  {
    id: 'b.mindmap-layout',
    when(ctx) {
      const models = ctx.getSurfaceModelsByType(ShapeElementModel);
      return models.some(hasGrouped);
    },
    content(ctx) {
      const models = ctx.getSurfaceModelsByType(ShapeElementModel);
      if (!models.length) return null;

      let mindmaps = models
        .map(model => model.group)
        .filter(model => ctx.matchModel(model, MindmapElementModel));
      if (!mindmaps.length) return null;

      // Not displayed when there is both a normal shape and a mindmap shape.
      if (models.length !== mindmaps.length) return null;

      mindmaps = Array.from(new Set(mindmaps));

      // It's a sub node.
      if (models.length === 1 && mindmaps[0].tree.element !== models[0])
        return null;

      return createMindmapLayoutActionMenu(ctx, mindmaps);
    },
  },
] as const satisfies ToolbarActions;

export const builtinShapeToolbarConfig = {
  ...shapeToolbarConfig,
  actions: [...mindmapActions, ...shapeToolbarConfig.actions],
};

function hasGrouped(model: ShapeElementModel) {
  return model.group instanceof MindmapElementModel;
}
