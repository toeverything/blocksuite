import { css } from 'lit';

import { tooltipStyle } from '../../components/tooltip/tooltip.js';

const paragraphButtonStyle = css`
  .paragraph-button-icon > svg:nth-child(2) {
    transition-duration: 0.3s;
  }
  .paragraph-button-icon:is(:hover, :focus-visible, :active)
    > svg:nth-child(2) {
    transform: rotate(180deg);
  }

  .paragraph-panel {
    display: none;

    font-size: var(--affine-font-sm);
    box-sizing: border-box;
    position: absolute;
    min-width: 173px;
    padding: 8px 4px;
    overflow-y: auto;

    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    border-radius: 8px;
    z-index: var(--affine-z-index-popover);
  }

  .background-highlight-icon > svg:nth-child(2) {
    transition-duration: 0.3s;
  }
  .background-highlight-icon:is(:hover, :focus-visible, :active)
    > svg:nth-child(2) {
    transform: rotate(180deg);
  }

  .background-highlight-panel {
    display: none;

    font-size: var(--affine-font-sm);
    box-sizing: border-box;
    position: absolute;
    min-width: 173px;
    padding: 8px 4px;
    overflow-y: auto;

    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    border-radius: 8px;
    z-index: var(--affine-z-index-popover);
  }
`;

export const formatBarStyle = css`
  .affine-format-bar-widget {
    box-sizing: border-box;
    position: absolute;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    gap: 4px;
    height: 40px;
    width: max-content;

    border-radius: 8px;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    z-index: var(--affine-z-index-popover);
    user-select: none;
  }

  .divider {
    width: 1px;
    height: 24px;
    background-color: var(--affine-border-color);
  }

  ${paragraphButtonStyle}
  ${tooltipStyle}
`;
