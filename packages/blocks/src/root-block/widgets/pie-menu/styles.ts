import { css } from 'lit';
export const styles = {
  pieMenu: css`
    .menu-container {
      user-select: none;
      z-index: var(--affine-z-index-popover);
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
    }
  `,

  pieNode: css`
    .pie-root-node-container {
      position: absolute;
    }

    .pie-node {
      position: absolute;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border: 2px solid var(--affine-border-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pie-node.root {
      width: 6rem;
      height: 6rem;
      padding: 0.4rem;
      transition: all 0.2s ease;
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
      transition: all 0.2s ease;
      opacity: unset;
    }

    .pie-node.child[hovering='true'] {
      border-color: var(--affine-primary-color);
      scale: 1.06;
    }
  `,
};
