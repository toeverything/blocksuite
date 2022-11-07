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
    position: absolute;
    left: 0;
    top: 0;
    inline-size: max-content;
    text-align: center;
    font-size: var(--affine-font-xs);
    padding: 4px 12px;
    border-radius: 10px 10px 10px 0px;
    color: var(--affine-tooltip-color);
    background: var(--affine-tooltip-background);
    box-shadow: var(--affine-tooltip-shadow);
    border-radius: 10px 10px 10px 0px;

    opacity: 0;
    transform: translateX(0) translateY(calc(-100% - 8px));
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
    user-select: none;
  }

  .has-tool-tip {
    position: relative;
  }
  .has-tool-tip:is(:hover, :focus-visible, :active) > tool-tip {
    opacity: 1;
    transition-delay: 200ms;
  }
`;
