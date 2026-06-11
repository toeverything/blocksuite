import { EdgelessCRUDIdentifier } from '@labre/affine-block-surface';
import { EdgyFacetsElementModel } from '@labre/affine-model';
import {
  type ToolbarContext,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@labre/affine-shared/services';
import { BlockFlavourIdentifier } from '@labre/std';
import { html, type TemplateResult } from 'lit';

const ResizeIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M9 5H5v4M15 19h4v-4" />
  <path d="M5 5l6 6M19 19l-6-6" />
</svg>`;

/** Tag — show / hide the facet name labels. */
const LabelsIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M3 8.5l6-4.5 12 0 0 16-12 0-6-4.5z" />
  <circle cx="8" cy="12" r="1.4" />
</svg>`;

type EdgyToggleProp = 'resizeEnabled' | 'showLabels';

/**
 * Build a toolbar toggle that flips a boolean flag on every selected facets
 * diagram: `active` reflects the current state, `run` flips it (with an undo
 * checkpoint).
 */
function booleanToggle(
  id: string,
  tooltip: string,
  icon: TemplateResult,
  prop: EdgyToggleProp
) {
  return {
    id,
    tooltip,
    icon,
    active(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(EdgyFacetsElementModel);
      return models.length > 0 && models.every(model => model[prop]);
    },
    run(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(EdgyFacetsElementModel);
      if (!models.length) return;

      const enable = !models.every(model => model[prop]);
      ctx.std.store.captureSync();
      const crud = ctx.std.get(EdgelessCRUDIdentifier);
      for (const model of models) {
        crud.updateElement(model.id, { [prop]: enable });
      }
    },
  };
}

export const edgyToolbarConfig = {
  actions: [
    booleanToggle(
      'a.toggle-resize',
      'Enable / lock resizing',
      ResizeIcon,
      'resizeEnabled'
    ),
    booleanToggle(
      'b.toggle-labels',
      'Show / hide facet labels',
      LabelsIcon,
      'showLabels'
    ),
  ],
  when: ctx => ctx.getSurfaceModelsByType(EdgyFacetsElementModel).length > 0,
} as const satisfies ToolbarModuleConfig;

export const edgyToolbarExtension = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:surface:edgy'),
  config: edgyToolbarConfig,
});
