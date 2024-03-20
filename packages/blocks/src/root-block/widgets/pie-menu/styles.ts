import { css } from 'lit';
export const styles = {
  pieMenu: css`
    .menu-container {
      user-select: none;
      z-index: var(--affine-z-index-popover);
      isolation: isolate;
    }

    .pie-menu-container > .overlay {
      top: 0;
      left: 0;
      height: 100vh;
      width: 100vw;
      position: fixed;
      z-index: var(--affine-z-index-popover);
    }

    .pie-menu {
      position: fixed;
      top: 0;
      left: 0;
      box-sizing: border-box;
      z-index: calc(
        var(--affine-z-index-popover) + 10
      ); /* This is important or else will hover will not work  */
    }
  `,

  pieNode: css`
    .pie-parent-node-container {
      position: absolute;
      list-style-type: none;
    }

    .pie-node {
      position: absolute;
      background: var(--affine-background-overlay-panel-color);
      user-select: none;
      box-shadow: var(--affine-shadow-2);
      border: 2px solid var(--affine-border-color);
      border-radius: 50%;
      display: flex;
      font-size: 0.8rem;
      align-items: center;
      justify-content: center;
      text-align: center;
      transition: all 250ms cubic-bezier(0.775, 1.325, 0.535, 1);
    }

    .rotator {
      position: absolute;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border: 2px solid var(--affine-primary-color);
      border-radius: 50%;
      width: 7px;
      height: 7px;
      top: 50%;
      left: 50%;
    }
    .pie-node.center {
      width: 6rem;
      height: 6rem;
      padding: 0.4rem;
    }

    .pie-node.center[active='true'] .node-content > svg,
    .pie-node.center[active='true'] .node-content > .color-unit,
    .pie-node.center[active='true'] .node-content > .color-unit > svg {
      width: 2rem !important;
      height: 2rem !important;
    }

    .pie-node.center[active='false'] {
      width: 3rem;
      height: 3rem;
      opacity: 0.6;
    }

    .pie-node.child {
      width: 3rem;
      height: 3rem;
      padding: 0.6rem;
      animation: my-anim 250ms cubic-bezier(0.775, 1.325, 0.535, 1);
    }

    .pie-node.child.node-color {
      width: 0.7rem;
      height: 0.7rem;
    }

    .pie-node.child:not(.node-color)::after {
      content: attr(index);
      color: var(--affine-text-secondary-color);
      position: absolute;
      font-size: 8px;
      bottom: 10%;
      right: 30%;
    }

    .node-content > svg {
      width: 24px;
      height: 24px;
    }

    .pie-node.child[hovering='true'] {
      border-color: var(--affine-primary-color);
      background-color: var(--affine-hover-color-filled);
      scale: 1.06;
    }

    .pie-node.child[submenu='true']::before {
      content: '';
      position: absolute;
      top: 50%;
      right: 10%;
      transform: translateY(-50%);
      width: 5px;
      height: 5px;
      background-color: var(--affine-primary-color);
      border-radius: 50%;
    }

    @keyframes my-anim {
      0% {
        transform: translate(0, 0);
        opacity: 0;
      }
      40% {
        opacity: 0;
      }
      100% {
        opacity: 100;
      }
    }
  `,
};
