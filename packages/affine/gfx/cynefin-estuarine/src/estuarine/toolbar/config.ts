import { EdgelessCRUDIdentifier } from '@labre/affine-block-surface';
import { EstuarineElementModel } from '@labre/affine-model';
import {
  type ToolbarContext,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@labre/affine-shared/services';
import { BlockFlavourIdentifier } from '@labre/std';
import { html, type TemplateResult } from 'lit';

const ResizeIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H5v4M15 19h4v-4" /><path d="M5 5l6 6M19 19l-6-6" /></svg>`;
// All curve icons use currentColor so the toolbar can grey them when inactive;
// they are distinguished by shape (wave / arc / hooked curve).
const LiminalIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 13c3-6 6 4 9 0s6-6 9 0" /></svg>`;
const VolatileIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 4a9 9 0 0 1 0 18" /></svg>`;
const CounterfactualIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7c7 0 11 4 12 14" /></svg>`;
const AxisIcon = html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v18M6 12h15" /><path d="M3 6l3-3 3 3M18 9l3 3-3 3" /></svg>`;

type EstuarineToggleProp =
  | 'resizeEnabled'
  | 'showLiminal'
  | 'showVolatile'
  | 'showCounterfactual'
  | 'showAxisLabels';

function booleanToggle(
  id: string,
  tooltip: string,
  icon: TemplateResult,
  prop: EstuarineToggleProp
) {
  return {
    id,
    tooltip,
    icon,
    active(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(EstuarineElementModel);
      return models.length > 0 && models.every(model => model[prop]);
    },
    run(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(EstuarineElementModel);
      if (!models.length) return;
      const enable = !models.every(model => model[prop]);
      ctx.std.store.captureSync();
      const crud = ctx.std.get(EdgelessCRUDIdentifier);
      for (const model of models) crud.updateElement(model.id, { [prop]: enable });
    },
  };
}

export const estuarineToolbarConfig = {
  actions: [
    booleanToggle('a.toggle-resize', 'Enable / lock resizing', ResizeIcon, 'resizeEnabled'),
    booleanToggle('b.toggle-liminal', 'Show / hide the Liminal line', LiminalIcon, 'showLiminal'),
    booleanToggle('c.toggle-volatile', 'Show / hide the Volatile line', VolatileIcon, 'showVolatile'),
    booleanToggle('d.toggle-counterfactual', 'Show / hide the Counter-factual line', CounterfactualIcon, 'showCounterfactual'),
    booleanToggle('e.toggle-axis-labels', 'Show / hide axis labels (e / t)', AxisIcon, 'showAxisLabels'),
  ],
  when: ctx => ctx.getSurfaceModelsByType(EstuarineElementModel).length > 0,
} as const satisfies ToolbarModuleConfig;

export const estuarineToolbarExtension = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:surface:estuarine'),
  config: estuarineToolbarConfig,
});
