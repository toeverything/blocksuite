import './tool-icon-button.js';

import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

import {
  BanIcon,
  DashLineIcon,
  StraightLineIcon,
} from '../../../../_common/icons/index.js';

export interface LineStyleButtonProps {
  className?: string;
  mode: 'solid' | 'dash' | 'none';
  active?: boolean;
  tooltip?: boolean;
  onClick: (event: MouseEvent) => void;
}

function getModeIcon(mode: LineStyleButtonProps['mode']) {
  switch (mode) {
    case 'solid': {
      return StraightLineIcon;
    }
    case 'dash': {
      return DashLineIcon;
    }
    case 'none': {
      return BanIcon;
    }
  }
}

function getModeTooltip(mode: LineStyleButtonProps['mode']) {
  return {
    solid: 'Solid',
    dash: 'Dash',
    none: 'None',
  }[mode];
}

export function LineStyleButton({
  className,
  mode,
  active,
  tooltip: tooltipFromProps,
  onClick,
}: LineStyleButtonProps) {
  const classes: Record<string, boolean> = {};
  classes[`mode-${mode}`] = true;
  if (className) classes[className] = true;
  if (active) classes['active'] = true;
  const icon = getModeIcon(mode);
  const tooltip =
    tooltipFromProps !== undefined ? tooltipFromProps : getModeTooltip(mode);

  return html`<edgeless-tool-icon-button
    class=${classMap(classes)}
    .active=${active ?? false}
    .activeMode=${'background'}
    .tooltip=${tooltip}
    @click=${onClick}
  >
    ${icon}
  </edgeless-tool-icon-button>`;
}
