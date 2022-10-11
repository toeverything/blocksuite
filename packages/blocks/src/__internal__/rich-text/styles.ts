import { unsafeCSS } from 'lit';

/*
 * This style is most simple to reset the default styles of the quill editor
 * User should custom the styles of the block in the block itself
 */
export const styles = unsafeCSS`
  .ql-container {
    box-sizing: border-box;
    height: 100%;
    margin: 0;
    position: relative;
  }
  .ql-container.ql-disabled .ql-tooltip {
    visibility: hidden;
  }
  .ql-clipboard {
    left: -100000px;
    height: 1px;
    overflow-y: hidden;
    position: absolute;
    top: 50%;
  }
  .ql-container p {
    margin: 0;
    padding: 0;
  }
  .ql-editor {
    box-sizing: border-box;
    height: 100%;
    outline: none;
    tab-size: 4;
    -moz-tab-size: 4;
    text-align: left;
    white-space: pre-wrap;
    word-wrap: break-word;
    padding: 3px 0;
  }
  .ql-editor > * {
    cursor: text;
  }
`;

export default styles;
