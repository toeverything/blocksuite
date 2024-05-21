import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import type { LineWidth } from '../../../../_common/types.js';
import {
  LineStyleButton,
  type LineStyleButtonProps,
} from '../buttons/line-style-button.js';
import type { LineWidthEvent } from './line-width-panel.js';

export type LineStyleEvent =
  | {
      type: 'size';
      value: LineWidth;
    }
  | {
      type: 'lineStyle';
      value: LineStyleButtonProps['mode'];
    };

interface LineStylesPanelProps {
  onClick?: (e: LineStyleEvent) => void;
  selectedLineSize?: LineWidth;
  selectedLineStyle?: LineStyleButtonProps['mode'];
  lineStyle?: LineStyleButtonProps['mode'][];
}

export function LineStylesPanel({
  onClick,
  selectedLineSize,
  selectedLineStyle,
  lineStyle = ['solid', 'dash', 'none'],
}: LineStylesPanelProps = {}) {
  const lineSizePanel = html`
    <edgeless-line-width-panel
      .selectedSize=${selectedLineSize as LineWidth}
      .disable=${selectedLineStyle === 'none'}
      @select=${(e: LineWidthEvent) => {
        onClick?.({
          type: 'size',
          value: e.detail,
        });
      }}
    ></edgeless-line-width-panel>
  `;

  const lineStyleButtons = repeat(
    lineStyle,
    mode => mode,
    mode => {
      return LineStyleButton({
        className: 'line-style-button',
        mode,
        active: mode === selectedLineStyle,
        onClick: () => {
          onClick?.({
            type: 'lineStyle',
            value: mode,
          });
        },
      });
    }
  );

  return html`
    ${lineSizePanel}
    <edgeless-menu-divider></edgeless-menu-divider>
    ${lineStyleButtons}
  `;
}
