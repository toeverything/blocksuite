import { EdgelessCRUDIdentifier } from '@labre/affine-block-surface';
import { CynefinElementModel } from '@labre/affine-model';
import {
  type ToolbarContext,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@labre/affine-shared/services';
import { BlockFlavourIdentifier } from '@labre/std';
import { html, type TemplateResult } from 'lit';

const ResizeIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H5v4M15 19h4v-4" /><path d="M5 5l6 6M19 19l-6-6" /></svg>`;
const TitlesIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14M9 7v11" /></svg>`;
const DescIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14M5 12h14M5 16h9" /></svg>`;
const LiminalIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17 C9 6 15 6 19 7" /></svg>`;

type CynefinToggleProp =
  | 'resizeEnabled'
  | 'showTitles'
  | 'showDescriptions'
  | 'showLiminalLine';

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
    booleanToggle('b.toggle-titles', 'Show / hide titles', TitlesIcon, 'showTitles'),
    booleanToggle('c.toggle-descriptions', 'Show / hide explanatory text', DescIcon, 'showDescriptions'),
    booleanToggle('d.toggle-liminal', 'Show / hide liminal line', LiminalIcon, 'showLiminalLine'),
  ],
  when: ctx => ctx.getSurfaceModelsByType(CynefinElementModel).length > 0,
} as const satisfies ToolbarModuleConfig;

export const cynefinToolbarExtension = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:surface:cynefin'),
  config: cynefinToolbarConfig,
});
