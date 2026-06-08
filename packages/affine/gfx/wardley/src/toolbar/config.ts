import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import { WardleyBackgroundElementModel } from '@blocksuite/affine-model';
import {
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@blocksuite/affine-shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/std';
import { html } from 'lit';

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

export const wardleyToolbarConfig = {
  actions: [
    {
      id: 'a.toggle-resize',
      tooltip: 'Activer / verrouiller le redimensionnement',
      icon: ResizeIcon,
      active(ctx) {
        const models = ctx.getSurfaceModelsByType(WardleyBackgroundElementModel);
        return models.length > 0 && models.every(model => model.resizeEnabled);
      },
      run(ctx) {
        const models = ctx.getSurfaceModelsByType(WardleyBackgroundElementModel);
        if (!models.length) return;

        const enable = !models.every(model => model.resizeEnabled);
        ctx.std.store.captureSync();
        const crud = ctx.std.get(EdgelessCRUDIdentifier);
        for (const model of models) {
          crud.updateElement(model.id, { resizeEnabled: enable });
        }
      },
    },
  ],
  when: ctx =>
    ctx.getSurfaceModelsByType(WardleyBackgroundElementModel).length > 0,
} as const satisfies ToolbarModuleConfig;

export const wardleyToolbarExtension = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:surface:wardley'),
  config: wardleyToolbarConfig,
});
