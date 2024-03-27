import type { BlockSpec } from '@blocksuite/block-std';
import {
  AFFINE_AI_ACTION_PANEL_WIDGET,
  AffineAIActionPanelWidget,
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from '@blocksuite/blocks';
import { InsertBelowIcon } from '@blocksuite/blocks';
import { html } from 'lit';
import { literal, unsafeStatic } from 'lit/static-html.js';

export function getAIActionPanelSpecs() {
  const pageModeSpecs = PageEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:page') {
      const newPageSpec: BlockSpec = {
        ...spec,
        view: {
          ...spec.view,
          widgets: {
            ...spec.view.widgets,
            [AFFINE_AI_ACTION_PANEL_WIDGET]: literal`${unsafeStatic(
              AFFINE_AI_ACTION_PANEL_WIDGET
            )}`,
          },
        },
        setup: (slots, disposableGroup) => {
          let answer = '';
          disposableGroup.add(
            slots.widgetConnected.on(view => {
              if (view.component instanceof AffineAIActionPanelWidget) {
                view.component.config = {
                  answerRenderer: answer => html`<div>${answer}</div>`,
                  generateAnswer: ({ input, update, finish, signal }) => {
                    const interval = setInterval(() => {
                      answer += input;
                      update(answer);
                    }, 1000);
                    const timeout = setTimeout(() => {
                      clearInterval(interval);
                      // finish('error');
                      finish('success');
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
                        text: 'Example Response',
                        handler: () => {},
                      },
                    ],
                    actions: [
                      {
                        head: 'Example Action',
                        items: [
                          {
                            icon: InsertBelowIcon,
                            text: 'Example Action',
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
