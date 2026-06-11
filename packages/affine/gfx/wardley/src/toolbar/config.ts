import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import { WardleyBackgroundElementModel } from '@blocksuite/affine-model';
import {
  TelemetryProvider,
  type ToolbarContext,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@blocksuite/affine-shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/std';
import { html, type TemplateResult } from 'lit';

import { createWardleyLegend } from '../legend';
import { wardleyLegendIcon } from './icons';

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

/** Gradient swatch — show/hide the variant gradient. */
const GradientIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <linearGradient id="wardleyToolbarGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="currentColor" stop-opacity="0.85" />
      <stop offset="1" stop-color="currentColor" stop-opacity="0.1" />
    </linearGradient>
  </defs>
  <rect
    x="4"
    y="5"
    width="16"
    height="14"
    rx="2"
    fill="url(#wardleyToolbarGrad)"
    stroke="currentColor"
    stroke-width="1.4"
  />
</svg>`;

/** Horizontal axis with a right-pointing arrow (Evolution / X). */
const XAxisIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M3 17h15" />
  <path d="M15 14l3 3-3 3" />
</svg>`;

/** Vertical axis with an up-pointing arrow (Value Chain / Y). */
const YAxisIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M7 21V6" />
  <path d="M4 9l3-3 3 3" />
</svg>`;

/** Dashed vertical column dividers. */
const ColumnsIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-dasharray="3 3"
>
  <path d="M9 4v16M15 4v16" />
</svg>`;

/** Column labels (short bars under the columns). */
const ColumnLabelsIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="currentColor"
  stroke="none"
>
  <rect x="3" y="15" width="4.5" height="3" rx="1" />
  <rect x="9.75" y="15" width="4.5" height="3" rx="1" />
  <rect x="16.5" y="15" width="4.5" height="3" rx="1" />
</svg>`;

/** Corner labels (Uncharted / Industrialized, top corners). */
const CornerLabelsIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="currentColor"
  stroke="none"
>
  <rect x="3" y="5" width="6" height="3" rx="1" />
  <rect x="15" y="5" width="6" height="3" rx="1" />
</svg>`;

/** Visibility labels (Visible / Invisible) — an eye. */
const VisibilityIcon = html`<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
  <circle cx="12" cy="12" r="2.4" />
</svg>`;

type WardleyToggleProp =
  | 'resizeEnabled'
  | 'showGradient'
  | 'showXAxis'
  | 'showYAxis'
  | 'showColumnDividers'
  | 'showColumnLabels'
  | 'showCornerLabels'
  | 'showVisibilityLabels';

/**
 * Build a toolbar toggle that flips a boolean flag on every selected Wardley
 * background: `active` reflects the current state, `run` flips it (with an
 * undo checkpoint). An optional `when` predicate hides the button.
 */
function booleanToggle(
  id: string,
  tooltip: string,
  icon: TemplateResult,
  prop: WardleyToggleProp,
  when?: (ctx: ToolbarContext) => boolean
) {
  return {
    id,
    tooltip,
    icon,
    when: when ?? true,
    active(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(WardleyBackgroundElementModel);
      return models.length > 0 && models.every(model => model[prop]);
    },
    run(ctx: ToolbarContext) {
      const models = ctx.getSurfaceModelsByType(WardleyBackgroundElementModel);
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

export const wardleyToolbarConfig = {
  actions: [
    booleanToggle(
      'a.toggle-resize',
      'Enable / lock resizing',
      ResizeIcon,
      'resizeEnabled'
    ),
    // Group 1 — evolution (X) side: axis, phase labels, columns, corner
    // labels, and the gradient toggle.
    {
      id: 'b.evolution',
      actions: [
        booleanToggle(
          'b.1-axis-x',
          'Evolution axis (X)',
          XAxisIcon,
          'showXAxis'
        ),
        booleanToggle(
          'b.2-column-labels',
          'Evolution phase labels',
          ColumnLabelsIcon,
          'showColumnLabels'
        ),
        booleanToggle(
          'b.3-columns',
          'Columns (dividers)',
          ColumnsIcon,
          'showColumnDividers'
        ),
        booleanToggle(
          'b.4-corner-labels',
          'Labels Uncharted / Industrialized',
          CornerLabelsIcon,
          'showCornerLabels'
        ),
        // Only relevant when the selection has a gradient variant.
        booleanToggle(
          'b.5-gradient',
          'Show / hide the gradient',
          GradientIcon,
          'showGradient',
          ctx =>
            ctx
              .getSurfaceModelsByType(WardleyBackgroundElementModel)
              .some(model => model.variant !== 'classic')
        ),
      ],
    },
    // Group 2 — value-chain (Y) side: axis and Visible/Invisible labels.
    {
      id: 'c.value-chain',
      actions: [
        booleanToggle(
          'c.1-axis-y',
          'Value Chain axis (Y)',
          YAxisIcon,
          'showYAxis'
        ),
        booleanToggle(
          'c.2-visibility-labels',
          'Labels Visible / Invisible',
          VisibilityIcon,
          'showVisibilityLabels'
        ),
      ],
    },
    // Generate the auto-legend from the components present inside this
    // background's perimeter (+ a gradient-meaning block for gradient variants).
    {
      id: 'd.legend',
      tooltip: 'Generate the legend (components present)',
      icon: wardleyLegendIcon,
      run(ctx) {
        const models = ctx.getSurfaceModelsByType(WardleyBackgroundElementModel);
        const bg = models[0];
        if (!bg) return;
        createWardleyLegend(ctx.std, bg);
        ctx.std.getOptional(TelemetryProvider)?.track('FrameworkLegendCreated', {
          framework: 'wardley',
          element: 'legend',
          page: 'whiteboard editor',
          segment: 'element toolbar',
          module: 'wardley toolbar',
        });
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
