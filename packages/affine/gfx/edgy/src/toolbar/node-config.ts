import { EdgelessCRUDIdentifier } from '@labre/affine-block-surface';
import {
  packColor,
  type PickColorEvent,
} from '@labre/affine-components/color-picker';
import { shapeToolbarConfig } from '@labre/affine-gfx-shape';
import {
  type Color,
  DefaultTheme,
  isTransparent,
  LineWidth,
  type Palette,
  resolveColor,
  ShapeElementModel,
  StrokeStyle,
} from '@labre/affine-model';
import {
  type ToolbarContext,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@labre/affine-shared/services';
import { getMostCommonValue } from '@labre/affine-shared/utils';
import { BlockFlavourIdentifier } from '@labre/std';
import { html } from 'lit';

/**
 * The typical EDGY palette, surfaced as ready-made swatches in the EDGY node
 * color picker (facet + intersection colours, saturated then pastel), followed
 * by the default editor palette.
 */
const EDGY_PALETTES: Palette[] = [
  { key: 'Identity', value: '#00ea4e' },
  { key: 'Architecture', value: '#034cee' },
  { key: 'Experience', value: '#ff0056' },
  { key: 'Organisation', value: '#00caf4' },
  { key: 'Brand', value: '#ffa500' },
  { key: 'Product', value: '#cf00ff' },
  { key: 'Identity light', value: '#80ffb7' },
  { key: 'Architecture light', value: '#a6c0ff' },
  { key: 'Experience light', value: '#ff99bd' },
  { key: 'Organisation light', value: '#80eaff' },
  { key: 'Brand light', value: '#ffd580' },
  { key: 'Product light', value: '#e599ff' },
];

/**
 * From the default editor palette we keep ONLY the neutrals (greys, white,
 * black, transparent) — the historical colours are dropped in favour of the
 * EDGY swatches above.
 */
const NEUTRAL_KEY = /grey|gray|white|black|transparent/i;

const EDGY_PALETTE_LIST: Palette[] = [
  ...EDGY_PALETTES,
  ...DefaultTheme.Palettes.filter(p => NEUTRAL_KEY.test(p.key)),
];

// Mirror of the shape color action's text-color rule.
function getTextColor(fillColor: Color) {
  if (fillColor === DefaultTheme.black) return DefaultTheme.white;
  if (fillColor === DefaultTheme.white) return DefaultTheme.black;
  return DefaultTheme.shapeTextColor;
}

/**
 * EDGY fill / stroke colour picker — identical to the shape one but seeded with
 * the EDGY palette swatches (`.palettes`).
 */
const edgyColorAction = {
  id: 'e.color',
  when(ctx: ToolbarContext) {
    return ctx.getSurfaceModelsByType(ShapeElementModel).length > 0;
  },
  content(ctx: ToolbarContext) {
    const models = ctx.getSurfaceModelsByType(ShapeElementModel);
    if (!models.length) return null;

    const enableCustomColor = ctx.features.getFlag('enable_color_picker');
    const theme = ctx.theme.edgeless$.value;

    const firstModel = models[0];
    const originalFillColor = firstModel.fillColor;
    const originalStrokeColor = firstModel.strokeColor;

    const mapped = models.map(
      ({ filled, fillColor, strokeColor, strokeWidth, strokeStyle }) => ({
        fillColor: filled
          ? resolveColor(fillColor, theme)
          : DefaultTheme.transparent,
        strokeColor: resolveColor(strokeColor, theme),
        strokeWidth,
        strokeStyle,
      })
    );
    const fillColor =
      getMostCommonValue(mapped, 'fillColor') ??
      resolveColor(DefaultTheme.shapeFillColor, theme);
    const strokeColor =
      getMostCommonValue(mapped, 'strokeColor') ??
      resolveColor(DefaultTheme.shapeStrokeColor, theme);
    const strokeWidth =
      getMostCommonValue(mapped, 'strokeWidth') ?? LineWidth.Four;
    const strokeStyle =
      getMostCommonValue(mapped, 'strokeStyle') ?? StrokeStyle.Solid;

    const pickColorWrapper =
      (field: string, pickCallback: (palette: Palette) => void) =>
      (e: CustomEvent<PickColorEvent>) => {
        e.stopPropagation();
        switch (e.detail.type) {
          case 'pick':
            pickCallback(e.detail.detail);
            break;
          case 'start':
            ctx.store.captureSync();
            models.forEach(model => model.stash(field));
            break;
          case 'end':
            ctx.store.transact(() => {
              models.forEach(model => model.pop(field));
            });
        }
      };

    const onPickFillColor = pickColorWrapper('fillColor', palette => {
      const value = palette.value;
      const filled = isTransparent(value);
      const props = packColor('fillColor', value);
      const crud = ctx.std.get(EdgelessCRUDIdentifier);
      models.forEach(model => {
        if (filled && !model.filled) {
          const color = getTextColor(value);
          Object.assign(props, { filled, color });
        }
        crud.updateElement(model.id, props);
      });
    });

    const onPickStrokeColor = pickColorWrapper('strokeColor', palette => {
      const props = packColor('strokeColor', palette.value);
      const crud = ctx.std.get(EdgelessCRUDIdentifier);
      models.forEach(model => crud.updateElement(model.id, props));
    });

    const onPickStrokeStyle = (
      e: CustomEvent<{ type: string; value: number & StrokeStyle }>
    ) => {
      e.stopPropagation();
      const { type, value } = e.detail;
      const crud = ctx.std.get(EdgelessCRUDIdentifier);
      const props =
        type === 'size'
          ? { strokeWidth: value as number }
          : { strokeStyle: value as StrokeStyle };
      for (const model of models) {
        crud.updateElement(model.id, props);
      }
    };

    return html`
      <edgeless-shape-color-picker
        @pickFillColor=${onPickFillColor}
        @pickStrokeColor=${onPickStrokeColor}
        @pickStrokeStyle=${onPickStrokeStyle}
        .palettes=${EDGY_PALETTE_LIST}
        .payload=${{
          fillColor,
          strokeColor,
          strokeWidth,
          strokeStyle,
          originalFillColor,
          originalStrokeColor,
          theme,
          enableCustomColor,
        }}
      >
      </edgeless-shape-color-picker>
    `;
  },
};

/**
 * EDGY nodes are {@link ShapeElementModel} subclasses, so the shape toolbar's
 * actions operate on them directly. We reuse the line-style + text actions, add
 * the EDGY-seeded color picker, and drop the actions that don't fit an EDGY base
 * shape (switch shape type, edit polygon vertices).
 */
const KEEP_FROM_SHAPE = (id: string) =>
  id === 'd.style' || id === 'f.text' || id.startsWith('g.text-');

const edgyNodeToolbarConfig = {
  actions: [
    ...shapeToolbarConfig.actions.filter(action => KEEP_FROM_SHAPE(action.id)),
    edgyColorAction,
  ],
  when: shapeToolbarConfig.when,
} as ToolbarModuleConfig;

export const edgyNodeToolbarExtension = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('affine:surface:edgyNode'),
  config: edgyNodeToolbarConfig,
});
