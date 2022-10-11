import { unsafeCSS } from 'lit';

export const styles = unsafeCSS`
  .affine-default-page-block-container {
    font-family: Avenir Next, apple-system, BlinkMacSystemFont, Helvetica Neue,
      Tahoma, PingFang SC, Microsoft Yahei, Arial, Hiragino Sans GB, sans-serif,
      Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
    font-size: 18px;
    line-height: 26px;
  }

  .affine-default-page-block-container > .affine-block-children-container {
    padding-left: 0;
  }

  .affine-default-page-block-title {
    font-size: 40px;
    line-height: 50px;
    font-weight: bold;
    outline: none;
    border: 0;
    font-family: inherit;
  }
  .affine-default-page-block-title::placeholder {
    color: #ddd;
  }
`;

export default styles;
