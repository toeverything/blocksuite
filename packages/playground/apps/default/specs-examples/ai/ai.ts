import type { BlockSpec } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
  toolbarDefaultConfig,
} from '@blocksuite/blocks';
import { AffineFormatBarWidget } from '@blocksuite/blocks';
import { InsertBelowIcon } from '@blocksuite/blocks';
import { html, type TemplateResult } from 'lit';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { FormatBarAIButton } from './format-bar-ai-button';

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
          let answer = '';
          disposableGroup.add(
            slots.widgetConnected.on(view => {
              if (view.component instanceof AffineAIPanelWidget) {
                const panel = view.component;
                panel.handleEvent('keyDown', ctx => {
                  const keyboardState = ctx.get('keyboardState');
                  if (keyboardState.raw.key === ' ') {
                    const selection = panel.host.selection.find('text');
                    if (
                      selection &&
                      selection.isCollapsed() &&
                      selection.from.index === 0
                    ) {
                      const block = panel.host.view.viewFromPath(
                        'block',
                        selection.path
                      );
                      if (!block?.model?.text || block.model.text?.length > 0)
                        return;

                      keyboardState.raw.preventDefault();
                      panel.toggle(block);
                    }
                  }
                });

                panel.config = {
                  answerRenderer: answer => html`<div>${answer}</div>`,
                  generateAnswer: ({ input, update, finish, signal }) => {
                    const interval = setInterval(() => {
                      answer += input;
                      update(answer);
                    }, 1000);
                    const timeout = setTimeout(() => {
                      clearInterval(interval);
                      finish('error');
                      // finish('success');
                    }, 5000);
                    signal.addEventListener('abort', () => {
                      clearInterval(interval);
                      clearTimeout(timeout);
                    });
                  },

                  finishStateConfig: {
                    responses: [
                      {
                        icon: InsertBelowIcon,
                        name: 'Example Response',
                        handler: () => {},
                      },
                    ],
                    actions: [
                      {
                        name: 'Example Action',
                        items: [
                          {
                            icon: InsertBelowIcon,
                            name: 'Example Action',
                            handler: () => {},
                          },
                        ],
                      },
                    ],
                  },
                  errorStateConfig: {
                    upgrade: () => {},
                    responses: [],
                  },
                };
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
