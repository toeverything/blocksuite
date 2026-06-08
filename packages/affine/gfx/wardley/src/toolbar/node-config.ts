import { shapeToolbarConfig } from '@blocksuite/affine-gfx-shape';
import {
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@blocksuite/affine-shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/std';

/**
 * Wardley nodes are {@link ShapeElementModel} subclasses, so the shape toolbar's
 * actions (which target `getSurfaceModelsByType(ShapeElementModel)`) operate on
 * them directly. We re-register only the color / line-style actions under the
 * `wardleyNode` flavour so the circle's fill / stroke color / stroke width are
 * editable — while excluding the shape-only actions (switch type, add inner
 * text, edit vertices) that don't make sense for a Wardley node.
 */
const KEEP_ACTION_IDS = new Set(['e.color', 'd.style']);

const wardleyNodeToolbarConfig = {
  actions: shapeToolbarConfig.actions.filter(action =>
    KEEP_ACTION_IDS.has(action.id)
  ),
  when: shapeToolbarConfig.when,
} as ToolbarModuleConfig;

export const wardleyNodeToolbarExtension = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:surface:wardleyNode'),
  config: wardleyNodeToolbarConfig,
});
