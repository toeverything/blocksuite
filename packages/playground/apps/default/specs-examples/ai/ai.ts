import type { BlockSpec } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
  toolbarDefaultConfig,
} from '@blocksuite/blocks';
import { AffineFormatBarWidget } from '@blocksuite/blocks';
import { html, type TemplateResult } from 'lit';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { FormatBarAIButton } from './format-bar-ai-button';
import { setupAIPanel } from './panel/setup';

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
                setupAIPanel(view.component);
              }

              if (view.component instanceof AffineFormatBarWidget) {
                const formatBar = view.component;
                toolbarDefaultConfig(formatBar);
                formatBar.addRawConfigItems(
                  [
                    {
                      type: 'custom' as const,
                      render(
                        formatBar: AffineFormatBarWidget
                      ): TemplateResult | null {
                        const askAIButton = new FormatBarAIButton();
                        askAIButton.host = formatBar.host;
                        return html`${askAIButton}`;
                      },
                    },
                    { type: 'divider' },
                  ],
                  0
                );
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
