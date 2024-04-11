import { css } from 'lit';

export const menuItemStyles = css`
  .menu-item {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px 12px;
    gap: 4px;
    align-self: stretch;
    border-radius: 4px;
    box-sizing: border-box;
    &:hover {
      background: var(--affine-hover-color);
      cursor: pointer;
    }
  }
  .item-icon {
    display: flex;
    color: var(--item-icon-color, var(--affine-brand-color));
  }
  .menu-item:hover .item-icon {
    color: var(--item-icon-hover-color, var(--affine-brand-color));
  }
  .item-name {
    display: flex;
    padding: 0px 4px;
    align-items: center;
    flex: 1 0 0;
    color: var(--affine-text-primary-color);
    text-align: justify;
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-size: var(--affine-font-sm);
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
  }
  .enter-icon,
  .arrow-right-icon {
    color: var(--affine-icon-color);
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-40%);
  }
  .enter-icon {
    display: none;
  }
  .arrow-right-icon,
  .menu-item:hover .enter-icon {
    display: flex;
  }
`;
