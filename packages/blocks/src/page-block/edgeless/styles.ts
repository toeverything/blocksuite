import { css } from 'lit';
import { toolTipStyle } from '../../components/tooltip.js';

export const toolbarStyle = css`
  .edgeless-toolbar-container {
    fill: currentColor;
    height: 320px;
    position: absolute;
    left: 12px;
    top: 0;
    bottom: 100px;
    margin: auto;
    z-index: 999;
  }

  .styled-toolbar-wrapper {
    width: 44px;
    border-radius: 10px;
    box-shadow: 4px 4px 7px rgba(58, 76, 92, 0.04),
      -4px -4px 13px rgba(58, 76, 92, 0.02), 6px 6px 36px rgba(58, 76, 92, 0.06);
    padding: 4px;
    background: #fff;
    transition: background 0.5s;
    margin-bottom: 12px;
  }

  .toolbar-basic {
    width: 36px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    align-content: unset;
    border-radius: 5px;
  }

  .toolbar {
    color: #888a9e;
    cursor: pointer;
  }

  .toolbar-disabled {
    color: var(--affine-disable-color);
    cursor: not-allowed;
  }

  .toolbar:hover {
    color: var(--affine-primary-color);
    background: var(--affine-hover-background);
  }

  tool-tip {
    padding: 0 12px;
  }

  ${toolTipStyle}
`;
