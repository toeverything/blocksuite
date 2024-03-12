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
    .pie-node {
      position: absolute;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border: 1px solid var(--affine-border-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pie-node.root {
      width: 6rem;
      height: 6rem;
      padding: 0.4rem;
    }

    .pie-node.child {
      width: 3rem;
      height: 3rem;
      padding: 0.6rem;
    }
  `,
};
