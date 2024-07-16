import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

export const styles = css`
  .affine-ai-chat-block-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 16px;
    background: var(--affine-white);
    color: var(--affine-text-primary-color);
    line-height: 22px;
    font-size: var(--affine-font-sm);
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    border-radius: 8px;

    .ai-chat-messages,
    .ai-chat-message,
    .ai-chat-block-button {
      display: flex;
      width: 100%;
    }

    .ai-chat-messages {
      flex-direction: column;
      flex: 1 0 0;
      gap: 24px;
      -webkit-mask-image: linear-gradient(
        0deg,
        rgba(255, 255, 255, 0) -10.62%,
        #fff 40.63%
      );
      mask-image: linear-gradient(
        0deg,
        rgba(255, 255, 255, 0) -10.62%,
        #fff 40.63%
      );
      overflow: hidden;
    }

    .ai-chat-message {
      flex-direction: column;
      gap: 4px;
    }

    .ai-chat-content,
    .images-container {
      display: flex;
      width: 100%;
      gap: 8px;
      flex-direction: column;
    }

    .ai-chat-content {
      padding-left: 34px;
      font-weight: 400;
    }

    .ai-chat-block-button {
      height: 22px;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      cursor: pointer;
      svg {
        color: var(--affine-icon-color);
      }
    }
  }
`;
