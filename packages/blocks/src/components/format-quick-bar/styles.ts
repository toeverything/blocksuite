import { css } from 'lit';
import { toolTipStyle } from '../tooltip';

const paragraphPanelStyle = css`
  .paragraph-button > svg:nth-child(2) {
    transition-duration: 0.3s;
  }
  .paragraph-button:is(:hover, :focus-visible, :active) > svg:nth-child(2) {
    transform: rotate(180deg);
  }

  .paragraph-panel {
    box-sizing: border-box;
    position: absolute;
    width: 173px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 8px 4px;

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0px 10px 10px 10px;
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

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    z-index: var(--affine-z-index-popover);
  }

  .divider {
    width: 1px;
    height: 100%;
    background-color: #e0e6eb;
  }

  ${paragraphPanelStyle}
  ${toolTipStyle}
`;
