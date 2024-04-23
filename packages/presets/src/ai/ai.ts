import './actions/index.js'; // ensure global namespace is populated

import type { BlockSpec } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AFFINE_EDGELESS_COPILOT_WIDGET,
  AffineAIPanelWidget,
  AffineFormatBarWidget,
  AffineSlashMenuWidget,
  EdgelessCopilotWidget,
  EdgelessEditorBlockSpecs,
  EdgelessElementToolbarWidget,
  PageEditorBlockSpecs,
  ParagraphService,
} from '@blocksuite/blocks';
import { assertInstanceOf } from '@blocksuite/global/utils';
import { flip, offset, shift, size } from '@floating-ui/dom';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { buildAIPanelConfig } from './ai-panel.js';
import {
  setupEdgelessCopilot,
  setupEdgelessElementToolbarEntry,
} from './entries/edgeless/index.js';
import { setupFormatBarEntry } from './entries/format-bar/setup-format-bar.js';
import { setupSlashMenuEntry } from './entries/slash-menu/setup-slash-menu.js';
import { setupSpaceEntry } from './entries/space/setup-space.js';
import { getEdgelessService } from './utils/selection-utils.js';

export function patchDocSpecs(specs: BlockSpec[]) {
  return specs.map(spec => {
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
                view.component.style.width = '630px';
                view.component.config = buildAIPanelConfig(view.component, {
                  placement: 'bottom-start',
                  middleware: [
                    shift({
                      padding: 20,
                    }),
                  ],
                });
                setupSpaceEntry(view.component);
              }

              if (view.component instanceof AffineFormatBarWidget) {
                setupFormatBarEntry(view.component);
              }

              if (view.component instanceof AffineSlashMenuWidget) {
                setupSlashMenuEntry(view.component);
              }
            })
          );
        },
      };
      return newPageSpec;
    }

    if (spec.schema.model.flavour === 'affine:paragraph') {
      const newParagraphSpec: BlockSpec = {
        ...spec,
        setup(slots, disposableGroup) {
          spec.setup?.(slots, disposableGroup);
          slots.mounted.on(({ service }) => {
            assertInstanceOf(service, ParagraphService);
            service.placeholderGenerator = model => {
              if (model.type === 'text') {
                return "Type '/' for commands, 'space' for AI";
              }

              const placeholders = {
                h1: 'Heading 1',
                h2: 'Heading 2',
                h3: 'Heading 3',
                h4: 'Heading 4',
                h5: 'Heading 5',
                h6: 'Heading 6',
                quote: '',
              };
              return placeholders[model.type];
            };
          });
        },
      };
      return newParagraphSpec;
    }

    return spec;
  });
}

export function patchEdgelessSpecs(specs: BlockSpec[]) {
  return specs.map(spec => {
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
            [AFFINE_AI_PANEL_WIDGET]: literal`${unsafeStatic(
              AFFINE_AI_PANEL_WIDGET
            )}`,
          },
        },
        setup(slots) {
          slots.widgetConnected.on(view => {
            if (view.component instanceof AffineAIPanelWidget) {
              view.component.style.width = '430px';
              view.component.config = buildAIPanelConfig(view.component, {
                placement: 'right-start',
                middleware: [
                  offset({ mainAxis: 16 }),
                  shift(() => {
                    const { width, height } = getEdgelessService(
                      view.component.host
                    ).viewport;

                    return {
                      padding: 20,
                      crossAxis: true,
                      boundary: {
                        x: 20,
                        y: 50,
                        width: width - 40,
                        height: height - 120,
                      },
                    };
                  }),
                  flip({
                    crossAxis: true,
                  }),
                  size({
                    apply: ({ elements }) => {
                      const { height } = getEdgelessService(
                        view.component.host
                      ).viewport;
                      const aiPanelAnswer =
                        elements.floating.shadowRoot?.querySelector(
                          'ai-panel-answer'
                        );
                      if (aiPanelAnswer) {
                        aiPanelAnswer.style.maxHeight = `${height - 120}px`;
                      }
                    },
                  }),
                ],
              });
              setupSpaceEntry(view.component);
            }

            if (view.component instanceof EdgelessCopilotWidget) {
              setupEdgelessCopilot(view.component);
            }

            if (view.component instanceof EdgelessElementToolbarWidget) {
              setupEdgelessElementToolbarEntry(view.component);
            }

            if (view.component instanceof AffineFormatBarWidget) {
              setupFormatBarEntry(view.component);
            }

            if (view.component instanceof AffineSlashMenuWidget) {
              setupSlashMenuEntry(view.component);
            }
          });
        },
      };

      return newEdgelessSpec;
    }
    return spec;
  });
}

export function getAISpecs() {
  const pageModeSpecs = patchDocSpecs(PageEditorBlockSpecs);

  const edgelessModeSpecs = patchEdgelessSpecs(EdgelessEditorBlockSpecs);

  return {
    pageModeSpecs,
    edgelessModeSpecs,
  };
}
