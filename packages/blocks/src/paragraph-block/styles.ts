import { css } from 'lit';

export const styles = css`
  .affine-paragraph-block-container.selected {
    background-color: rgba(152, 172, 189, 0.1);
  }
  .h1 {
    font-size: 30px;
    line-height: 40px;
    margin-top: 40px;
    font-weight: bold;
  }
  .h2 {
    font-size: 28px;
    line-height: 38px;
    margin-top: 38px;
    font-weight: bold;
  }
  .h3 {
    font-size: 26px;
    line-height: 36px;
    margin-top: 36px;
    font-weight: bold;
  }
  .h4 {
    font-size: 24px;
    line-height: 34px;
    margin-top: 34px;
    font-weight: bold;
  }
  .h5 {
    font-size: 22px;
    line-height: 30px;
    margin-top: 30px;
    font-weight: bold;
  }
  .h6 {
    font-size: 20px;
    line-height: 28px;
    margin-top: 28px;
    font-weight: bold;
  }
  .quote {
    font-size: 18px;
    line-height: 26px;
    padding-left: 12px;
    margin-top: 18px;
    color: #4c6275;
    position: relative;
  }
  .quote::after {
    content: '';
    width: 4px;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    background: #4c6275;
    border-radius: 4px;
  }
  .paragraph {
    margin-top: 18px;
  }
`;

export default styles;
