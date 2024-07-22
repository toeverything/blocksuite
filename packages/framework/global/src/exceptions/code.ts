export enum ErrorCode {
  DefaultRuntimeError = 1,
  ReactiveProxyError,
  DocCollectionError,
  ModelCRUDError,
  ValueNotExists,
  ValueNotInstanceOf,
  ValueNotEqual,
  MigrationError,
  SchemaValidateError,
  TransformerError,
  InlineEditorError,
  TransformerNotImplementedError,
  EdgelessExportError,
  CommandError,
  EventDispatcherError,
  SelectionError,
  EdgelessBlockError,

  // Fatal error should be greater than 10000
  DefaultFatalError = 10000,
  NoRootModelError,
  NoneSupportedSSRError,
}
