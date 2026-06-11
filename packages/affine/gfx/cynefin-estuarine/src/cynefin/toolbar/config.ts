import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import { CynefinElementModel } from '@blocksuite/affine-model';
import {
  type ToolbarContext,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@blocksuite/affine-shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/std';
import { html, type TemplateResult } from 'lit';

const ResizeIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H5v4M15 19h4v-4" /><path d="M5 5l6 6M19 19l-6-6" /></svg>`;
const LabelsIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h7" /></svg>`;
const DescIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h14M5 10h14M5 14h9M5 18h9" /></svg>`;

type CynefinToggleProp = 'resizeEnabled' | 'showLabels' | 'showDescriptions';

function booleanToggle(
  id: string,
  tooltip: string,
  icon: TemplateResult,
  prop: CynefinToggleProp
) {
  return {
    id,
    tooltip,
    icon,
    active(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(CynefinElementModel);
      return models.length > 0 && models.every(model => model[prop]);
    },
    run(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(CynefinElementModel);
      if (!models.length) return;
      const enable = !models.every(model => model[prop]);
      ctx.std.store.captureSync();
      const crud = ctx.std.get(EdgelessCRUDIdentifier);
      for (const model of models) crud.updateElement(model.id, { [prop]: enable });
    },
  };
}

export const cynefinToolbarConfig = {
  actions: [
    booleanToggle('a.toggle-resize', 'Enable / lock resizing', ResizeIcon, 'resizeEnabled'),
    booleanToggle('b.toggle-labels', 'Show / hide domain labels', LabelsIcon, 'showLabels'),
    booleanToggle('c.toggle-descriptions', 'Show / hide descriptions', DescIcon, 'showDescriptions'),
  ],
  when: ctx => ctx.getSurfaceModelsByType(CynefinElementModel).length > 0,
} as const satisfies ToolbarModuleConfig;

export const cynefinToolbarExtension = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:surface:cynefin'),
  config: cynefinToolbarConfig,
});
