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
    --affine-tooltip-offset: 8px;
    --affine-tooltip-round: 4px;
    font-family: var(--affine-font-family);
    position: absolute;
    inline-size: max-content;
    text-align: center;
    font-size: var(--affine-font-sm);
    padding: 5px 12px;
    color: var(--affine-white);
    background: var(--affine-tooltip);
    opacity: 0;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
    pointer-events: none;
    user-select: none;

    /* Default is top-start */
    left: 0;
    top: 0;
    border-radius: var(--affine-tooltip-round);
    transform: translate(0, calc(-100% - var(--affine-tooltip-offset)));
  }
  tool-tip:is([tip-position='top']) {
    left: 50%;
    border-radius: var(--affine-tooltip-round);
    transform: translate(-50%, calc(-100% - var(--affine-tooltip-offset)));
  }
  tool-tip:is([tip-position='right']) {
    left: unset;
    right: 0;
    transform: translateX(calc(100% + var(--affine-tooltip-offset)));
  }
  tool-tip:is([tip-position='right']):not(:is([arrow])) {
    border-top-left-radius: 0;
  }
  tool-tip:is([tip-position='left']) {
    left: 0;
    top: 50%;
    transform: translate(calc(-100% - var(--affine-tooltip-offset)), -50%);
  }
  tool-tip:is([tip-position='bottom']) {
    top: unset;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, calc(100% + var(--affine-tooltip-offset)));
  }

  /** basic triangle style */
  tool-tip:is([arrow])::before {
    position: absolute;
    content: '';
    background: var(--affine-tooltip);
    width: 10px;
    height: 10px;
    border-radius: 2px;
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%);
  }

  /* work for tip-position='top' */
  tool-tip:is([arrow]):is([tip-position='top']) {
    transform: translate(-50%, calc(-100% - var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='top'])::before {
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 40%) scaleX(0.8) rotate(135deg);
  }

  /* work for tip-position='right' */
  tool-tip:is([arrow]):is([tip-position='right']) {
    transform: translateX(calc(100% + var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='right'])::before {
    left: 0;
    bottom: 50%;
    transform: translate(-40%, 50%) scaleY(0.8) rotate(-135deg);
  }

  /* work for tip-position='left' */
  tool-tip:is([arrow]):is([tip-position='left']) {
    transform: translate(calc(-100% - var(--affine-tooltip-offset) * 2), -50%);
  }
  tool-tip:is([arrow]):is([tip-position='left'])::before {
    right: 0;
    bottom: 50%;
    transform: translate(40%, 50%) scaleY(0.8) rotate(45deg);
  }

  /* work for tip-position='bottom' */
  tool-tip:is([arrow]):is([tip-position='bottom']) {
    transform: translate(-50%, calc(100% + var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='bottom'])::before {
    left: 50%;
    bottom: 100%;
    transform: translate(-50%, 60%) scaleX(0.8) rotate(-45deg);
  }

  /* work for tip-position='top-end' */
  tool-tip:is([arrow]):is([tip-position='top-end']) {
    transform: translate(-15%, calc(-100% - var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='top-end'])::before {
    left: 30%;
    bottom: 0;
    transform: translate(-50%, 40%) scaleX(0.8) rotate(135deg);
  }
  /* work for tip-position='top-start' */
  tool-tip:is([arrow]):is([tip-position='top-start']) {
    transform: translate(-75%, calc(-100% - var(--affine-tooltip-offset) * 2));
  }
  tool-tip:is([arrow]):is([tip-position='top-start'])::before {
    right: 5%;
    bottom: 0;
    transform: translate(-50%, 40%) scaleX(0.8) rotate(135deg);
  }
  .has-tool-tip {
    position: relative;
  }
  .has-tool-tip:is(:hover, :focus-visible, :active) > tool-tip {
    opacity: 1;
    transition-delay: 200ms;
  }
  /** style for shortcut tooltip */
  .tooltip-with-shortcut {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 10px;
  }
  .tooltip__shortcut {
    font-size: 12px;
    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;
    height: 16px;
    min-width: 16px;
  }
  .tooltip__shortcut::before {
    content: '';
    border-radius: 4px;
    position: absolute;
    inset: 0;
    background: currentColor;
    opacity: 0.2;
  }
`;
