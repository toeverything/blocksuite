export enum ErrorCode {
  DefaultRuntimeError = 1,
  ValueNotExists,
  ValueNotInstanceOf,
  ValueNotEqual,
  MigrationError,
  SchemaValidateError,

  // Fatal error should be greater than 10000
  DefaultFatalError = 10000,
}
