import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  BanIcon,
  DashLineIcon,
  StraightLineIcon,
} from '../../../../_common/icons/edgeless.js';
import type { LineWidth } from '../../../../_common/types.js';
import { StrokeStyle } from '../../../../surface-block/consts.js';
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
  selectedLineSize,
  selectedLineStyle,
  lineStyles = [StrokeStyle.Solid, StrokeStyle.Dash, StrokeStyle.None],
}: LineStylesPanelProps = {}) {
  const lineSizePanel = html`
    <edgeless-line-width-panel
      .selectedSize=${selectedLineSize as LineWidth}
      .disable=${selectedLineStyle === StrokeStyle.None}
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
      const classes: Record<string, boolean> = {
        'line-style-button': true,
        [`mode-${value}`]: true,
      };
      if (active) classes['active'] = true;

      return html`
        <edgeless-tool-icon-button
          class=${classMap(classes)}
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
    <edgeless-menu-divider></edgeless-menu-divider>
    ${lineStyleButtons}
  `;
}
