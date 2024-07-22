export enum ErrorCode {
  DefaultRuntimeError = 1,
  ValueNotExists,
  ValueNotInstanceOf,
  ValueNotEqual,
  MigrationError,
  SchemaValidateError,
  TransformerError,
  InlineEditorError,
  TransformerNotImplementedError,
  EdgelessExportError,

  // Fatal error should be greater than 10000
  DefaultFatalError = 10000,
  NoRootModelError,
  NoneSupportedSSRError,
}
