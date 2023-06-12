import { css } from 'lit';

export const actionStyles = css`
  .action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 32px;
    padding: 4px 8px;
    border-radius: 5px;
    cursor: pointer;
  }
  .action:hover {
    background: var(--affine-hover-color);
  }
  .action-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .action-content > svg {
    width: 20px;
    height: 20px;
    color: var(--affine-icon-color);
    fill: var(--affine-icon-color);
  }
  .action-divider {
    height: 0.5px;
    background: var(--affine-divider-color);
    margin: 8px 0;
  }
`;

export const styles = css`
  :host {
    position: absolute;
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-menu-shadow);
    padding: 8px;
    border: 1px solid var(--affine-border-color);
    border-radius: 8px;
    z-index: 1;
    font-family: var(--affine-font-family);
  }

  .affine-database-edit-column-popup {
    display: flex;
    flex-direction: column;
    color: var(--affine-text-primary-color);
  }
  .affine-database-edit-column-popup * {
    box-sizing: border-box;
  }
  .rename,
  .delete,
  .column-type {
    fill: var(--affine-icon-color);
  }
  .column-type > svg {
    transform: rotate(-90deg);
  }
  ${actionStyles}
`;
