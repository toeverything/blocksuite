import type { BlockSpec } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from '@blocksuite/blocks';
import { AffineFormatBarWidget } from '@blocksuite/blocks';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { setupFormatBarEntry } from './entry/format-bar/setup-format-bar';
import { setupSpaceEntry } from './entry/space/setup-space';

export function getAISpecs() {
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
                setupSpaceEntry(view.component);
              }

              if (view.component instanceof AffineFormatBarWidget) {
                setupFormatBarEntry(view.component);
              }
            })
          );
        },
      };
      return newPageSpec;
    }
    return spec;
  });

  return {
    pageModeSpecs,
    edgelessModeSpecs: EdgelessEditorBlockSpecs,
  };
}
