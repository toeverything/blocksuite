import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { LineWidth } from '../../../../_common/types.js';
import type { LineWidthEvent } from './line-width-panel.js';

import '../../../../_common/components/toolbar/separator.js';
import {
  BanIcon,
  DashLineIcon,
  StraightLineIcon,
} from '../../../../_common/icons/edgeless.js';
import { StrokeStyle } from '../../../../surface-block/consts.js';

export type LineStyleEvent =
  | {
      type: 'lineStyle';
      value: StrokeStyle;
    }
  | {
      type: 'size';
      value: LineWidth;
    };

interface LineStylesPanelProps {
  lineStyles?: StrokeStyle[];
  onClick?: (e: LineStyleEvent) => void;
  selectedLineSize?: LineWidth;
  selectedLineStyle?: StrokeStyle;
}

const LINE_STYLE_LIST = [
  {
    icon: StraightLineIcon,
    name: 'Solid',
    value: StrokeStyle.Solid,
  },
  {
    icon: DashLineIcon,
    name: 'Dash',
    value: StrokeStyle.Dash,
  },
  {
    icon: BanIcon,
    name: 'None',
    value: StrokeStyle.None,
  },
];

export function LineStylesPanel({
  lineStyles = [StrokeStyle.Solid, StrokeStyle.Dash, StrokeStyle.None],
  onClick,
  selectedLineSize,
  selectedLineStyle,
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
    ({ icon, name, value }) => {
      const active = selectedLineStyle === value;
      const classes: Record<string, boolean> = {
        [`mode-${value}`]: true,
        'line-style-button': true,
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
    <editor-toolbar-separator></editor-toolbar-separator>
    ${lineStyleButtons}
  `;
}
