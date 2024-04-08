import type { BlockSpec } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AFFINE_EDGELESS_COPILOT_WIDGET,
  AffineAIPanelWidget,
  AffineFormatBarWidget,
  AffineSlashMenuWidget,
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from '@blocksuite/blocks';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { buildAIActionGroups, buildAIPanelConfig } from './config/builder.js';
import { setupFormatBarEntry } from './entries/format-bar/setup-format-bar.js';
import { setupSlashMenuEntry } from './entries/slash-menu/setup-slash-menu.js';
import { setupSpaceEntry } from './entries/space/setup-space.js';
import type { AIConfig } from './types.js';

export function getAISpecs(config: AIConfig) {
  const pageModeSpecs = PageEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      const newPageSpec: BlockSpec = {
        ...spec,
        view: {
          ...spec.view,
          widgets: {
            ...spec.view.widgets,
            [AFFINE_AI_PANEL_WIDGET]: literal`${unsafeStatic(
              AFFINE_AI_PANEL_WIDGET
            )}`,
          },
        },
        setup: (slots, disposableGroup) => {
          disposableGroup.add(
            slots.widgetConnected.on(view => {
              if (view.component instanceof AffineAIPanelWidget) {
                view.component.config = buildAIPanelConfig(view.component);
                if (config.getAskAIStream) {
                  setupSpaceEntry(view.component, config);
                }
              }

              if (view.component instanceof AffineFormatBarWidget) {
                const actionGroups = buildAIActionGroups(config);
                setupFormatBarEntry(view.component, actionGroups);
              }

              if (view.component instanceof AffineSlashMenuWidget) {
                setupSlashMenuEntry(view.component, config);
              }
            })
          );
        },
      };
      return newPageSpec;
    }
    return spec;
  });

  const edgelessModeSpecs = EdgelessEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      const newEdgelessSpec: BlockSpec = {
        ...spec,
        view: {
          ...spec.view,
          widgets: {
            ...spec.view.widgets,
            [AFFINE_EDGELESS_COPILOT_WIDGET]: literal`${unsafeStatic(
              AFFINE_EDGELESS_COPILOT_WIDGET
            )}`,
          },
        },
      };

      return newEdgelessSpec;
    }
    return spec;
  });

  return {
    pageModeSpecs,
    edgelessModeSpecs,
  };
}
