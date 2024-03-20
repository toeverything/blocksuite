import { css } from 'lit';

export const dividerStyle = css`
  .divider {
    display: flex;
    padding: 0px 0px 4px 0px;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;

    & > div {
      height: 0.5px;
      width: 100%;
      background: #e3e2e4;
    }
  }
`;

export const actionItemStyle = css`
  .action-item {
    display: flex;
    padding: 4px 12px;
    align-items: center;
    gap: 4px;
    align-self: stretch;

    border-radius: 4px;

    &:hover {
      background: var(--light-detailColor-hoverColor, rgba(0, 0, 0, 0.04));
    }

    svg {
      color: var(--affine-icon-secondary, #77757d);
    }

    .content {
      display: flex;
      padding: 0px 4px;
      align-items: center;
      flex: 1 0 0;

      & > div {
        color: var(--light-textColor-textPrimaryColor, #121212);
        text-align: justify;
        font-feature-settings:
          'clig' off,
          'liga' off;

        /* light/sm */
        font-family: Inter;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 22px; /* 157.143% */
      }
    }
  }
`;
