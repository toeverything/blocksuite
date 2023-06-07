import { css } from 'lit';

/**
 * @example
 * ```html
 * <icon-button class="has-tool-tip" style="${tooltipStyle}">
 *    Button
 *    <tool-tip inert role="tooltip">Tooltip</tool-tip>
 * </icon-button>
 * ```
 * Reference to https://web.dev/building-a-tooltip-component/
 */
export const tooltipStyle = css`
  tool-tip {
    font-family: var(--affine-font-family);
    position: absolute;

    inline-size: max-content;
    text-align: center;
    font-size: var(--affine-font-sm);
    padding: 4px 12px;
    color: var(--affine-white);
    background: var(--affine-tooltip);
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
  tool-tip:is([tip-position='right']) {
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

  /* work for tip-position='top' */
  tool-tip:is([arrow]):is([tip-position='top']) {
    transform: translate(-50%, calc(-100% - 16px));
  }
  tool-tip:is([arrow]):is([tip-position='top'])::before {
    position: absolute;
    content: '';
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 100%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid var(--affine-tooltip);
  }

  /* work for tip-position='right' */
  tool-tip:is([arrow]):is([tip-position='right']) {
    transform: translateX(calc(100% + 16px));
  }
  tool-tip:is([arrow]):is([tip-position='right'])::before {
    position: absolute;
    content: '';
    left: 0;
    bottom: 50%;
    transform: translate(-100%, 50%);
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 6px solid var(--affine-tooltip);
  }

  /* work for tip-position='left' */
  tool-tip:is([arrow]):is([tip-position='left']) {
    transform: translate(calc(-100% - 16px), -50%);
  }
  tool-tip:is([arrow]):is([tip-position='left'])::before {
    position: absolute;
    content: '';
    right: 0;
    bottom: 50%;
    transform: translate(100%, 50%);
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 6px solid var(--affine-tooltip);
  }

  /* work for tip-position='bottom' */
  tool-tip:is([arrow]):is([tip-position='bottom']) {
    transform: translate(-50%, calc(100% + 16px));
  }
  tool-tip:is([arrow]):is([tip-position='bottom'])::before {
    position: absolute;
    content: '';
    left: 50%;
    top: 0;
    transform: translate(-50%, -100%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 6px solid var(--affine-tooltip);
  }

  .has-tool-tip {
    position: relative;
  }
  .has-tool-tip:is(:hover, :focus-visible, :active) > tool-tip {
    opacity: 1;
    transition-delay: 200ms;
  }
`;
