import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import type { LineWidth } from '../../../../__internal__/utils/types.js';
import {
  LineStyleButton,
  type LineStyleButtonProps,
  lineStyleButtonStyles,
} from '../buttons/line-style-button.js';
import type { LineWidthEvent } from './line-width-panel.js';
import { PanelWrapper, panelWrapperStyle } from './panel-wrapper.js';

export const lineStylesPanelStyles = [panelWrapperStyle, lineStyleButtonStyles];

export type LineStylesPanelClickedButton =
  | {
      type: 'size';
      value: LineWidth;
    }
  | {
      type: 'lineStyle';
      value: LineStyleButtonProps['mode'];
    };

interface LineStylesPanelProps {
  onClick?: (clickedButton: LineStylesPanelClickedButton) => void;
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

  return PanelWrapper({
    className: 'line-style-panel',
    children: html`
      ${lineSizePanel}
      <menu-divider .vertical=${true}></menu-divider>
      ${lineStyleButtons}
    `,
  });
}
