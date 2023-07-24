import { css } from 'lit';

export const styles = css`
  .attachment-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px 24px;
    margin-top: calc(var(--affine-paragraph-space) + 8px);

    border-radius: 12px;
    border: 3px solid var(--affine-background-overlay-panel-color);
    background: var(--affine-card-background-blue);
    background: var(--light-background-card-background-blue);
    box-shadow: var(--affine-shadow-1);
  }

  .attachment-name {
    display: flex;
    align-items: center;
    gap: 8px;

    color: var(--affine-text-primary-color);
    font-size: var(--affine-font-sm);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    fill: var(--affine-icon-color);
  }

  .attachment-size {
    color: var(--affine-text-secondary-color);
    font-size: var(--affine-font-xs);
  }
`;
