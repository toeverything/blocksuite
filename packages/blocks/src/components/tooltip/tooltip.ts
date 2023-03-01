import { css } from 'lit';

/**
 * @example
 * ```html
 * <icon-button class="has-tool-tip" style="${toolTipStyle}">
 *    Button
 *    <tool-tip inert role="tooltip">Tooltip</tool-tip>
 * </icon-button>
 * ```
 * Reference to https://web.dev/building-a-tooltip-component/
 */
export const toolTipStyle = css`
  tool-tip {
    font-family: var(--affine-font-family);
    position: absolute;

    inline-size: max-content;
    text-align: center;
    font-size: var(--affine-font-sm);
    padding: 4px 12px;
    color: var(--affine-tooltip-color);
    background: var(--affine-tooltip-background);
    box-shadow: var(--affine-tooltip-shadow);
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
    user-select: none;

    /* Default is top-start */
    left: 0;
    top: 0;
    border-radius: 10px 10px 10px 0;
    transform: translate(0, calc(-100% - 8px));
  }

  tool-tip:is([tip-position='top']) {
    left: 50%;
    border-radius: 10px;
    transform: translate(-50%, calc(-100% - 8px));
  }
  tool-tip:is([tip-position='right-start']) {
    left: unset;
    right: 0;
    transform: translateX(calc(100% + 8px));
    border-radius: 0 10px 10px 10px;
  }
  tool-tip:is([tip-position='left']) {
    left: 0;
    top: 50%;
    transform: translate(calc(-100% - 8px), -50%);
    border-radius: 10px 10px 0 10px;
  }
  tool-tip:is([tip-position='bottom']) {
    top: unset;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, calc(100% + 8px));
    border-radius: 10px;
  }

  /* Only work for tip-position='top' now */
  tool-tip:is([arrow]) {
    transform: translate(-50%, calc(-100% - 16px));
  }
  tool-tip:is([arrow])::before {
    position: absolute;
    content: '';
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 100%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid var(--affine-tooltip-background);
  }

  .has-tool-tip {
    position: relative;
  }
  .has-tool-tip:is(:hover, :focus-visible, :active) > tool-tip {
    opacity: 1;
    transition-delay: 200ms;
  }
`;
