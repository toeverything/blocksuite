import { css } from 'lit';

export const linkCardModalStyles = css`
  .link-card-modal-mask {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    z-index: 1;
  }

  .link-card-modal-wrapper {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    z-index: 2;
    width: 480px;
    height: max-content;
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-menu-shadow);
    border-radius: var(--affine-popover-radius);
  }

  .link-card-modal-title {
    display: flex;
    align-items: flex-end;
    gap: var(--1, 0px);
    align-self: stretch;
    padding: 20px 20px var(--1, 0px) 24px;
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
    font-family: var(--affine-font-family);
    font-size: 18px;
    font-style: normal;
    font-weight: 600;
    line-height: 26px;
    user-select: none;
  }

  .link-card-modal-content {
    display: flex;
    min-height: 80px;
    padding: 12px 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
  }

  .link-card-modal-content-text {
    color: var(--affine-text-primary-color);
    font-family: var(--affine-font-family);
    font-size: 15px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
  }

  .link-card-modal-input {
    display: flex;
    padding: 4px 10px;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    border-radius: 8px;
    border: 1px solid var(--affine-border-color);
    background: var(--affine-white-10);
    opacity: var(--add, 1);
    outline: none;
    resize: none;
    color: var(--affine-text-primary-color);
    font-family: var(--affine-font-family);
    font-size: 15px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
    caret-color: var(--affine-brand-color);
    transition: border-color 150ms;
  }

  .link-card-modal-input:focus {
    border-color: var(--affine-brand-color);
    box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
  }

  .link-card-modal-input::placeholder {
    color: var(--affine-placeholder-color);
    font-family: var(--affine-font-family);
    font-size: 15px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
  }

  .link-card-modal-input.description {
    height: 112px;
  }

  .link-card-modal-action {
    display: flex;
    padding: 20px 24px;
    justify-content: flex-end;
    align-items: center;
    gap: 20px;
    align-self: stretch;
    border-radius: var(--1, 0px);
    opacity: var(--add, 1);
    user-select: none;
  }

  .link-card-modal-button {
    display: flex;
    padding: 4px 18px;
    justify-content: center;
    align-items: center;
    gap: 4px;
    border-radius: 8px;
    font-family: var(--affine-font-family);
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px;
    opacity: var(--add, 1);
    cursor: pointer;
  }

  .link-card-modal-button.cancel {
    border: 1px solid var(--affine-border-color);
    background: var(--affine-white-10);
    color: var(--affine-text-primary-color);
  }

  .link-card-modal-button.save,
  .link-card-modal-button.confirm {
    border: 1px solid var(--affine-black-10);
    background: var(--affine-primary-color);
    color: var(--affine-pure-white);
  }

  .link-card-modal-button.save.disabled,
  .link-card-modal-button.confirm.disabled {
    background: rgba(30, 150, 235, 0.4);
  }
`;
