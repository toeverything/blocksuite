import './tool-icon-button.js';

import { css, html } from 'lit';

import {
  BanIcon,
  DashLineIcon,
  StraightLineIcon,
} from '../../../../icons/index.js';

export const lineStyleButtonStyles = [
  css`
    .edgeless-component-line-style-button {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--affine-icon-color);
    }

    .line-style-button:nth-of-type(2),
    .line-style-button:nth-of-type(3) {
      margin-left: 8px;
    }
  `,
];

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
  const classnames = `edgeless-component-line-style-button mode-${mode} ${
    active ? 'active' : ''
  }`;
  const icon = getModeIcon(mode);
  const tooltip =
    tooltipFromProps !== undefined ? tooltipFromProps : getModeTooltip(mode);

  return html`<edgeless-tool-icon-button
    class=${className ?? ''}
    .active=${active ?? false}
    .activeMode=${'background'}
    .tooltip=${tooltip}
    .iconContainerPadding=${2}
    @click=${onClick}
  >
    <div class=${classnames}>${icon}</div>
  </edgeless-tool-icon-button>`;
}
