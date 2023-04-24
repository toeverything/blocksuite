import './tool-icon-button.js';

import { css, html } from 'lit';

export const lineSizeButtonStyles = [
  css`
    .edgeless-component-line-size-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 16px;
      height: 16px;
    }

    .edgeless-component-line-size-button div {
      border-radius: 50%;
      background-color: var(--affine-icon-color);
    }

    .edgeless-component-line-size-button.size-s div {
      width: 4px;
      height: 4px;
    }
    .edgeless-component-line-size-button.size-l div {
      width: 10px;
      height: 10px;
    }
  `,
];

export interface LineSizeButtonProps {
  className?: string;
  size: 's' | 'l';
  active?: boolean;
  tooltip?: string;
  onClick: (event: MouseEvent) => void;
}

function getTooltip(size: LineSizeButtonProps['size']) {
  return {
    s: 'Thin',
    l: 'Thick',
  }[size];
}

export function LineSizeButton({
  className,
  size,
  active,
  tooltip: tooltipFromProps,
  onClick,
}: LineSizeButtonProps) {
  const classnames = `edgeless-component-line-size-button size-${size} ${
    active ? 'active' : ''
  }`;
  const tooltip =
    tooltipFromProps !== undefined ? tooltipFromProps : getTooltip(size);

  return html`<edgeless-tool-icon-button
    class=${className}
    .active=${active}
    .activeMode=${'background'}
    .tooltip=${tooltip}
    @click=${onClick}
  >
    <div class=${classnames}>
      <div></div>
    </div>
  </edgeless-tool-icon-button>`;
}
