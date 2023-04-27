import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import {
  LineSizeButton,
  type LineSizeButtonProps,
  lineSizeButtonStyles,
} from './line-size-button.js';
import {
  LineStyleButton,
  type LineStyleButtonProps,
  lineStyleButtonStyles,
} from './line-style-button.js';
import { PanelWrapper, panelWrapperStyle } from './panel-wrapper.js';

export const lineStylesPanelStyles = [
  panelWrapperStyle,
  lineSizeButtonStyles,
  lineStyleButtonStyles,
];

export type LineStylesPanelClickedButton =
  | {
      type: 'size';
      value: LineSizeButtonProps['size'];
    }
  | {
      type: 'lineStyle';
      value: LineStyleButtonProps['mode'];
    };

interface LineStylesPanelProps {
  onClick?: (clickedButton: LineStylesPanelClickedButton) => void;
  selectedLineSize?: LineSizeButtonProps['size'];
  selectedLineStyle?: LineStyleButtonProps['mode'];
  lineStyle?: LineStyleButtonProps['mode'][];
}

export function LineStylesPanel({
  onClick,
  selectedLineSize,
  selectedLineStyle,
  lineStyle = ['solid', 'dash', 'none'],
}: LineStylesPanelProps = {}) {
  const lineSizeButtons = repeat(
    ['s', 'l'] as const,
    size => size,
    size => {
      return LineSizeButton({
        size,
        active: size === selectedLineSize,
        onClick: () => {
          onClick?.({
            type: 'size',
            value: size,
          });
        },
      });
    }
  );

  const lineStyleButtons = repeat(
    lineStyle,
    mode => mode,
    mode => {
      return LineStyleButton({
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
      ${lineSizeButtons}
      <menu-divider .vertical=${true}></menu-divider>
      ${lineStyleButtons}
    `,
  });
}
