import {
  BanIcon,
  DashLineIcon,
  StraightLineIcon,
} from '@blocksuite/affine-components/icons';
import { LineWidth, StrokeStyle } from '@blocksuite/affine-model';
import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { LineWidthEvent } from './line-width-panel.js';

export type LineStyleEvent =
  | {
      type: 'size';
      value: LineWidth;
    }
  | {
      type: 'lineStyle';
      value: StrokeStyle;
    };

interface LineStylesPanelProps {
  onClick?: (e: LineStyleEvent) => void;
  selectedLineSize?: LineWidth;
  selectedLineStyle?: StrokeStyle;
  lineStyles?: StrokeStyle[];
}

const LINE_STYLE_LIST = [
  {
    name: 'Solid',
    value: StrokeStyle.Solid,
    icon: StraightLineIcon,
  },
  {
    name: 'Dash',
    value: StrokeStyle.Dash,
    icon: DashLineIcon,
  },
  {
    name: 'None',
    value: StrokeStyle.None,
    icon: BanIcon,
  },
];

export function LineStylesPanel({
  onClick,
  selectedLineStyle,
  selectedLineSize = LineWidth.Two,
  lineStyles = [StrokeStyle.Solid, StrokeStyle.Dash, StrokeStyle.None],
}: LineStylesPanelProps = {}) {
  const lineSizePanel = html`
    <edgeless-line-width-panel
      ?disabled=${selectedLineStyle === StrokeStyle.None}
      .selectedSize=${selectedLineSize}
      @select=${(e: LineWidthEvent) => {
        onClick?.({
          type: 'size',
          value: e.detail,
        });
      }}
    ></edgeless-line-width-panel>
  `;

  const lineStyleButtons = repeat(
    LINE_STYLE_LIST.filter(item => lineStyles.includes(item.value)),
    item => item.value,
    ({ name, icon, value }) => {
      const active = selectedLineStyle === value;
      const classInfo = {
        'line-style-button': true,
        [`mode-${value}`]: true,
      };
      if (active) classInfo['active'] = true;

      return html`
        <edgeless-tool-icon-button
          class=${classMap(classInfo)}
          .active=${active}
          .activeMode=${'background'}
          .tooltip=${name}
          @click=${() =>
            onClick?.({
              type: 'lineStyle',
              value,
            })}
        >
          ${icon}
        </edgeless-tool-icon-button>
      `;
    }
  );

  return html`
    ${lineSizePanel}
    <editor-toolbar-separator></editor-toolbar-separator>
    ${lineStyleButtons}
  `;
}
