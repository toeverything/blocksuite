import { css } from 'lit';

export const pieMenuStyles = css`
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
`;

export const pieNodeStyles = css`
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
`;
