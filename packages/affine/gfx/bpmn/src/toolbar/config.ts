import { EdgelessCRUDIdentifier } from '@labre/affine-block-surface';
import { BpmnPoolElementModel } from '@labre/affine-model';
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

type BpmnPoolToggleProp = 'resizeEnabled';

/**
 * Build a toolbar toggle that flips a boolean flag on every selected pool:
 * `active` reflects the current state, `run` flips it (with an undo checkpoint).
 */
function booleanToggle(
  id: string,
  tooltip: string,
  icon: TemplateResult,
  prop: BpmnPoolToggleProp
) {
  return {
    id,
    tooltip,
    icon,
    active(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(BpmnPoolElementModel);
      return models.length > 0 && models.every(model => model[prop]);
    },
    run(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(BpmnPoolElementModel);
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

export const bpmnPoolToolbarConfig = {
  actions: [
    booleanToggle(
      'a.toggle-resize',
      'Enable / lock resizing',
      ResizeIcon,
      'resizeEnabled'
    ),
  ],
  when: ctx => ctx.getSurfaceModelsByType(BpmnPoolElementModel).length > 0,
} as const satisfies ToolbarModuleConfig;

export const bpmnPoolToolbarExtension = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:surface:bpmnPool'),
  config: bpmnPoolToolbarConfig,
});
