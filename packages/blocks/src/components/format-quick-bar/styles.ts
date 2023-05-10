import { css } from 'lit';

import { tooltipStyle } from '../tooltip/tooltip.js';

const paragraphPanelStyle = css`
  .paragraph-button > svg:nth-child(2) {
    transition-duration: 0.3s;
  }
  .paragraph-button:is(:hover, :focus-visible, :active) > svg:nth-child(2) {
    transform: rotate(180deg);
  }

  .paragraph-panel {
    font-size: var(--affine-font-sm);
    box-sizing: border-box;
    position: absolute;
    min-width: 173px;
    padding: 8px 4px;
    overflow-y: auto;

    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-menu-shadow);
    border-radius: 8px;
    z-index: var(--affine-z-index-popover);
  }
`;

export const formatQuickBarStyle = css`
  .format-quick-bar {
    box-sizing: border-box;
    position: fixed;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    gap: 4px;
    height: 40px;

    border-radius: 8px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-menu-shadow);
    z-index: var(--affine-z-index-popover);
    user-select: none;
  }

  .divider {
    width: 1px;
    height: 24px;
    background-color: var(--affine-border-color);
  }

  ${paragraphPanelStyle}
  ${tooltipStyle}
`;
