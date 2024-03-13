import { css } from 'lit';
export const styles = {
  pieMenu: css`
    .menu-container {
      user-select: none;
      z-index: calc(var(--affine-z-index-popover) + 1000);
      isolation: isolate;
    }

    .pie-menu-container > .overlay {
      top: 0;
      left: 0;
      height: 100vh;
      width: 100vw;
      position: fixed;
      background-color: rgba(0 0 0 / 0.2);
      z-index: var(--affine-z-index-popover);
    }

    .pie-menu {
      position: fixed;
      top: 0;
      left: 0;
      box-sizing: border-box;
    }
  `,

  pieNode: css`
    .pie-root-node-container {
      position: absolute;
      list-style-type: none;
    }

    .pie-node {
      position: absolute;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border: 2px solid var(--affine-border-color);
      border-radius: 50%;
      display: flex;
      font-size: 0.8rem;
      align-items: center;
      justify-content: center;
      transition: all 250ms cubic-bezier(0.775, 1.325, 0.535, 1);
    }

    .pie-node.root {
      width: 6rem;
      height: 6rem;
      padding: 0.4rem;
    }

    .pie-node.root[active='true'] .node-content > svg {
      width: 2rem;
      height: 2rem;
      font-size: 0.7rem;
    }

    .pie-node.root[active='false'] {
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

    .pie-node.child .node-content > svg {
      width: 24px;
      height: 24px;
    }

    .pie-node.child[hovering='true'] {
      border-color: var(--affine-primary-color);
      background-color: rgb(55 55 55);
      scale: 1.06;
    }

    .pie-node.child[sub-node='true']::before {
      content: '';
      position: absolute;
      top: 75%;
      left: 65%;
      width: 5px;
      height: 5px;
      border: 2px solid var(--affine-primary-color);
      border-radius: 10px;
      background-color: transparent;
      transition: background-color 30ms ease;
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
