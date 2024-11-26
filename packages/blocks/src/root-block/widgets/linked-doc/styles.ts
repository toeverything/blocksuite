import { unsafeCSSVar, unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

import { scrollbarStyle } from '../../../_common/components/utils.js';

export const linkedDocWidgetStyles = css`
  .input-mask {
    position: absolute;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
`;

export const linkedDocPopoverStyles = css`
  :host {
    position: absolute;
  }

  .linked-doc-popover {
    position: fixed;
    left: 0;
    top: 0;
    box-sizing: border-box;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: var(--affine-font-base);
    padding: 8px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    background: ${unsafeCSSVarV2('layer/background/primary')};
    box-shadow: ${unsafeCSSVar('overlayPanelShadow')};
    border-radius: 8px;
    z-index: var(--affine-z-index-popover);
  }

  .linked-doc-popover icon-button {
    justify-content: flex-start;
    gap: 12px;
    padding: 0 8px;
  }

  .linked-doc-popover .group-title {
    color: var(--affine-text-secondary-color);
    padding: 0 8px;
    height: 24px;
    font-size: var(--affine-font-xs);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .linked-doc-popover .divider {
    margin: 4px -8px;
    border-top: 0.5px solid ${unsafeCSSVarV2('layer/insideBorder/border')};
  }

  .group icon-button svg {
    width: 20px;
    height: 20px;
  }

  .linked-doc-popover .group {
    display: flex;
    flex-direction: column;
  }

  ${scrollbarStyle('.linked-doc-popover')}
`;

export const mobileLinkedDocMenuStyles = css`
  :host {
    height: 220px;
    width: 100%;
    position: fixed;
    overflow-y: auto;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-shrink: 0;

    --border-style: 1px solid ${unsafeCSSVarV2('layer/insideBorder/border')};

    border-radius: 12px 12px 0px 0px;
    border-top: var(--border-style);
    border-right: var(--border-style);
    border-left: var(--border-style);
    background: ${unsafeCSSVarV2('layer/background/primary')};
    box-shadow: 0px -3px 10px 0px rgba(0, 0, 0, 0.07);
  }

  ${scrollbarStyle(':host')}

  .mobile-linked-doc-menu-item {
    display: flex;
    width: 100%;
    height: 44px;
    flex-shrink: 0;
    padding: 11px 20px;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    box-sizing: border-box;

    border: none;
    background: inherit;

    > svg {
      width: 20px;
      height: 20px;
      color: ${unsafeCSSVarV2('icon/primary')};
    }

    .text {
      overflow: hidden;
      color: ${unsafeCSSVarV2('text/primary')};
      text-align: justify;
      text-overflow: ellipsis;

      font-family: 'SF Pro';
      font-size: 17px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      letter-spacing: -0.43px;
    }
  }

  .mobile-linked-doc-menu-item:active {
    background: ${unsafeCSSVarV2('layer/background/hoverOverlay')};
  }
`;
