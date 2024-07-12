import { css, html } from 'lit';

import './tool-icon-button.js';

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
  active?: boolean;
  className?: string;
  onClick: (event: MouseEvent) => void;
  size: 'l' | 's';
  tooltip?: string;
}

function getTooltip(size: LineSizeButtonProps['size']) {
  return {
    l: 'Thick',
    s: 'Thin',
  }[size];
}

export function LineSizeButton({
  active,
  className,
  onClick,
  size,
  tooltip: tooltipFromProps,
}: LineSizeButtonProps) {
  const classnames = `edgeless-component-line-size-button size-${size} ${
    active ? 'active' : ''
  }`;
  const tooltip =
    tooltipFromProps !== undefined ? tooltipFromProps : getTooltip(size);

  return html`<edgeless-tool-icon-button
    class=${className ?? ''}
    .active=${active ?? true}
    .activeMode=${'background'}
    .tooltip=${tooltip}
    @click=${onClick}
  >
    <div class=${classnames}>
      <div></div>
    </div>
  </edgeless-tool-icon-button>`;
}
