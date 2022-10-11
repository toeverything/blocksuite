import { css } from 'lit';

export const styles = css`
  .affine-list-block-container {
    box-sizing: border-box;
    margin-top: 18px;
  }
  .affine-list-block-container .affine-list-block-container {
    margin-top: 0;
  }
  .affine-list-block-container.selected {
    background-color: rgba(152, 172, 189, 0.1);
  }
  .affine-list-rich-text-wrapper {
    display: flex;
  }
  .affine-list-rich-text-wrapper rich-text {
    flex: 1;
  }
`;

export default styles;
