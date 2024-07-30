import { css } from 'lit';

export const menuItemStyles = css`
  .menu-item {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px var(--item-padding, 12px);
    gap: 4px;
    align-self: stretch;
    border-radius: 4px;
    box-sizing: border-box;
  }
  .menu-item:hover {
    background: var(--affine-hover-color);
    cursor: pointer;
  }
  .item-icon {
    display: flex;
    color: var(--item-icon-color, var(--affine-brand-color));
  }
  .menu-item:hover .item-icon {
    color: var(--item-icon-hover-color, var(--affine-brand-color));
  }
  .menu-item.discard:hover {
    background: var(--affine-background-error-color);
    .item-name,
    .item-icon,
    .enter-icon {
      color: var(--affine-error-color);
    }
  }
  .item-name {
    display: flex;
    padding: 0px 4px;
    align-items: baseline;
    flex: 1 0 0;
    color: var(--affine-text-primary-color);
    text-align: start;
    white-space: nowrap;
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
  }

  .item-beta {
    color: var(--affine-text-secondary-color);
    font-size: var(--affine-font-xs);
    font-weight: 500;
    margin-left: 0.5em;
  }

  .enter-icon,
  .arrow-right-icon {
    color: var(--affine-icon-color);
    display: flex;
  }
  .enter-icon {
    opacity: 0;
  }
  .arrow-right-icon,
  .menu-item:hover .enter-icon {
    opacity: 1;
  }
`;
