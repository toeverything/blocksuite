// type shims for https://github.com/toeverything/blocksuite/issues/398
// remove this until hotkeys-js and quill turned to `type: "module"`

declare module 'hotkeys-js' {
  import hotkeys = require('hotkeys-js/index');
  export type * from 'hotkeys-js/index' assert { 'resolution-mode': 'require' };
  declare const hotkeysDefault: typeof hotkeys.default;
  export default hotkeysDefault;
}

declare module 'quill' {
  import quill = require('quill/index');
  export type * from 'quill/index' assert { 'resolution-mode': 'require' };
  declare const quillDefault: typeof quill.default;
  export default quillDefault;
}
