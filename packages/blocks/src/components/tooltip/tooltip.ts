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
    left: 0;
    top: 0;
    inline-size: max-content;
    text-align: center;
    font-size: var(--affine-font-sm);
    padding: 4px 12px;
    border-radius: 10px 10px 10px 0;
    color: var(--affine-tooltip-color);
    background: var(--affine-tooltip-background);
    box-shadow: var(--affine-tooltip-shadow);
    opacity: 0;
    transform: translateX(0) translateY(calc(-100% - 8px));
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
    user-select: none;
  }
  tool-tip:is([tip-position='right']) {
    left: unset;
    right: 0;
    transform: translateX(calc(100% + 8px));
    border-radius: 0 10px 10px 10px;
  }
  tool-tip:is([tip-position='left']) {
    left: 0;
    right: unset;
    transform: translateX(calc(-100% - 8px));
    border-radius: 10px 10px 0 10px;
  }
  .has-tool-tip {
    position: relative;
  }
  .has-tool-tip:is(:hover, :focus-visible, :active) > tool-tip {
    opacity: 1;
    transition-delay: 200ms;
  }
`;

// align center at four directions
export const centeredToolTipStyle = css`
  centered-tool-tip {
    font-family: var(--affine-font-family);
    position: absolute;
    inline-size: max-content;
    text-align: center;
    font-size: var(--affine-font-sm);
    padding: 4px 12px;
    border-radius: 10px;
    color: var(--affine-tooltip-color);
    background: var(--affine-primary-color);
    box-shadow: var(--affine-tooltip-shadow);
    opacity: 0;
    transition: opacity 0.2s ease, top 0.2s ease;
    pointer-events: none;
    user-select: none;
  }
  centered-tool-tip:is([tip-position='bottom']) {
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    top: calc(100% + 10px);
  }
  centered-tool-tip:is([tip-position='top']) {
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    top: 0;
    transform: translateY(calc(-100% - 10px));
  }
  centered-tool-tip:is([tip-position='left']) {
    height: min-content;
    left: 0;
    top: 0;
    bottom: 0;
    margin-bottom: auto;
    margin-top: auto;
    transform: translateX(calc(-100% - 10px));
  }
  centered-tool-tip:is([tip-position='right']) {
    height: min-content;
    right: 0;
    top: 0;
    bottom: 0;
    margin-bottom: auto;
    margin-top: auto;
    transform: translateX(calc(100% + 10px));
  }
  .has-tool-tip {
    position: relative;
  }
  .has-tool-tip:is(:hover, :focus-visible, :active) > centered-tool-tip {
    opacity: 1;
    transition-delay: 200ms;
  }
`;
